from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth as auth_router
from routers import resources as resources_router
from routers import chats as chats_router
from routers import study_tools as study_tools_router
from routers import users as users_router

app = FastAPI(
    title="LearnHub AI API",
    description="Backend API for RAG-powered ed-tech platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(resources_router.router)
app.include_router(chats_router.router)
app.include_router(study_tools_router.router)
app.include_router(users_router.router)


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint returning 200 OK.
    Used for monitoring and deployment readiness verification.
    """
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
