from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.auth import verify_token
from sqlalchemy import text
from pydantic import BaseModel

router = APIRouter()

class TokenData(BaseModel):
    token: str

def add_news(club_id, type, title, text, icon, db):
    db.execute(text(
        f"INSERT INTO news (club_id, type, title, text, icon) "
        f"VALUES ({club_id}, '{type}', $1, $2, '{icon}')"
    ), {"1": title, "2": text})
    db.commit()

@router.post("/list")
def get_news(data: TokenData, db: Session = Depends(get_db)):
    from app.auth import verify_token
    user_id = verify_token(data.token)
    if not user_id:
        return []
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.club_id:
        return []
    rows = db.execute(text(
        f"SELECT * FROM news WHERE club_id = {user.club_id} "
        f"ORDER BY created_at DESC LIMIT 20"
    )).fetchall()
    return [dict(r._mapping) for r in rows]
