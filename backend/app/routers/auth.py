import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import db_models
from app.models import UserSchema, LoginRequest, RegisterRequest
from app.security import hash_password, verify_password

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

def _user_to_schema(user: db_models.UserRecord) -> UserSchema:
    return UserSchema(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        credits=user.credits if user.credits is not None else 1000,
        edit_count=user.edit_count if user.edit_count is not None else 0,
        plan=user.plan if user.plan else "Standard",
    )


@router.post("/login", response_model=UserSchema)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    password = req.password.strip()

    if not password:
        raise HTTPException(status_code=400, detail="Password is required.")

    user = db.query(db_models.UserRecord).filter(db_models.UserRecord.email == clean_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="No registered account found for this email.")

    if not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Migrate legacy plain-text passwords
    if not user.password_hash.startswith("pbkdf2:"):
        user.password_hash = hash_password(password)
        db.commit()
        db.refresh(user)

    return _user_to_schema(user)

@router.post("/register", response_model=UserSchema)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    clean_name = req.name.strip()
    password = req.password.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if not clean_email:
        raise HTTPException(status_code=400, detail="Email is required.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing = db.query(db_models.UserRecord).filter(db_models.UserRecord.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    default_avatar = req.avatar if req.avatar else f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    new_user = db_models.UserRecord(
        id=user_id,
        name=clean_name,
        email=clean_email,
        password_hash=hash_password(password),
        avatar=default_avatar,
        credits=1000,
        edit_count=0,
        plan="Standard",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return _user_to_schema(new_user)


@router.post("/logout")
def logout_user():
    return {"status": "success", "message": "Logged out successfully."}
