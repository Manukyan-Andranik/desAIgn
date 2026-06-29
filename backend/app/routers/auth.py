import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import db_models
from app.models import UserSchema, LoginRequest, RegisterRequest

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

@router.post("/login", response_model=UserSchema)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.email == clean_email).first()
            
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found for this email.")
        
    if user.password_hash and user.password_hash != req.password.strip():
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    return UserSchema(id=user.id, name=user.name, email=user.email, avatar=user.avatar)

@router.post("/register", response_model=UserSchema)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    existing = db.query(db_models.UserRecord).filter(db_models.UserRecord.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    default_avatar = req.avatar if req.avatar else f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    new_user = db_models.UserRecord(
        id=user_id,
        name=req.name.strip(),
        email=clean_email,
        password_hash=req.password.strip(),
        avatar=default_avatar
    )
    db.add(new_user)
    db.commit()
    
    welcome_proj = db_models.ProjectRecord(
        id=f"proj_{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        title=f"{req.name.strip()}'s Debut Sanctuary",
        image_id="demo_render_01",
        room_type="Living Room",
        design_style="Japandi Minimalist"
    )
    db.add(welcome_proj)
    db.commit()

    return UserSchema(id=new_user.id, name=new_user.name, email=new_user.email, avatar=new_user.avatar)

@router.post("/logout")
def logout_user():
    return {"status": "success", "message": "Logged out successfully."}
