from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cup import CupMatch, CupWinner
from app.models.season import Season
from app.models.club import Club
from app.models.tactics import Tactics
from app.models.user import User
from app.auth import verify_token
from app.engine.match_engine import simulate_match
from app.engine.bot_engine import get_bot_lineup
from app.models.bot_manager import BotManager
from pydantic import BaseModel
import random

router = APIRouter()

ROUND_NAMES = {1: '1/16', 2: '1/8', 3: '1/4', 4: '1/2', 5: 'Финал'}
ROUND_DATES = {
    1: '2026-01-10', 2: '2026-01-31', 3: '2026-02-21',
    4: '2026-04-18', 5: '2026-05-16'
}

def club_info(club):
    if not club: return None
    return {"id": club.id, "name": club.name, "primary": club.primary, "secondary": club.secondary}

def decide_winner(match, home_score, away_score):
    if home_score > away_score:
        return match.home_id, None, None
    elif home_score < away_score:
        return match.away_id, None, None
    else:
        # Пенальти
        pen_home = random.randint(3, 6)
        pen_away = random.randint(3, 6)
        while pen_home == pen_away:
            pen_away = random.randint(3, 6)
        winner = match.home_id if pen_home > pen_away else match.away_id
        return winner, pen_home, pen_away

@router.get("/bracket")
def get_bracket(db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season: return []
    matches = db.query(CupMatch).filter(CupMatch.season_id == season.id).order_by(CupMatch.round, CupMatch.bracket_pos).all()
    result = []
    for m in matches:
        home = db.query(Club).filter(Club.id == m.home_id).first() if m.home_id else None
        away = db.query(Club).filter(Club.id == m.away_id).first() if m.away_id else None
        winner = db.query(Club).filter(Club.id == m.winner_id).first() if m.winner_id else None
        entry = {
            "id": m.id, "round": m.round, "round_name": m.round_name,
            "bracket_pos": m.bracket_pos, "date": m.date, "status": m.status,
            "home": club_info(home), "away": club_info(away), "winner": club_info(winner),
            "home_score": m.home_score, "away_score": m.away_score,
        }
        if hasattr(m, 'penalties_home') and m.penalties_home is not None:
            entry["penalties"] = f"{m.penalties_home}-{m.penalties_away}"
        result.append(entry)
    return result

class TokenData(BaseModel):
    token: str
    match_id: int

@router.post("/simulate-round/{round_num}")
def simulate_cup_round(round_num: int, db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season: return {"simulated": 0}
    matches = db.query(CupMatch).filter(
        CupMatch.season_id == season.id,
        CupMatch.round == round_num,
        CupMatch.status == 'scheduled',
        CupMatch.home_id != None,
        CupMatch.away_id != None,
    ).all()
    simulated = 0
    for match in matches:
        home_bot = db.query(BotManager).filter(BotManager.club_id == match.home_id).first()
        away_bot = db.query(BotManager).filter(BotManager.club_id == match.away_id).first()
        result = simulate_match(
            home_id=match.home_id, away_id=match.away_id,
            home_lineup=get_bot_lineup(match.home_id, home_bot.formation if home_bot else '4-3-3', db),
            away_lineup=get_bot_lineup(match.away_id, away_bot.formation if away_bot else '4-3-3', db),
        )
        match.home_score = result['home_score']
        match.away_score = result['away_score']
        match.status = 'finished'
        winner_id, pen_h, pen_a = decide_winner(match, result['home_score'], result['away_score'])
        match.winner_id = winner_id
        match.penalties_home = pen_h
        match.penalties_away = pen_a
        db.flush()
        db.commit()
        _advance_cup(match, db)
        simulated += 1
    return {"simulated": simulated}

def _advance_cup(match, db):
    if match.round >= 5: return
    season = db.query(Season).filter(Season.status == 'active').first()
    next_round = match.round + 1
    next_pos = match.bracket_pos // 2
    next_match = db.query(CupMatch).filter(
        CupMatch.season_id == season.id,
        CupMatch.round == next_round,
        CupMatch.bracket_pos == next_pos,
    ).first()
    if not next_match:
        next_match = CupMatch(
            season_id=season.id, round=next_round,
            round_name=ROUND_NAMES[next_round],
            status='scheduled', date=ROUND_DATES[next_round],
            bracket_pos=next_pos,
        )
        db.add(next_match)
        db.flush()
    if match.bracket_pos % 2 == 0:
        next_match.home_id = match.winner_id
    else:
        next_match.away_id = match.winner_id
    db.commit()
