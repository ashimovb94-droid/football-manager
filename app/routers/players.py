from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.player import Player

router = APIRouter()

@router.get("/")
def get_players(club_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Player)
    if club_id:
        q = q.filter(Player.club_id == club_id)
    return q.all()

@router.get("/{player_id}")
def get_player(player_id: int, db: Session = Depends(get_db)):
    return db.query(Player).filter(Player.id == player_id).first()
