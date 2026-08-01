from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from middleware.auth_middleware import get_current_user
from database import supabase

router = APIRouter(
    prefix="/resources",
    tags=["Resources"],
    dependencies=[Depends(get_current_user)]
)

@router.get("")
async def get_resources(
    search: Optional[str] = None,
    subject: Optional[str] = None,
    sort: Optional[str] = Query("popularity", pattern="^(popularity|newest|oldest|views|likes)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    offset = (page - 1) * limit

    # Base query connecting to resources and joining users table for uploader name
    query = supabase.table("resources").select("*, users(name)", count="exact")

    if search:
        # search by title or description
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
    
    if subject and subject != "All":
        query = query.eq("subject", subject)

    if sort == "newest":
        query = query.order("created_at", desc=True)
    elif sort == "oldest":
        query = query.order("created_at", desc=False)
    elif sort == "views":
        query = query.order("views", desc=True)
    elif sort == "likes":
        query = query.order("likes", desc=True)
    else: # popularity (views + likes approximation, Supabase SDK doesn't natively do formula ordering via RPC unless we write one)
        # For simplicity without writing SQL function, we order by likes then views
        query = query.order("likes", desc=True).order("views", desc=True)

    query = query.range(offset, offset + limit - 1)
    
    response = query.execute()

    # Format response
    resources = []
    for row in response.data:
        uploader_name = row.get("users", {}).get("name") if row.get("users") else "Unknown"
        # Flatten the user object
        row["uploader_name"] = uploader_name
        # Remove nested users
        if "users" in row:
            del row["users"]
        resources.append(row)

    total_count = response.count if response.count is not None else 0
    total_pages = (total_count + limit - 1) // limit

    return {
        "resources": resources,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{resource_id}")
async def get_resource(
    resource_id: str,
    no_increment: bool = Query(False)
):
    # Fetch resource
    response = supabase.table("resources").select("*, users(name)").eq("id", resource_id).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    resource = response.data
    resource["uploader_name"] = resource.get("users", {}).get("name") if resource.get("users") else "Unknown"
    if "users" in resource:
        del resource["users"]

    # Only increment views when no_increment flag is not set
    # The frontend passes no_increment=true on repeat visits within the same session
    if not no_increment:
        current_views = resource.get("views", 0)
        supabase.table("resources").update({"views": current_views + 1}).eq("id", resource_id).execute()
        resource["views"] = current_views + 1
    
    return resource

import uuid
from fastapi import File, Form, UploadFile, BackgroundTasks
from middleware.auth_middleware import require_verified_user
from services.document_parser import DocumentParser
from services.text_chunker import TextChunker
from services.embeddings import EmbeddingsService
from services.faiss_store import FAISSStore

from services.llm_service import LLMService

import asyncio

def _run_process_and_index_document(resource_id: str, file_content: bytes, filename: str):
    """
    Sync wrapper for background_tasks.add_task — FastAPI runs background tasks
    in a thread pool, so we need asyncio.run() to drive the async LLM calls inside.
    """
    asyncio.run(_process_and_index_document_async(resource_id, file_content, filename))

async def _process_and_index_document_async(resource_id: str, file_content: bytes, filename: str):
    """Background task to run RAG ingestion pipeline (extract, chunk, embed, index) and generate study tools cache."""
    try:
        # 1. Extract text
        text = DocumentParser.parse(filename, file_content)

        # 2. Chunk text
        chunks = TextChunker.chunk_text(text)

        # 3. Create embeddings
        embeddings = EmbeddingsService.embed_documents(chunks)

        # 4. Save to FAISS index
        FAISSStore.save_index(resource_id, chunks, embeddings)
        print(f"RAG Indexing complete for resource {resource_id}. Chunks: {len(chunks)}")

        # 5. Auto-generate and cache Study Tools
        try:
            print(f"Auto-generating study tools cache for resource {resource_id}...")
            summary_data   = await LLMService.generate_summary(text)
            questions_data = await LLMService.generate_questions(text)
            notes_data     = await LLMService.generate_revision_notes(text)

            supabase.table("resources").update({
                "summary":        summary_data,
                "questions":      questions_data,
                "revision_notes": notes_data
            }).eq("id", resource_id).execute()
            print(f"Study tools cached for resource {resource_id}!")
        except Exception as ae:
            print(f"Warning: Failed to auto-generate study tools cache: {ae}")

    except Exception as e:
        print(f"Error in RAG ingestion pipeline for resource {resource_id}: {str(e)}")

@router.post("")
async def upload_resource(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(require_verified_user)
):
    # Validate file type
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in ["pdf", "docx", "doc", "txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

    # Read file content
    file_content = await file.read()
    
    # Validate file size (20MB limit)
    if len(file_content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum allowed size is 20MB.")

    # Generate resource ID and upload path
    resource_id = str(uuid.uuid4())
    user_id = current_user.get("sub")
    storage_path = f"{user_id}/{resource_id}/{filename}"

    try:
        # Upload to Supabase Storage bucket 'resources'
        # Supabase Python SDK upload uses: upload(path, file_body, file_options)
        storage_response = supabase.storage.from_("resources").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )
        
        # Get public url (signed url or simple get_public_url)
        file_url = supabase.storage.from_("resources").get_public_url(storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {str(e)}")

    try:
        # Insert metadata into Database
        db_data = {
            "id": resource_id,
            "title": title,
            "subject": subject,
            "description": description,
            "file_url": file_url,
            "uploaded_by": user_id,
            "views": 0,
            "likes": 0
        }
        db_response = supabase.table("resources").insert(db_data).execute()
        
        if not db_response.data:
            raise HTTPException(status_code=500, detail="Failed to save resource metadata to database.")
    except Exception as e:
        # Cleanup storage file if DB insert fails
        try:
            supabase.storage.from_("resources").remove([storage_path])
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to save resource: {str(e)}")

    # Trigger RAG Ingestion Pipeline in the background so request doesn't timeout
    background_tasks.add_task(_run_process_and_index_document, resource_id, file_content, filename)

    return {
        "message": "Resource uploaded and indexing started successfully",
        "resource": db_response.data[0],
        "processing": {
            "summary_generated": False,  # Stubbed for Phase 7
            "questions_generated": False,  # Stubbed for Phase 7
            "revision_notes_generated": False,  # Stubbed for Phase 7
            "indexed": True
        }
    }

@router.delete("/{resource_id}")
async def delete_resource(resource_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    
    # 1. Fetch resource metadata to verify ownership/existence
    response = supabase.table("resources").select("*").eq("id", resource_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    resource = response.data
    
    # Enforce authorization (owner or admin role from DB public.users)
    is_admin = False
    try:
        user_res = supabase.table("users").select("role").eq("id", user_id).single().execute()
        if user_res.data and user_res.data.get("role") == "admin":
            is_admin = True
    except:
        pass

    if resource.get("uploaded_by") != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resource")

    # Extract filename from file_url using the Supabase public URL pattern
    file_url = resource.get("file_url", "")
    BUCKET_MARKER = "/object/public/resources/"
    if BUCKET_MARKER in file_url:
        from urllib.parse import unquote
        storage_path = unquote(file_url.split(BUCKET_MARKER, 1)[1])
    else:
        filename = file_url.split("/")[-1]
        storage_path = f"{resource.get('uploaded_by')}/{resource_id}/{filename}"

    # 2. Delete from Supabase Storage
    try:
        supabase.storage.from_("resources").remove([storage_path])
    except Exception as e:
        print(f"Warning: Failed to delete file from storage during cleanup: {str(e)}")

    # 3. Delete from DB
    try:
        supabase.table("resources").delete().eq("id", resource_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete metadata: {str(e)}")

    # 4. Delete local FAISS index files
    try:
        FAISSStore.delete_index(resource_id)
    except Exception as e:
        print(f"Warning: Failed to delete FAISS index from disk during cleanup: {str(e)}")

    return {"message": "Resource deleted successfully"}

from fastapi.responses import StreamingResponse
import io
import httpx

@router.get("/{resource_id}/file")
async def get_resource_file_proxy(resource_id: str, current_user: dict = Depends(get_current_user)):
    # 1. Fetch resource metadata to get the storage path
    response = supabase.table("resources").select("file_url, uploaded_by").eq("id", resource_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource = response.data
    file_url = resource.get("file_url", "")

    BUCKET_MARKER = "/object/public/resources/"
    if BUCKET_MARKER in file_url:
        from urllib.parse import unquote
        storage_path = unquote(file_url.split(BUCKET_MARKER, 1)[1])
    else:
        storage_path = f"{resource.get('uploaded_by')}/{resource_id}/{file_url.split('/')[-1]}"

    filename = storage_path.split("/")[-1] if "/" in storage_path else storage_path

    # 2. Determine MIME type
    content_type = "application/pdf"
    if filename.lower().endswith(".docx"):
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.lower().endswith(".txt"):
        content_type = "text/plain"

    # 3. Build the direct Supabase storage URL and stream it via httpx
    # This avoids buffering the entire file in memory before sending to the client.
    from config import settings
    direct_url = f"{settings.SUPABASE_URL}/storage/v1/object/authenticated/resources/{storage_path}"
    public_url  = f"{settings.SUPABASE_URL}/storage/v1/object/public/resources/{storage_path}"

    async def stream_file():
        # Try public URL first, fall back to authenticated download
        async with httpx.AsyncClient(timeout=60) as client:
            # Try public path first
            async with client.stream("GET", public_url) as r:
                if r.status_code == 200:
                    async for chunk in r.aiter_bytes(chunk_size=65536):
                        yield chunk
                    return

            # Fall back to authenticated download via Supabase service key
            headers = {
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            }
            async with client.stream("GET", direct_url, headers=headers) as r:
                if r.status_code != 200:
                    # Last resort: use the SDK download (buffers but guaranteed to work)
                    file_bytes = supabase.storage.from_("resources").download(storage_path)
                    yield file_bytes
                    return
                async for chunk in r.aiter_bytes(chunk_size=65536):
                    yield chunk

    return StreamingResponse(
        stream_file(),
        media_type=content_type,
        headers={
            "Content-Disposition": f"inline; filename=\"{filename}\"",
            "Cache-Control": "private, max-age=3600",  # cache for 1 hour in browser
        }
    )

@router.post("/{resource_id}/like")
async def toggle_like_resource(resource_id: str, current_user: dict = Depends(get_current_user)):
    # Fetch resource
    response = supabase.table("resources").select("likes").eq("id", resource_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    current_likes = response.data.get("likes", 0)
    
    # Increment
    new_likes = current_likes + 1
    
    # Save
    supabase.table("resources").update({"likes": new_likes}).eq("id", resource_id).execute()
    
    return {"likes": new_likes}

