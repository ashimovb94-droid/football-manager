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

# Все 44 клуба участвуют — 4 получают bye (проходят автоматом)
# 44 = 22 матча в 1/32 + 22 победителя = к 1/16 добавляем 10 bye = 32
clubs = db.query(Club).filter(Club.league.in_(['epl','championship','league1'])).all()
club_ids = [c.id for c in clubs]
random.shuffle(club_ids)

# 44 клуба → 22 матча в первом раунде
ROUND_NAMES[1] = '1/32'
pos = 0
for i in range(0, len(club_ids), 2):
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
