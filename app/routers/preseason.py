from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.season import PreseasonConfig, PreseasonResult
from app.models.user import User
from app.auth import verify_token
from app.engine.match_engine import simulate_match
from app.models.club import Club
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

PRESEASON_OPPONENTS = [
    {"day": 1, "match": 1, "opponent_id": 14},
    {"day": 1, "match": 2, "opponent_id": 15},
    {"day": 2, "match": 1, "opponent_id": 17},
    {"day": 2, "match": 2, "opponent_id": 18},
    {"day": 3, "match": 1, "opponent_id": 19},
    {"day": 3, "match": 2, "opponent_id": 20},
]

class TokenData(BaseModel):
    token: str

class FriendlyData(BaseModel):
    token: str
    day: int
    match_num: int

@router.get("/status")
def get_status(db: Session = Depends(get_db)):
    config = db.query(PreseasonConfig).filter(PreseasonConfig.status == 'active').first()
    if not config:
        return {"started": False}
    now = datetime.utcnow()
    start = datetime.fromisoformat(config.start_date)
    season_start = datetime.fromisoformat(config.season_start)
    elapsed_hours = (now - start).total_seconds() / 3600
    return {
        "started": True,
        "start_date": config.start_date,
        "season_start": config.season_start,
        "current_day": min(3, int(elapsed_hours / 24) + 1),
        "available_days": [d for d in [1,2,3] if elapsed_hours >= (d-1) * 24],
        "season_started": now >= season_start,
        "hours_until_season": max(0, (season_start - now).total_seconds() / 3600),
    }

@router.post("/start")
def start_preseason(data: TokenData, db: Session = Depends(get_db)):
    existing = db.query(PreseasonConfig).filter(PreseasonConfig.status == 'active').first()
    if existing:
        return {"already_started": True, "start_date": existing.start_date}
    now = datetime.utcnow()
    season_start = now + timedelta(hours=72)
    config = PreseasonConfig(
        start_date=now.isoformat(),
        season_start=season_start.isoformat(),
        status='active'
    )
    db.add(config)
    db.commit()
    return {"started": True, "start_date": now.isoformat(), "season_start": season_start.isoformat()}

@router.post("/results")
def get_my_results(data: TokenData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    results = db.query(PreseasonResult).filter(PreseasonResult.user_id == user_id).all()
    return {f"{r.day}-{r.match_num}": {"home_score": r.home_score, "away_score": r.away_score} for r in results}

@router.post("/play")
def play_preseason_match(data: FriendlyData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")

    # Проверяем что матч ещё не сыгран
    existing = db.query(PreseasonResult).filter(
        PreseasonResult.user_id == user_id,
        PreseasonResult.day == data.day,
        PreseasonResult.match_num == data.match_num,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Матч уже сыгран")

    config = db.query(PreseasonConfig).filter(PreseasonConfig.status == 'active').first()
    if not config:
        raise HTTPException(status_code=400, detail="Предсезонка не началась")

    now = datetime.utcnow()
    start = datetime.fromisoformat(config.start_date)
    elapsed_hours = (now - start).total_seconds() / 3600
    available_days = [d for d in [1,2,3] if elapsed_hours >= (d-1) * 24]

    if data.day not in available_days:
        raise HTTPException(status_code=400, detail=f"День {data.day} ещё не доступен")

    opponent = next((o for o in PRESEASON_OPPONENTS if o['day'] == data.day and o['match'] == data.match_num), None)
    if not opponent:
        raise HTTPException(status_code=404, detail="Матч не найден")

    user = db.query(User).filter(User.id == user_id).first()
    result = simulate_match(home_id=user.club_id, away_id=opponent['opponent_id'], is_friendly=True)

    # Сохраняем результат
    db.add(PreseasonResult(
        user_id=user_id,
        day=data.day,
        match_num=data.match_num,
        home_score=result['home_score'],
        away_score=result['away_score'],
    ))
    db.commit()

    home_club = db.query(Club).filter(Club.id == user.club_id).first()
    away_club = db.query(Club).filter(Club.id == opponent['opponent_id']).first()

    return {
        "home_name": home_club.name if home_club else "Ваш клуб",
        "away_name": away_club.name if away_club else "Соперник",
        "home_score": result['home_score'],
        "away_score": result['away_score'],
        "events": result['events'],
        "day": data.day,
        "match_num": data.match_num,
    }

@router.post("/simulate-remaining")
def simulate_remaining(db: Session = Depends(get_db)):
    """Симулирует все несыгранные товарняки для всех игроков"""
    config = db.query(PreseasonConfig).filter(PreseasonConfig.status == 'active').first()
    if not config:
        return {"message": "No active preseason"}

    from app.models.user import User
    users = db.query(User).filter(User.club_id != None).all()
    simulated = 0

    for user in users:
        for opp in PRESEASON_OPPONENTS:
            existing = db.query(PreseasonResult).filter(
                PreseasonResult.user_id == user.id,
                PreseasonResult.day == opp['day'],
                PreseasonResult.match_num == opp['match'],
            ).first()
            if not existing:
                result = simulate_match(
                    home_id=user.club_id,
                    away_id=opp['opponent_id'],
                    is_friendly=True,
                )
                db.add(PreseasonResult(
                    user_id=user.id,
                    day=opp['day'],
                    match_num=opp['match'],
                    home_score=result['home_score'],
                    away_score=result['away_score'],
                ))
                simulated += 1

    db.commit()
    return {"simulated": simulated}
