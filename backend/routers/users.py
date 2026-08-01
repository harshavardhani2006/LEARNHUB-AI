from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user
from database import supabase

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/{user_id}/stats")
async def get_user_stats(user_id: str, current_user: dict = Depends(get_current_user)):
    requesting_id = current_user.get("sub")
    
    is_admin = False
    try:
        req_user_res = supabase.table("users").select("role").eq("id", requesting_id).single().execute()
        if req_user_res.data and req_user_res.data.get("role") == "admin":
            is_admin = True
    except:
        pass

    if requesting_id != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access these user details.")

    res_user = supabase.table("users").select("*").eq("id", user_id).single().execute()
    if not res_user.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = res_user.data

    try:
        res_uploads = supabase.table("resources").select("id", count="exact").eq("uploaded_by", user_id).execute()
        upload_count = res_uploads.count if res_uploads.count is not None else len(res_uploads.data)
    except:
        upload_count = 0

    try:
        res_convs = supabase.table("conversations").select("id", count="exact").eq("user_id", user_id).execute()
        chat_count = res_convs.count if res_convs.count is not None else len(res_convs.data)
    except:
        chat_count = 0

    return {
        "profile": user_data,
        "stats": {
            "uploads_count": upload_count,
            "chats_count": chat_count
        }
    }


@router.get("/{user_id}/notifications")
async def get_notifications(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns a live notification feed for the user built from real DB activity:
    - Their 3 most recent uploaded resources (with like counts)
    - Their 3 most recent AI conversations
    - The 3 newest resources in the library (community activity)
    """
    if current_user.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized.")

    notifications = []

    # 1. User's own uploads — surface ones that have received likes
    try:
        uploads_res = supabase.table("resources") \
            .select("id, title, likes, created_at") \
            .eq("uploaded_by", user_id) \
            .order("created_at", desc=True) \
            .limit(3) \
            .execute()
        for r in (uploads_res.data or []):
            if r.get("likes", 0) > 0:
                notifications.append({
                    "id": f"like-{r['id']}",
                    "type": "like",
                    "icon": "heart",
                    "message": f'"{r["title"]}" received {r["likes"]} like{"s" if r["likes"] != 1 else ""}',
                    "link": f"/resources/{r['id']}",
                    "time": r["created_at"],
                })
            else:
                notifications.append({
                    "id": f"upload-{r['id']}",
                    "type": "upload",
                    "icon": "upload",
                    "message": f'You uploaded "{r["title"]}"',
                    "link": f"/resources/{r['id']}",
                    "time": r["created_at"],
                })
    except Exception as e:
        print(f"Notification fetch error (uploads): {e}")

    # 2. User's recent AI chats
    try:
        chats_res = supabase.table("conversations") \
            .select("id, title, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(3) \
            .execute()
        for c in (chats_res.data or []):
            notifications.append({
                "id": f"chat-{c['id']}",
                "type": "chat",
                "icon": "bot",
                "message": f'AI chat: "{c["title"]}"',
                "link": f"/ai-tutor/{c['id']}",
                "time": c["created_at"],
            })
    except Exception as e:
        print(f"Notification fetch error (chats): {e}")

    # 3. Newest community resources (excluding user's own)
    try:
        new_res = supabase.table("resources") \
            .select("id, title, created_at, users(name)") \
            .neq("uploaded_by", user_id) \
            .order("created_at", desc=True) \
            .limit(3) \
            .execute()
        for r in (new_res.data or []):
            uploader = r.get("users", {}).get("name", "Someone") if r.get("users") else "Someone"
            notifications.append({
                "id": f"new-{r['id']}",
                "type": "new_resource",
                "icon": "book",
                "message": f'{uploader} shared "{r["title"]}"',
                "link": f"/resources/{r['id']}",
                "time": r["created_at"],
            })
    except Exception as e:
        print(f"Notification fetch error (community): {e}")

    # Sort all notifications by time, newest first, cap at 8
    notifications.sort(key=lambda x: x.get("time", ""), reverse=True)
    return {"notifications": notifications[:8]}
