from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from middleware.auth_middleware import require_verified_user
from database import supabase
from services.llm_service import LLMService
from services.faiss_store import FAISSStore
from services.embeddings import EmbeddingsService
from services.document_parser import DocumentParser


async def _get_document_text(resource_id: str) -> str:
    """
    Try to get document text from FAISS chunks first (fast, already extracted).
    Fall back to downloading the file from Supabase Storage and parsing it on the fly.
    """
    # 1. Try FAISS index (fast path — available if file was uploaded via the Upload form)
    try:
        _, chunks = FAISSStore.load_index_and_chunks(resource_id)
        if chunks:
            return " ".join(chunks)
    except Exception:
        pass

    # 2. Slow path — download from storage and parse directly
    res = supabase.table("resources").select("file_url, title").eq("id", resource_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Resource not found")

    file_url = res.data.get("file_url", "")
    BUCKET_MARKER = "/object/public/resources/"
    if BUCKET_MARKER in file_url:
        from urllib.parse import unquote
        storage_path = unquote(file_url.split(BUCKET_MARKER, 1)[1])
    else:
        raise HTTPException(status_code=404, detail="Cannot locate file in storage.")

    try:
        file_bytes = supabase.storage.from_("resources").download(storage_path)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to download file: {str(e)}")

    filename = storage_path.split("/")[-1]
    text = DocumentParser.parse(filename, file_bytes)
    # Never raise 422 — always return something usable
    if not text or not text.strip():
        text = "Document content could not be fully extracted. Please use the AI chat to ask questions about this document."
    return text

router = APIRouter(
    tags=["AI Study Tools"],
    dependencies=[Depends(require_verified_user)] # Study tools require verified accounts
)

class ToolRequest(BaseModel):
    resource_id: str

class DiagramRequest(BaseModel):
    resource_id: str
    topic: str

@router.post("/summarize")
async def summarize_document(payload: ToolRequest):
    resource_id = payload.resource_id

    # 1. Check database cache
    res = supabase.table("resources").select("summary").eq("id", resource_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    cached_summary = res.data.get("summary")
    if cached_summary:
        return cached_summary

    # 2. Get document text (FAISS chunks or direct PDF parse)
    document_text = await _get_document_text(resource_id)

    # 3. Generate summary
    summary_data = await LLMService.generate_summary(document_text)

    # 4. Save to cache
    supabase.table("resources").update({"summary": summary_data}).eq("id", resource_id).execute()

    return summary_data

@router.post("/generate-questions")
async def generate_questions(payload: ToolRequest):
    resource_id = payload.resource_id

    # 1. Check cache
    res = supabase.table("resources").select("questions").eq("id", resource_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    cached_questions = res.data.get("questions")
    if cached_questions:
        return {"questions": cached_questions}

    # 2. Get document text (FAISS chunks or direct PDF parse)
    document_text = await _get_document_text(resource_id)

    # 3. Generate
    questions = await LLMService.generate_questions(document_text)

    # 4. Cache
    supabase.table("resources").update({"questions": questions}).eq("id", resource_id).execute()

    return {"questions": questions}

@router.post("/generate-revision-notes")
async def generate_revision_notes(payload: ToolRequest):
    resource_id = payload.resource_id

    # 1. Check cache
    res = supabase.table("resources").select("revision_notes").eq("id", resource_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    cached_notes = res.data.get("revision_notes")
    if cached_notes:
        return cached_notes

    # 2. Get document text (FAISS chunks or direct PDF parse)
    document_text = await _get_document_text(resource_id)

    # 3. Generate
    notes_data = await LLMService.generate_revision_notes(document_text)

    # 4. Cache
    supabase.table("resources").update({"revision_notes": notes_data}).eq("id", resource_id).execute()

    return notes_data

@router.post("/generate-diagram")
async def generate_diagram(payload: DiagramRequest):
    resource_id = payload.resource_id
    topic = payload.topic

    # 1. Try FAISS first (fast path for uploaded documents)
    context_chunks = []
    try:
        query_vector = EmbeddingsService.embed_query(topic)
        search_results = FAISSStore.search(resource_id, query_vector, k=5)
        context_chunks = [res["chunk"] for res in search_results]
    except Exception:
        pass

    # 2. If FAISS unavailable, fall back to direct PDF parse and take first 5 chunks
    if not context_chunks:
        try:
            document_text = await _get_document_text(resource_id)
            # Split into rough chunks and take first 5 as context
            words = document_text.split()
            chunk_size = max(1, len(words) // 5)
            context_chunks = [
                " ".join(words[i * chunk_size:(i + 1) * chunk_size])
                for i in range(5)
                if i * chunk_size < len(words)
            ]
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Could not load document content: {str(e)}")

    if not context_chunks:
        raise HTTPException(status_code=400, detail="No content found in document for this topic.")

    # 3. Generate diagram
    diagram_data = await LLMService.generate_diagram(topic, context_chunks)
    return diagram_data
