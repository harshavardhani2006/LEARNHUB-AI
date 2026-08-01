from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWTError
from config import settings

security = HTTPBearer(auto_error=False)


def _decode_supabase_jwt(token: str) -> dict:
    """
    Decode and verify a Supabase-issued JWT.
    Supabase JWTs are signed with the SUPABASE_JWT_SECRET (found in Supabase Dashboard → API settings).
    If SUPABASE_JWT_SECRET is not configured we fall back to unverified decode
    (only suitable for development; must be configured in production).
    """
    try:
        hdr = jwt.get_unverified_header(token)
        alg = hdr.get("alg", "HS256")
    except Exception:
        alg = "HS256"

    if alg in ["ES256", "RS256"]:
        try:
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            # Pass the apikey header required by Supabase's Kong gateway
            headers = {
                "apikey": settings.SUPABASE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_KEY}"
            }
            jwk_client = jwt.PyJWKClient(jwks_url, headers=headers)
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                options={"verify_aud": False},
                leeway=120,
            )
            return payload
        except Exception as e:
            print(f"JWKS decoding failed for {alg}: {e}", flush=True)

    jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", None)

    if jwt_secret:
        try:
            # Try decoding using base64-decoded secret if it looks like base64
            import base64
            secret_bytes = jwt_secret.encode('utf-8')
            try:
                # If secret is base64, decode it
                decoded_secret = base64.b64decode(jwt_secret)
                # Ensure it decoded into non-empty bytes
                if len(decoded_secret) > 0:
                    secret_bytes = decoded_secret
            except:
                pass

            payload = jwt.decode(
                token,
                secret_bytes,
                algorithms=["HS256", "RS256", "ES256"],
                options={"verify_aud": False},
                leeway=120,
            )
            return payload
        except PyJWTError as e:
            try:
                hdr = jwt.get_unverified_header(token)
                print(f"JWT Header: {hdr}")
            except Exception as he:
                print(f"Failed to get header: {he}")
            print(f"JWT decode failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Development fallback: decode without verification
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["HS256"],
            )
            return payload
        except PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not parse JWT token.",
                headers={"WWW-Authenticate": "Bearer"},
            )


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency: extracts and validates the Bearer JWT from the
    Authorization header or 'token' query parameter. Returns the decoded token payload (user claims).
    Raises 401 if token is missing or invalid.
    """
    token = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or token query parameter missing. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = _decode_supabase_jwt(token)
    return payload


async def require_verified_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    FastAPI dependency: extends get_current_user to also enforce
    email verification. Returns 403 if the user's email is not verified.

    Supabase sets `email_confirmed_at` in the JWT and `user_metadata`.
    We also check the custom `app_metadata` provider for Google OAuth
    (Google users are always considered verified).
    """
    # Google OAuth users are always verified
    provider = current_user.get("app_metadata", {}).get("provider", "")
    if provider == "google":
        return current_user

    # In development, bypass the verification gate so SMTP configuration isn't required locally
    if settings.ENVIRONMENT == "development":
        return current_user

    # Check Supabase email_confirmed_at timestamp
    email_confirmed_at = current_user.get("email_confirmed_at")
    if not email_confirmed_at:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required. Please verify your email address to access this feature.",
        )

    return current_user
