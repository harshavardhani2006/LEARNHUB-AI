from fastapi import APIRouter, Depends, HTTPException, status
from middleware.auth_middleware import get_current_user
from config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's JWT claims (user_id, email, role, email_verified).
    Used by the frontend to confirm auth state and get user metadata.
    Requires a valid Supabase JWT Bearer token.
    """
    return {
        "user_id": current_user.get("sub"),
        "email": current_user.get("email"),
        "email_confirmed_at": current_user.get("email_confirmed_at"),
        "role": current_user.get("role"),
        "provider": current_user.get("app_metadata", {}).get("provider"),
    }
