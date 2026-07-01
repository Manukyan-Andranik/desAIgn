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

# Define allowed origins for CORS to prevent browser rejection when credentials are enabled
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Dynamically add endpoints from environment variables if configured
frontend_api = os.getenv("FRONTEND_API")
if frontend_api:
    origins.append(frontend_api)
backend_api = os.getenv("BACKEND_API")
if backend_api:
    origins.append(backend_api)

# Normalize origins (strip trailing slashes, remove duplicates)
origins = list(set([o.rstrip("/") for o in origins if o]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom StaticFiles subclass to force CORS headers on all static file responses.
# This prevents Chrome from caching a header-less version of an image when first loaded
# via a simple <img> tag, which would otherwise block subsequent canvas/CORS fetches.
class CORSStaticFiles(StaticFiles):
    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        
        # Safely extract ASGI scope to inspect headers
        scope = kwargs.get("scope")
        if not scope and len(args) >= 3:
            scope = args[2]
            
        # Parse the origin from the request headers inside ASGI scope
        origin = None
        if scope:
            for k, v in scope.get("headers", []):
                if k == b"origin":
                    origin = v.decode("utf-8")
                    break
                
        allowed_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]
        frontend_api = os.getenv("FRONTEND_API")
        if frontend_api:
            allowed_origins.append(frontend_api.rstrip("/"))
            
        allowed_origins = [o.rstrip("/") for o in allowed_origins if o]
        
        if origin and origin.rstrip("/") in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = frontend_api.rstrip("/") if frontend_api else "http://localhost:3000"
            
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
        return response

# Static files directory for uploaded renders
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", CORSStaticFiles(directory=UPLOADS_DIR), name="uploads")

# Include Modular APIRouters: User, Public, Admin, Auth
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(admin.router)
app.include_router(public.router)
