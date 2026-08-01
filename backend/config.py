import os
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

class Settings:
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    # Found in Supabase Dashboard → Project Settings → API → JWT Secret
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    CORS_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000"
        ).split(",")
        if origin.strip()
    ]
    FAISS_INDEX_PATH: str = os.getenv("FAISS_INDEX_PATH", "./faiss_indexes" if os.getenv("ENVIRONMENT", "development") == "development" else "/tmp/faiss_indexes")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
