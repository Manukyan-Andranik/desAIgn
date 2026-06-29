import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import db_models
from app.models import UserSchema, ProjectSchema, CreateProjectRequest

router = APIRouter(
    prefix="/api/v1",
    tags=["Users & Projects"]
)

@router.get("/users", response_model=list[UserSchema])
def get_users(db: Session = Depends(get_db)):
    users = db.query(db_models.UserRecord).all()
    return [UserSchema(id=u.id, name=u.name, email=u.email, avatar=u.avatar) for u in users]

@router.get("/users/{user_id}/projects", response_model=list[ProjectSchema])
def get_user_projects(user_id: str, db: Session = Depends(get_db)):
    projects = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.user_id == user_id).all()
    
    result = []
    for p in projects:
        sg = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == p.image_id).first()
        img_url = sg.image_url if sg else None
        obj_count = len(sg.objects) if sg and sg.objects else 0
        result.append(ProjectSchema(
            id=p.id,
            user_id=p.user_id,
            title=p.title,
            image_id=p.image_id,
            room_type=p.room_type,
            design_style=p.design_style,
            image_url=img_url,
            object_count=obj_count
        ))
    return result

@router.post("/projects", response_model=ProjectSchema)
def create_project(req: CreateProjectRequest, db: Session = Depends(get_db)):
    proj_id = f"proj_{uuid.uuid4().hex[:8]}"
    p = db_models.ProjectRecord(
        id=proj_id,
        user_id=req.user_id,
        title=req.title,
        image_id=req.image_id,
        room_type=req.room_type,
        design_style=req.design_style
    )
    db.add(p)
    db.commit()
    
    sg = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == req.image_id).first()
    img_url = sg.image_url if sg else None
    obj_count = len(sg.objects) if sg and sg.objects else 0
    
    return ProjectSchema(
        id=p.id,
        user_id=p.user_id,
        title=p.title,
        image_id=p.image_id,
        room_type=p.room_type,
        design_style=p.design_style,
        image_url=img_url,
        object_count=obj_count
    )

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(p)
    db.commit()
    return {"status": "success", "message": f"Deleted project '{project_id}'"}

@router.post("/projects/{project_id}/duplicate", response_model=ProjectSchema)
def duplicate_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_proj_id = f"proj_{uuid.uuid4().hex[:8]}"
    dup_p = db_models.ProjectRecord(
        id=new_proj_id,
        user_id=p.user_id,
        title=f"{p.title} (Copy)",
        image_id=p.image_id,
        room_type=p.room_type,
        design_style=p.design_style
    )
    db.add(dup_p)
    db.commit()
    
    sg = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == p.image_id).first()
    img_url = sg.image_url if sg else None
    obj_count = len(sg.objects) if sg and sg.objects else 0
    
    return ProjectSchema(
        id=dup_p.id,
        user_id=dup_p.user_id,
        title=dup_p.title,
        image_id=dup_p.image_id,
        room_type=dup_p.room_type,
        design_style=dup_p.design_style,
        image_url=img_url,
        object_count=obj_count
    )
