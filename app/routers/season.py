from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.season import Season, Match, Standing
from app.models.club import Club

router = APIRouter()

@router.get("/standings/{league}")
def get_standings(league: str, db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season:
        return []
    standings = db.query(Standing).filter(
        Standing.season_id == season.id,
        Standing.league == league
    ).order_by(Standing.points.desc(), (Standing.gf - Standing.ga).desc()).all()
    
    result = []
    for i, s in enumerate(standings):
        club = db.query(Club).filter(Club.id == s.club_id).first()
        result.append({
            "position": i + 1,
            "club_id": s.club_id,
            "club_name": club.name if club else "?",
            "played": s.played,
            "won": s.won,
            "drawn": s.drawn,
            "lost": s.lost,
            "gf": s.gf,
            "ga": s.ga,
            "gd": s.gf - s.ga,
            "points": s.points,
        })
    return result

@router.get("/matches/{league}/{round}")
def get_matches(league: str, round: int, db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season:
        return []
    matches = db.query(Match).filter(
        Match.season_id == season.id,
        Match.league == league,
        Match.round == round,
    ).all()
    
    result = []
    for m in matches:
        home = db.query(Club).filter(Club.id == m.home_id).first()
        away = db.query(Club).filter(Club.id == m.away_id).first()
        result.append({
            "id": m.id,
            "round": m.round,
            "date": m.date,
            "home_id": m.home_id,
            "home_name": home.name if home else "?",
            "home_primary": home.primary if home else "#333",
            "away_id": m.away_id,
            "away_name": away.name if away else "?",
            "away_primary": away.primary if away else "#333",
            "home_score": m.home_score,
            "away_score": m.away_score,
            "status": m.status,
        })
    return result

@router.get("/current-round/{league}")
def get_current_round(league: str, db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season:
        return {"round": 1}
    # Первый тур где есть незавершённые матчи
    match = db.query(Match).filter(
        Match.season_id == season.id,
        Match.league == league,
        Match.status == 'scheduled',
    ).order_by(Match.round).first()
    return {"round": match.round if match else 1}
