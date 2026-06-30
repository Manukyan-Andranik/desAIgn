import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app import db_models
from app.routers import auth, user, public, admin

# Initialize DB tables from models
db_models.Base.metadata.create_all(bind=engine)

def run_db_migrations():
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "scene_graphs" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("scene_graphs")]
            if "relationships" not in columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE scene_graphs ADD COLUMN relationships JSON"))
                    conn.commit()
        if "users" in inspector.get_table_names():
            user_columns = [c["name"] for c in inspector.get_columns("users")]
            if "password_hash" not in user_columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
                    conn.commit()
            if "credits" not in user_columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 1000"))
                    conn.commit()
            if "edit_count" not in user_columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN edit_count INTEGER DEFAULT 0"))
                    conn.commit()
            if "plan" not in user_columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN plan VARCHAR DEFAULT 'Standard'"))
                    conn.commit()
            with engine.connect() as conn:
                conn.execute(text(
                    "DELETE FROM projects WHERE user_id IN ("
                    "  SELECT id FROM users WHERE "
                    "    id IN ('usr_alex', 'usr_sarah', 'usr_studio', 'usr_guest') "
                    "    OR email IN ('alex@architects.io', 'sarah@designstudio.com', 'pro@antigravity.os', 'test@example.com') "
                    "    OR email LIKE 'testuser_%@example.com' "
                    "    OR email LIKE 'test_%@example.com'"
                    ")"
                ))
                conn.execute(text(
                    "DELETE FROM projects WHERE user_id IN ('usr_alex', 'usr_sarah', 'usr_studio') "
                    "OR image_id LIKE 'demo_render%'"
                ))
                conn.execute(text(
                    "DELETE FROM users WHERE "
                    "id IN ('usr_alex', 'usr_sarah', 'usr_studio', 'usr_guest') "
                    "OR email IN ('alex@architects.io', 'sarah@designstudio.com', 'pro@antigravity.os', 'test@example.com') "
                    "OR email LIKE 'testuser_%@example.com' "
                    "OR email LIKE 'test_%@example.com'"
                ))
                conn.commit()
    except Exception as e:

        print(f"[DB Migration Warning] {e}")


run_db_migrations()

app = FastAPI(
    title="Antigravity Vision & Detection API - Architectural & Interior Scene OS",
    description="Backend service with modular User, Public, Admin, and Auth routers for 3D spatial scene graphs and generative orchestration.",
    version="2.5.0"
)

@app.on_event("startup")
def on_startup():
    run_db_migrations()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files directory for uploaded renders
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Include Modular APIRouters: User, Public, Admin, Auth
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(admin.router)
app.include_router(public.router)
