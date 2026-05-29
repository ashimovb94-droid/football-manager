from app.database import SessionLocal
from app.models.cup import CupMatch
from app.models.season import Season
from app.models.club import Club
import random
from datetime import datetime, timedelta

db = SessionLocal()

season = db.query(Season).filter(Season.status == 'active').first()
if not season:
    print("No active season!")
    db.close()
    exit()

db.query(CupMatch).filter(CupMatch.season_id == season.id).delete()
db.commit()

ROUND_NAMES = {1: '1/32', 2: '1/16', 3: '1/8', 4: '1/4', 5: '1/2', 6: 'Финал'}
ROUND_DATES = {
    1: '2026-01-10', 2: '2026-01-31', 3: '2026-02-21',
    4: '2026-03-21', 5: '2026-04-18', 6: '2026-05-16'
}

# Берём все клубы АПЛ + Чемпионшип = 44 клуба
# Округляем до 32 — берём топ-32 по рейтингу
clubs = db.query(Club).order_by(Club.rating.desc()).limit(32).all()
club_ids = [c.id for c in clubs]
random.shuffle(club_ids)

# Генерируем 1/32 финала (16 матчей)
pos = 0
for i in range(0, 32, 2):
    db.add(CupMatch(
        season_id=season.id,
        round=1,
        round_name='1/32',
        home_id=club_ids[i],
        away_id=club_ids[i+1],
        status='scheduled',
        date=ROUND_DATES[1],
        bracket_pos=pos,
    ))
    pos += 1

db.commit()
matches = db.query(CupMatch).filter(CupMatch.season_id == season.id).count()
print(f"Done! {matches} cup matches created for round 1")
db.close()
