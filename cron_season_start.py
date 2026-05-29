import requests
from datetime import datetime
from app.database import SessionLocal
from app.models.season import PreseasonConfig, PreseasonResult
from app.models.user import User
from app.engine.match_engine import simulate_match

PRESEASON_OPPONENTS = [
    {"day": 1, "match": 1, "opponent_id": 14},
    {"day": 1, "match": 2, "opponent_id": 15},
    {"day": 2, "match": 1, "opponent_id": 17},
    {"day": 2, "match": 2, "opponent_id": 18},
    {"day": 3, "match": 1, "opponent_id": 19},
    {"day": 3, "match": 2, "opponent_id": 20},
]

db = SessionLocal()
config = db.query(PreseasonConfig).filter(PreseasonConfig.status == 'active').first()

if config:
    start = datetime.fromisoformat(config.start_date)
    now = datetime.utcnow()
    elapsed_hours = (now - start).total_seconds() / 3600

    # Определяем какие дни уже закончились
    finished_days = [d for d in [1, 2, 3] if elapsed_hours >= d * 24]

    users = db.query(User).filter(User.club_id != None).all()
    simulated = 0

    for user in users:
        for opp in PRESEASON_OPPONENTS:
            if opp['day'] not in finished_days:
                continue
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
                print(f"Auto-simulated: user {user.id} day {opp['day']} match {opp['match']}")

    if simulated:
        db.commit()
    print(f"Done. Simulated: {simulated}, elapsed: {elapsed_hours:.1f}h, finished days: {finished_days}")
else:
    print("No active preseason")

db.close()
