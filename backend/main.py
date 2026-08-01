from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth as auth_router
from routers import resources as resources_router
from routers import chats as chats_router
from routers import study_tools as study_tools_router
from routers import users as users_router

# On Vercel all requests arrive as /api/<path> — mount routers under /api
# so both the serverless deployment and local dev (direct /auth, /resources...)
# work without changing the frontend api.js base URL logic.
# In production: VITE_API_URL="" so axios uses baseURL="/api" → matches here.
# In local dev:  VITE_API_URL="http://localhost:8000" and routers are at /auth etc.
#   → we add both /api prefix and root prefix so local dev keeps working.

app = FastAPI(
    title="LearnHub AI API",
    description="Backend API for RAG-powered ed-tech platform",
    version="1.0.0",
    root_path=""
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "production" else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers mounted twice ──────────────────────────────────────────────────
# /api/... prefix  → used by Vercel production (axios baseURL = "/api")
# no prefix        → used by local dev        (axios baseURL = "http://localhost:8000")
for prefix in ["/api", ""]:
    app.include_router(auth_router.router, prefix=prefix)
    app.include_router(resources_router.router, prefix=prefix)
    app.include_router(chats_router.router, prefix=prefix)
    app.include_router(study_tools_router.router, prefix=prefix)
    app.include_router(users_router.router, prefix=prefix)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint. Returns 200 OK."""
    return {"status": "ok"}

@app.get("/api/health", tags=["Health"])
async def health_check_api():
    """Health check under /api prefix for Vercel."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
