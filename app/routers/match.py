from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.season import Match, Standing, Season
from app.models.club import Club
from app.models.tactics import Tactics
from app.models.user import User
from app.auth import verify_token
from app.engine.match_engine import simulate_match
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class PlayMatchData(BaseModel):
    token: str
    match_id: int

class FriendlyData(BaseModel):
    token: str
    opponent_id: int

@router.post("/play")
def play_match(data: PlayMatchData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    
    user = db.query(User).filter(User.id == user_id).first()
    match = db.query(Match).filter(Match.id == data.match_id).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Матч не найден")
    if match.status == 'finished':
        raise HTTPException(status_code=400, detail="Матч уже сыгран")
    if match.home_id != user.club_id and match.away_id != user.club_id:
        raise HTTPException(status_code=400, detail="Это не ваш матч")
    
    # Загружаем тактику
    tactics = db.query(Tactics).filter(Tactics.user_id == user_id).first()
    user_lineup = tactics.lineup if tactics else None
    user_style = tactics.style if tactics else 'balanced'
    
    # Симулируем
    is_home = match.home_id == user.club_id
    result = simulate_match(
        home_id=match.home_id,
        away_id=match.away_id,
        home_lineup=user_lineup if is_home else None,
        away_lineup=user_lineup if not is_home else None,
        home_style=user_style if is_home else 'balanced',
        away_style=user_style if not is_home else 'balanced',
    )
    
    # Сохраняем результат
    match.home_score = result['home_score']
    match.away_score = result['away_score']
    match.status = 'finished'
    
    # Обновляем таблицу
    _update_standings(match, db)
    db.commit()
    
    home_club = db.query(Club).filter(Club.id == match.home_id).first()
    away_club = db.query(Club).filter(Club.id == match.away_id).first()

    # Новость о матче
    from app.utils.news_helper import create_news
    hs, as_ = result["home_score"], result["away_score"]
    is_home = match.home_id == user.club_id
    my_score = hs if is_home else as_
    opp_score = as_ if is_home else hs
    opp_name = away_club.name if is_home else home_club.name
    if my_score > opp_score:
        icon = "trophy-outline"
    elif my_score < opp_score:
        title = f"Поражение от {opp_name}"
        icon = "sad-outline"
    else:
        title = f"Ничья с {opp_name}"
        icon = "remove-circle-outline"
    create_news(db, user.club_id, "match", title,
        f"Тур {match.round}. Счёт: {hs}-{as_}. xG: {result["home_xg"]}-{result["away_xg"]}",
        icon)

    return {
        "match_id": match.id,
        "home_name": home_club.name,
        "away_name": away_club.name,
        "home_score": result['home_score'],
        "away_score": result['away_score'],
        "events": result['events'],
        "home_xg": result['home_xg'],
        "away_xg": result['away_xg'],
    }

@router.post("/friendly")
def play_friendly(data: FriendlyData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    
    user = db.query(User).filter(User.id == user_id).first()
    tactics = db.query(Tactics).filter(Tactics.user_id == user_id).first()
    
    result = simulate_match(
        home_id=user.club_id,
        away_id=data.opponent_id,
        home_lineup=tactics.lineup if tactics else None,
        home_style=tactics.style if tactics else 'balanced',
        is_friendly=True,
    )
    
    home_club = db.query(Club).filter(Club.id == user.club_id).first()
    away_club = db.query(Club).filter(Club.id == data.opponent_id).first()
    
    return {
        "home_name": home_club.name if home_club else "Ваш клуб",
        "away_name": away_club.name if away_club else "Соперник",
        "home_score": result['home_score'],
        "away_score": result['away_score'],
        "events": result['events'],
        "home_xg": result['home_xg'],
        "away_xg": result['away_xg'],
        "is_friendly": True,
    }

def _update_standings(match, db):
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season:
        return
    
    home_s = db.query(Standing).filter(
        Standing.season_id == season.id,
        Standing.club_id == match.home_id,
    ).first()
    away_s = db.query(Standing).filter(
        Standing.season_id == season.id,
        Standing.club_id == match.away_id,
    ).first()
    
    if not home_s or not away_s:
        return
    
    home_s.played += 1
    away_s.played += 1
    home_s.gf += match.home_score
    home_s.ga += match.away_score
    away_s.gf += match.away_score
    away_s.ga += match.home_score
    
    if match.home_score > match.away_score:
        home_s.won += 1
        home_s.points += 3
        away_s.lost += 1
    elif match.home_score < match.away_score:
        away_s.won += 1
        away_s.points += 3
        home_s.lost += 1
    else:
        home_s.drawn += 1
        away_s.drawn += 1
        home_s.points += 1
        away_s.points += 1
