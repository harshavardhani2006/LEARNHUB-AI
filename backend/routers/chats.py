from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from middleware.auth_middleware import get_current_user, require_verified_user
from database import supabase
from services.llm_service import LLMService
from services.embeddings import EmbeddingsService
from services.faiss_store import FAISSStore
import json

router = APIRouter(
    tags=["Chats"],
    dependencies=[Depends(require_verified_user)] # Chatting requires verification per PRD
)

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    resource_id: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: str

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    resource_id: Optional[str] = None

@router.post("/conversations")
async def create_conversation(payload: ConversationCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    
    db_payload = {
        "user_id": user_id,
        "title": payload.title or "New Conversation",
        "resource_id": payload.resource_id
    }
    
    response = supabase.table("conversations").insert(db_payload).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
        
    return response.data[0]

@router.get("/conversations/{user_id}")
async def list_conversations(
    user_id: str,
    search: Optional[str] = None,
    sort: Optional[str] = Query("recent", pattern="^(recent|oldest)$"),
    current_user: dict = Depends(get_current_user)
):
    # Verify owner
    if user_id != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Access denied")

    # Select fields including count using Supabase RPC or double query
    # To get message counts, we will just fetch the conversations and messages count
    query = supabase.table("conversations").select("*, resources(subject)").eq("user_id", user_id)
    
    if search:
        query = query.ilike("title", f"%{search}%")
        
    if sort == "oldest":
        query = query.order("created_at", desc=False)
    else:
        query = query.order("created_at", desc=True)
        
    response = query.execute()
    conversations = response.data or []

    # Inject message count stub or actual count per conversation
    # For efficiency we query count of messages for these conversations
    for conv in conversations:
        # Get count of messages
        msg_resp = supabase.table("messages").select("id", count="exact").eq("conversation_id", conv["id"]).execute()
        conv["message_count"] = msg_resp.count if msg_resp.count is not None else 0
        
        # Flatten resource subject
        if conv.get("resources"):
            conv["subject"] = conv["resources"].get("subject")
            del conv["resources"]
        else:
            conv["subject"] = None

    return {
        "conversations": conversations,
        "total": len(conversations)
    }

@router.get("/messages/{conversation_id}")
async def list_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    
    # Verify conversation ownership
    conv_resp = supabase.table("conversations").select("user_id").eq("id", conversation_id).single().execute()
    if not conv_resp.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv_resp.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
        
    # Get messages ordered chronologically
    response = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
    return {
        "messages": response.data or [],
        "total": len(response.data or [])
    }

@router.patch("/conversations/{conversation_id}")
async def update_conversation_title(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    
    # Verify conversation ownership
    conv_resp = supabase.table("conversations").select("user_id").eq("id", conversation_id).single().execute()
    if not conv_resp.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv_resp.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this conversation")

    response = supabase.table("conversations").update({"title": payload.title}).eq("id", conversation_id).execute()
    return response.data[0]

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    
    # Verify conversation ownership
    conv_resp = supabase.table("conversations").select("user_id").eq("id", conversation_id).single().execute()
    if not conv_resp.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv_resp.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this conversation")

    supabase.table("conversations").delete().eq("id", conversation_id).execute()
    return {"message": "Conversation deleted successfully"}


# Helper function to save assistant's fully generated message in background after streaming completes
def save_chat_messages(conversation_id: str, user_msg: str, assistant_msg: str):
    try:
        # Save user message
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "sender": "user",
            "message": user_msg
        }).execute()
        
        # Save assistant message
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "sender": "assistant",
            "message": assistant_msg
        }).execute()

        # Check if conversation only has these two messages (i.e. first turn)
        # If so, auto-generate the conversation title based on the user's first message
        count_resp = supabase.table("messages").select("id", count="exact").eq("conversation_id", conversation_id).execute()
        if count_resp.count == 2:
            title = user_msg[:50] + "..." if len(user_msg) > 50 else user_msg
            supabase.table("conversations").update({"title": title}).eq("id", conversation_id).execute()
            print(f"Auto-generated title '{title}' for conversation {conversation_id}")
    except Exception as e:
        print(f"Error saving chat history: {e}")

@router.post("/chat")
async def chat_interaction(
    payload: ChatRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    conversation_id = payload.conversation_id
    user_message = payload.message
    resource_id = payload.resource_id

    # 1. Verify conversation ownership
    conv_resp = supabase.table("conversations").select("user_id, resource_id").eq("id", conversation_id).single().execute()
    if not conv_resp.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv_resp.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
    
    # Use resource ID from conversation if not explicitly provided
    active_resource_id = resource_id or conv_resp.data.get("resource_id")

    # 2. Retrieve context from FAISS if resource-scoped
    context_chunks = []
    if active_resource_id:
        try:
            # Generate query embedding locally on CPU
            query_vector = EmbeddingsService.embed_query(user_message)
            # Retrieve top 5 nearest vector chunks
            search_results = FAISSStore.search(active_resource_id, query_vector, k=5)
            context_chunks = [res["chunk"] for res in search_results]
        except Exception as e:
            print(f"RAG retrieval failed: {e}. Falling back to zero-context LLM generation.")

    # 3. Load last 10 messages for conversation context
    history_resp = supabase.table("messages").select("sender, message").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(10).execute()
    history = history_resp.data or []

    # 4. Stream response from LLM Service
    system_prompt = "You are LearnHub AI Tutor, a friendly educational assistant."
    
    async def response_streamer():
        full_response = ""
        # Get streaming generator
        stream_generator = LLMService.stream_chat(
            system_prompt=system_prompt,
            context=context_chunks,
            history=history,
            query=user_message
        )
        
        async for token in stream_generator:
            full_response += token
            # Yield token for EventSource/SSE format
            yield f"data: {json.dumps({'token': token})}\n\n"
            
        yield f"data: {json.dumps({'done': True})}\n\n"
        
        # Save user & assistant messages to PostgreSQL database
        # Spawning as background task to respond immediately
        background_tasks.add_task(save_chat_messages, conversation_id, user_message, full_response)

    return StreamingResponse(response_streamer(), media_type="text/event-stream")
