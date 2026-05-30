from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.club import Club
from app.auth import create_token, verify_token
from pydantic import BaseModel
from typing import Optional
import bcrypt

router = APIRouter()

SECRET_QUESTIONS = [
    "Любимый футболист?",
    "Название первого клуба в карьере?",
    "Любимый стадион?",
    "Город где вырос?",
    "Имя лучшего друга?",
]

class RegisterData(BaseModel):
    username: str
    password: str
    secret_question: str
    secret_answer: str

class LoginData(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    token: str

class ResetData(BaseModel):
    username: str
    secret_answer: str
    new_password: str

def user_response(user, db):
    club = db.query(Club).filter(Club.id == user.club_id).first() if user.club_id else None
    return {
        "id": user.id,
        "manager_name": user.manager_name,
        "rating": user.rating,
        "club_id": user.club_id,
        "season": user.season,
        "club": {
            "id": club.id, "name": club.name, "city": club.city,
            "league": club.league, "primary": club.primary,
            "secondary": club.secondary, "budget": club.budget,
            "rating": club.rating, "min_rating": club.min_rating,
            "goal": club.goal, "expectations": club.expectations,
        } if club else None
    }

@router.get("/questions")
def get_questions():
    return SECRET_QUESTIONS

@router.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    if len(data.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Никнейм минимум 3 символа")
    if len(data.password) < 4:
        raise HTTPException(status_code=400, detail="Пароль минимум 4 символа")
    existing = db.query(User).filter(User.email == data.username.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Никнейм уже занят")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    answer_hashed = bcrypt.hashpw(data.secret_answer.lower().encode(), bcrypt.gensalt()).decode()
    user = User(
        email=data.username.lower(),
        password=hashed,
        manager_name=data.username,
        secret_question=data.secret_question,
        secret_answer=answer_hashed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id)
    res = user_response(user, db)
    res["token"] = token
    return res

@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.username.lower()).first()
    if not user or not bcrypt.checkpw(data.password.encode(), user.password.encode()):
        raise HTTPException(status_code=401, detail="Неверный никнейм или пароль")
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

@router.get("/reset-question/{username}")
def get_reset_question(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == username.lower()).first()
    if not user or not user.secret_question:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"question": user.secret_question}

@router.post("/reset-password")
def reset_password(data: ResetData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.username.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if not user.secret_answer or not bcrypt.checkpw(data.secret_answer.lower().encode(), user.secret_answer.encode()):
        raise HTTPException(status_code=401, detail="Неверный ответ")
    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="Пароль минимум 4 символа")
    user.password = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"success": True}
