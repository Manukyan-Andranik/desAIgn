import uuid
import os
import re
import base64
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from sqlalchemy.orm import Session
from app.database import get_db
from app import db_models
from app.models import UserSchema, ProjectSchema, CreateProjectRequest, UpgradePlanRequest, UpdateProfileRequest, ChangePasswordRequest
from app.security import hash_password, verify_password

router = APIRouter(
    prefix="/api/v1",
    tags=["Users & Projects"]
)

AVATARS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "uploads", "avatars")
os.makedirs(AVATARS_DIR, exist_ok=True)

PLAN_CONFIG = {
    "Standard": {"rank": 0, "monthly_credits": 1000},
    "Pro Studio": {"rank": 1, "monthly_credits": 10000},
    "Enterprise": {"rank": 2, "monthly_credits": 50000},
}


def _user_to_schema(user: db_models.UserRecord) -> UserSchema:
    return UserSchema(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        credits=user.credits if user.credits is not None else 1000,
        edit_count=user.edit_count if user.edit_count is not None else 0,
        plan=user.plan if user.plan else "Standard"
    )


def _save_avatar(user_id: str, avatar: str) -> str:
    if not avatar:
        return avatar
    if not avatar.startswith("data:image/"):
        return avatar.strip()

    match = re.match(r"data:image/(png|jpeg|jpg|webp|gif);base64,(.+)", avatar, re.IGNORECASE)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid avatar image format.")

    ext = "jpg" if match.group(1).lower() in ("jpeg", "jpg") else match.group(1).lower()
    try:
        image_data = base64.b64decode(match.group(2))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid avatar image data.")

    if len(image_data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar image must be under 5 MB.")

    filename = f"{user_id}.{ext}"
    filepath = os.path.join(AVATARS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(image_data)

    return f"http://localhost:8000/uploads/avatars/{filename}"


@router.get("/users", response_model=list[UserSchema])
def get_users(db: Session = Depends(get_db)):
    users = db.query(db_models.UserRecord).all()
    return [_user_to_schema(u) for u in users]


@router.get("/users/{user_id}", response_model=UserSchema)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_schema(user)


@router.get("/plans")
def list_plans():
    return [
        {
            "name": name,
            "monthly_credits": cfg["monthly_credits"],
            "rank": cfg["rank"],
        }
        for name, cfg in PLAN_CONFIG.items()
    ]


@router.put("/users/{user_id}/profile", response_model=UserSchema)
def update_user_profile(user_id: str, req: UpdateProfileRequest, db: Session = Depends(get_db)):
    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.name is not None:
        clean_name = req.name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Name cannot be empty.")
        user.name = clean_name

    if req.email is not None:
        clean_email = req.email.strip().lower()
        if not clean_email:
            raise HTTPException(status_code=400, detail="Email cannot be empty.")
        if clean_email != user.email:
            existing = db.query(db_models.UserRecord).filter(
                db_models.UserRecord.email == clean_email,
                db_models.UserRecord.id != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="An account with this email already exists.")
            user.email = clean_email

    if req.avatar is not None:
        user.avatar = _save_avatar(user_id, req.avatar)

    db.commit()
    db.refresh(user)
    return _user_to_schema(user)


@router.put("/users/{user_id}/password", response_model=UserSchema)
def change_user_password(user_id: str, req: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current = req.current_password.strip()
    new_pass = req.new_password.strip()

    if len(new_pass) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    if user.password_hash:
        if not verify_password(current, user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect.")
    elif current:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    user.password_hash = hash_password(new_pass)
    db.commit()
    db.refresh(user)
    return _user_to_schema(user)

@router.post("/users/{user_id}/record-edit", response_model=UserSchema)
def record_user_edit(user_id: str, db: Session = Depends(get_db)):
    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.edit_count = (user.edit_count or 0) + 1
    # Charge 25 credits on every 10th edit
    if user.edit_count % 10 == 0:
        current_credits = user.credits if user.credits is not None else 1000
        if current_credits < 25:
            raise HTTPException(
                status_code=402,
                detail="Not enough credits for this AI edit batch (25 credits required). Please upgrade your plan.",
            )
        user.credits = current_credits - 25

    db.commit()
    db.refresh(user)
    return _user_to_schema(user)

@router.post("/users/{user_id}/deduct-download", response_model=UserSchema)
def deduct_download_credits(user_id: str, db: Session = Depends(get_db)):
    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_credits = user.credits if user.credits is not None else 1000
    if current_credits < 50:
        raise HTTPException(status_code=402, detail="Insufficient credits to download render (50 credits required). Please recharge.")
    
    user.credits = current_credits - 50
    db.commit()
    db.refresh(user)
    return _user_to_schema(user)


@router.post("/users/{user_id}/upgrade-plan", response_model=UserSchema)
def upgrade_user_plan(user_id: str, req: UpgradePlanRequest, db: Session = Depends(get_db)):
    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_plan = req.plan.strip()
    if target_plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan selected.")

    current_plan = user.plan if user.plan in PLAN_CONFIG else "Standard"
    if target_plan == current_plan:
        raise HTTPException(status_code=400, detail="You are already on this plan.")

    current_rank = PLAN_CONFIG[current_plan]["rank"]
    target_rank = PLAN_CONFIG[target_plan]["rank"]
    user.plan = target_plan

    if target_rank > current_rank:
        bonus = PLAN_CONFIG[target_plan]["monthly_credits"]
        user.credits = (user.credits or 0) + bonus

    db.commit()
    db.refresh(user)
    return _user_to_schema(user)


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
def delete_project(project_id: str, user_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    p = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if user_id and p.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied. Project belongs to another user.")
    db.delete(p)
    db.commit()
    return {"status": "success", "message": f"Deleted project '{project_id}'"}

@router.post("/projects/{project_id}/duplicate", response_model=ProjectSchema)
def duplicate_project(project_id: str, user_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    p = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if user_id and p.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied. Project belongs to another user.")
    
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

