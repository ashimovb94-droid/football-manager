from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.season import Season, Match, Standing, PreseasonConfig
from app.models.cup import CupMatch
from app.models.club import Club
from app.models.user import User
from app.models.player import Player
from app.auth import verify_token
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class TokenData(BaseModel):
    token: str

@router.post("/state")
def get_game_state(data: TokenData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        return {"error": "unauthorized"}
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.club_id:
        return {"phase": "no_club"}
    
    club = db.query(Club).filter(Club.id == user.club_id).first()
    now = datetime.utcnow()
    
    # Предсезонка
    config = db.query(PreseasonConfig).filter(PreseasonConfig.status == 'active').first()
    preseason_info = None
    if config:
        season_start = datetime.fromisoformat(config.season_start)
        start = datetime.fromisoformat(config.start_date)
        elapsed = (now - start).total_seconds() / 3600
        hours_until_season = max(0, (season_start - now).total_seconds() / 3600)
        preseason_info = {
            "started": True,
            "season_started": now >= season_start,
            "hours_until_season": round(hours_until_season, 1),
            "available_days": [d for d in [1,2,3] if elapsed >= (d-1)*24],
            "current_day": min(3, int(elapsed/24) + 1),
        }
    
    # Сезон
    season = db.query(Season).filter(Season.status == 'active').first()
    
    # Следующий матч
    next_match = None
    standing = None
    season_complete = False
    
    if season:
        nxt = db.query(Match).filter(
            Match.season_id == season.id,
            Match.league == club.league,
            Match.status == 'scheduled',
        ).filter(
            (Match.home_id == user.club_id) | (Match.away_id == user.club_id)
        ).order_by(Match.round).first()
        
        if nxt:
            opp_id = nxt.away_id if nxt.home_id == user.club_id else nxt.home_id
            opp = db.query(Club).filter(Club.id == opp_id).first()
            home_club = db.query(Club).filter(Club.id == nxt.home_id).first()
            away_club = db.query(Club).filter(Club.id == nxt.away_id).first()
            next_match = {
                "id": nxt.id,
                "round": nxt.round,
                "date": nxt.date,
                "home_id": nxt.home_id,
                "away_id": nxt.away_id,
                "home_name": home_club.name if home_club else "",
                "away_name": away_club.name if away_club else "",
                "home_primary": home_club.primary if home_club else "#333",
                "away_primary": away_club.primary if away_club else "#333",
                "is_home": nxt.home_id == user.club_id,
            }
        
        # Позиция в таблице
        standings = db.query(Standing).filter(
            Standing.season_id == season.id,
            Standing.league == club.league
        ).order_by(Standing.points.desc(), (Standing.gf - Standing.ga).desc()).all()
        
        for i, s in enumerate(standings):
            if s.club_id == user.club_id:
                standing = {
                    "position": i + 1,
                    "total": len(standings),
                    "points": s.points,
                    "played": s.played,
                    "won": s.won,
                    "drawn": s.drawn,
                    "lost": s.lost,
                    "gf": s.gf,
                    "ga": s.ga,
                }
                break
        
        # Завершён ли сезон
        remaining = db.query(Match).filter(
            Match.season_id == season.id,
            Match.league == club.league,
            Match.status == 'scheduled'
        ).count()
        total = db.query(Match).filter(
            Match.season_id == season.id,
            Match.league == club.league
        ).count()
        season_complete = remaining == 0 and total > 0
    
    # Трансферное окно
    month_day = now.strftime("%m-%d")
    transfer_window = (
        ("05-01" <= month_day <= "08-31") or
        ("01-01" <= month_day <= "01-31")
    )
    
    # Фаза игры
    if preseason_info and not preseason_info["season_started"]:
        phase = "preseason"
    elif season_complete:
        phase = "results"
    else:
        phase = "season"
    
    return {
        "phase": phase,
        "season_number": user.season or 1,
        "manager_rating": user.rating or 50,
        "league": club.league if club else "championship",
        "club": {
            "id": club.id, "name": club.name,
            "primary": club.primary, "secondary": club.secondary,
            "budget": club.budget, "rating": club.rating,
            "league": club.league,
        } if club else None,
        "preseason": preseason_info,
        "next_match": next_match,
        "standing": standing,
        "season_complete": season_complete,
        "transfer_window_open": transfer_window,
    }
