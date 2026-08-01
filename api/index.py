import sys
import os

# Resolve the backend directory relative to this file
# api/index.py is at repo_root/api/index.py
# backend is at repo_root/backend/
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(repo_root, "backend")

# Insert backend at front of path so all backend imports resolve
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Also add repo root just in case
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

# Change working directory to backend so relative imports (dotenv, etc.) work
os.chdir(backend_dir)

from main import app  # noqa: F401
