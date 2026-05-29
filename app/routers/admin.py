from fastapi import APIRouter
from app.engine.bot_engine import simulate_round
from app.database import SessionLocal
from app.models.season import Match, Season
from datetime import datetime

router = APIRouter()

@router.post("/simulate-round/{league}/{round_num}")
def admin_simulate_round(league: str, round_num: int):
    simulated = simulate_round(league, round_num)
    return {"simulated": simulated, "league": league, "round": round_num}

@router.post("/simulate-all-due")
def simulate_all_due():
    """Симулирует все матчи чья дата наступила"""
    db = SessionLocal()
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season:
        db.close()
        return {"message": "No active season"}

    today = datetime.utcnow().strftime('%Y-%m-%d')
    due_matches = db.query(Match).filter(
        Match.season_id == season.id,
        Match.status == 'scheduled',
        Match.date <= today,
    ).all()

    rounds_to_simulate = {}
    for m in due_matches:
        key = (m.league, m.round)
        rounds_to_simulate[key] = True

    db.close()

    total = 0
    for league, round_num in rounds_to_simulate:
        total += simulate_round(league, round_num)

    return {"total_simulated": total, "rounds": list(rounds_to_simulate.keys())}
