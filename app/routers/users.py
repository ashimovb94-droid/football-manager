from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.club import Club
from app.auth import create_token, verify_token
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

class TokenData(BaseModel):
    token: str

def user_response(user, db):
    club = db.query(Club).filter(Club.id == user.club_id).first() if user.club_id else None
    return {
        "id": user.id,
        "manager_name": user.manager_name,
        "rating": user.rating,
        "club_id": user.club_id,
        "club": {
            "id": club.id,
            "name": club.name,
            "city": club.city,
            "league": club.league,
            "primary": club.primary,
            "secondary": club.secondary,
            "budget": club.budget,
            "rating": club.rating,
            "min_rating": club.min_rating,
            "goal": club.goal,
            "expectations": club.expectations,
        } if club else None
    }

@router.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже занят")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user = User(email=data.email, password=hashed, manager_name=data.manager_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id)
    res = user_response(user, db)
    res["token"] = token
    return res

@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not bcrypt.checkpw(data.password.encode(), user.password.encode()):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    token = create_token(user.id)
    res = user_response(user, db)
    res["token"] = token
    return res

@router.post("/me")
def get_me(data: TokenData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user_response(user, db)

@router.post("/select-club")
def select_club(club_id: int, data: TokenData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    user.club_id = club_id
    db.commit()
    return {"success": True}
