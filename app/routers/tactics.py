from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tactics import Tactics
from app.auth import verify_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class TacticsData(BaseModel):
    token: str
    formation: Optional[str] = None
    style: Optional[str] = None
    mentality: Optional[str] = None
    lineup: Optional[dict] = None

@router.post("/save")
def save_tactics(data: TacticsData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    t = db.query(Tactics).filter(Tactics.user_id == user_id).first()
    if not t:
        t = Tactics(user_id=user_id)
        db.add(t)
    if data.formation: t.formation = data.formation
    if data.style:     t.style = data.style
    if data.mentality: t.mentality = data.mentality
    if data.lineup is not None: t.lineup = data.lineup
    db.commit()
    return {"success": True}

@router.post("/load")
def load_tactics(data: dict, db: Session = Depends(get_db)):
    user_id = verify_token(data.get("token"))
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    t = db.query(Tactics).filter(Tactics.user_id == user_id).first()
    if not t:
        return {"formation": "4-3-3", "style": "balanced", "mentality": "balanced", "lineup": {}}
    return {"formation": t.formation, "style": t.style, "mentality": t.mentality, "lineup": t.lineup or {}}
