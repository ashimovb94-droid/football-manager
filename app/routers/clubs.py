from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.club import Club

router = APIRouter()

@router.get("/")
def get_clubs(league: str = None, db: Session = Depends(get_db)):
    q = db.query(Club)
    if league:
        q = q.filter(Club.league == league)
    return q.all()

@router.get("/{club_id}")
def get_club(club_id: int, db: Session = Depends(get_db)):
    return db.query(Club).filter(Club.id == club_id).first()
