from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import db_models
from app.learning_engine import user_taxonomy_memory

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin System & Telemetry"]
)

@router.get("/telemetry")
def get_admin_telemetry(db: Session = Depends(get_db)):
    users_count = db.query(db_models.UserRecord).count()
    projects_count = db.query(db_models.ProjectRecord).count()
    scene_graphs_count = db.query(db_models.SceneGraphRecord).count()
    objects_count = db.query(db_models.SceneObjectRecord).count()
    
    return {
        "status": "online",
        "telemetry": {
            "registered_users": users_count,
            "active_projects": projects_count,
            "scene_graphs_persisted": scene_graphs_count,
            "total_objects_extracted": objects_count,
            "active_learning_rules": len(user_taxonomy_memory)
        }
    }

@router.get("/learning-memory")
def get_learning_memory():
    return {
        "status": "success",
        "active_learning_memory": user_taxonomy_memory
    }

@router.delete("/learning-memory")
def clear_learning_memory():
    user_taxonomy_memory.clear()
    return {
        "status": "success",
        "message": "Cleared active learning taxonomy memory."
    }
