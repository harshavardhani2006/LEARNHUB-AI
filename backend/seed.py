import os
import sys
from dotenv import load_dotenv

# Ensure we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import supabase
import uuid

def seed():
    print("Seeding database...")
    
    # Check for existing users in auth.users using the admin API
    try:
        auth_users_resp = supabase.auth.admin.list_users()
        auth_users = auth_users_resp.users if hasattr(auth_users_resp, 'users') else []
        
        if auth_users:
            print(f"Found {len(auth_users)} users in Supabase Auth. Syncing the first one to public.users...")
            target_user = auth_users[0]
            
            # Sync user to public.users
            supabase.table("users").upsert({
                "id": target_user.id,
                "name": target_user.user_metadata.get("name") or target_user.email.split('@')[0],
                "email": target_user.email,
                "role": "student"
            }).execute()
        else:
            print("No auth users found. Creating a test auth user first...")
            new_user = supabase.auth.admin.create_user({
                "email": "demo_student@learnhub.local",
                "password": "testpassword123",
                "email_confirm": True,
                "user_metadata": {"name": "Test Student"}
            })
            target_user = new_user.user if hasattr(new_user, 'user') else new_user
            
            # Sync created user to public.users
            supabase.table("users").upsert({
                "id": target_user.id,
                "name": "Test Student",
                "email": target_user.email,
                "role": "student"
            }).execute()
            
    except Exception as e:
        print(f"Could not list or create auth users: {e}")
        # Fallback to query public.users
        response = supabase.table("users").select("id").limit(1).execute()
        if not response.data:
            print("Please sign up at least one user via the frontend before seeding.")
            return
        user_id = response.data[0]['id']
    else:
        user_id = target_user.id

    print(f"Using user_id: {user_id}")
    
    resources = [
        {
            "id": str(uuid.uuid4()),
            "title": "Python Basics - Variables & Loops",
            "subject": "Programming",
            "description": "Beginner-friendly notes covering variables, loops, and functions.",
            "file_url": "dummy_url_1.pdf",
            "uploaded_by": user_id,
            "views": 120,
            "likes": 24,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Database Normalization (1NF to 3NF)",
            "subject": "Database Management Systems",
            "description": "Clear explanation of normalization with examples.",
            "file_url": "dummy_url_2.pdf",
            "uploaded_by": user_id,
            "views": 85,
            "likes": 42,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "React Hooks Cheat Sheet",
            "subject": "Web Development",
            "description": "Quick reference for useState, useEffect, and custom hooks.",
            "file_url": "dummy_url_3.pdf",
            "uploaded_by": user_id,
            "views": 210,
            "likes": 89,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Introduction to Neural Networks",
            "subject": "Artificial Intelligence",
            "description": "Basic concepts of perceptrons and backpropagation.",
            "file_url": "dummy_url_4.pdf",
            "uploaded_by": user_id,
            "views": 56,
            "likes": 12,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Linear Algebra for ML",
            "subject": "Mathematics",
            "description": "Vectors, matrices, and eigenvectors explained simply.",
            "file_url": "dummy_url_5.pdf",
            "uploaded_by": user_id,
            "views": 430,
            "likes": 115,
        }
    ]
    
    res = supabase.table("resources").insert(resources).execute()
    if res.data:
        print(f"Successfully inserted {len(res.data)} resources!")
    else:
        print("Failed to insert resources.")
        
if __name__ == "__main__":
    seed()
