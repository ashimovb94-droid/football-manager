from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.player import Player
from app.models.club import Club
from app.models.user import User
from app.auth import verify_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class TransferData(BaseModel):
    token: str
    player_id: int
    transfer_type: str  # buy / loan / sell

@router.get("/market")
def get_market(position: Optional[str] = None, min_ovr: Optional[int] = None,
               max_price: Optional[float] = None, db: Session = Depends(get_db)):
    q = db.query(Player)
    if position:
        q = q.filter(Player.position == position)
    if min_ovr:
        q = q.filter(Player.overall >= min_ovr)
    if max_price:
        q = q.filter(Player.value <= max_price)
    players = q.order_by(Player.overall.desc()).limit(50).all()
    result = []
    for p in players:
        club = db.query(Club).filter(Club.id == p.club_id).first()
        result.append({
            "id": p.id,
            "name": p.name,
            "surname": p.surname,
            "position": p.position,
            "nationality": p.nationality,
            "age": p.age,
            "overall": p.overall,
            "potential": p.potential,
            "value": p.value,
            "salary": p.salary,
            "contract": p.contract,
            "club_id": p.club_id,
            "club_name": club.name if club else "Свободный агент",
            "club_primary": club.primary if club else "#333",
        })
    return result

@router.post("/buy")
def buy_player(data: TransferData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    club = db.query(Club).filter(Club.id == user.club_id).first()
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player or not club:
        raise HTTPException(status_code=404, detail="Не найдено")
    if club.budget < player.value:
        raise HTTPException(status_code=400, detail="Недостаточно бюджета")
    club.budget -= player.value
    player.club_id = user.club_id
    db.commit()
    return {"success": True, "message": f"{player.name} {player.surname} подписан!"}

@router.post("/sell")
def sell_player(data: TransferData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    club = db.query(Club).filter(Club.id == user.club_id).first()
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player or not club:
        raise HTTPException(status_code=404, detail="Не найдено")
    if player.club_id != user.club_id:
        raise HTTPException(status_code=400, detail="Игрок не в вашем клубе")
    club.budget += player.value
    player.club_id = None
    db.commit()
    return {"success": True, "message": f"{player.name} {player.surname} продан за £{player.value}M"}
