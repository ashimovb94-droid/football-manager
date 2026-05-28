from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from pydantic import BaseModel
import bcrypt

router = APIRouter()

class RegisterData(BaseModel):
    email: str
    password: str
    manager_name: str

class LoginData(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user = User(email=data.email, password=hashed, manager_name=data.manager_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "manager_name": user.manager_name, "rating": user.rating}

@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not bcrypt.checkpw(data.password.encode(), user.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"id": user.id, "manager_name": user.manager_name, "rating": user.rating, "club_id": user.club_id}
