from app.database import SessionLocal
from app.models.season import Season, Match, Standing
from app.models.club import Club
import random
from datetime import datetime, timedelta

db = SessionLocal()

# Завершаем старый сезон
old_season = db.query(Season).filter(Season.status == 'active').first()
old_number = old_season.number if old_season else 0
if old_season:
    old_season.status = 'finished'
    db.commit()

db.query(Match).delete()
db.query(Standing).delete()
db.commit()

# Создаём новый сезон
season = Season(number=old_number + 1, league='championship', status='active')
db.add(season)
db.commit()
db.refresh(season)

# Клубы Чемпионшипа
champ_clubs = db.query(Club).filter(Club.league == 'championship').all()
champ_ids = [c.id for c in champ_clubs]

# Клубы АПЛ
epl_clubs = db.query(Club).filter(Club.league == 'epl').all()
epl_ids = [c.id for c in epl_clubs]

def generate_schedule(club_ids, league, season_id, start_date, rounds):
    """Генерирует расписание по круговой системе"""
    n = len(club_ids)
    ids = club_ids[:]
    if n % 2 != 0:
        ids.append(None)  # bye
    
    half = len(ids) // 2
    matches = []
    
    # Первый круг
    for round_num in range(len(ids) - 1):
        round_matches = []
        for i in range(half):
            home = ids[i]
            away = ids[len(ids) - 1 - i]
            if home and away:
                round_matches.append((home, away))
        matches.append(round_matches)
        ids = [ids[0]] + [ids[-1]] + ids[1:-1]
    
    # Второй круг (реверс)
    second_half = [(away, home) for rnd in matches for home, away in rnd]
    second_rounds = []
    per_round = half
    for i in range(0, len(second_half), per_round):
        second_rounds.append(second_half[i:i+per_round])
    
    all_rounds = matches + second_rounds
    
    # Сохраняем матчи
    current_date = start_date
    for round_num, round_matches in enumerate(all_rounds[:rounds], 1):
        for home_id, away_id in round_matches:
            match = Match(
                season_id=season_id,
                league=league,
                round=round_num,
                home_id=home_id,
                away_id=away_id,
                status='scheduled',
                date=current_date.strftime('%Y-%m-%d'),
            )
            db.add(match)
        current_date += timedelta(weeks=1)

# Генерируем расписание
champ_start = datetime(2025, 8, 9)
epl_start = datetime(2025, 8, 16)

generate_schedule(champ_ids, 'championship', season.id, champ_start, 46)
generate_schedule(epl_ids, 'epl', season.id, epl_start, 38)

# Создаём таблицы
for cid in champ_ids:
    db.add(Standing(season_id=season.id, league='championship', club_id=cid))

for cid in epl_ids:
    db.add(Standing(season_id=season.id, league='epl', club_id=cid))

db.commit()

champ_matches = db.query(Match).filter(Match.league == 'championship').count()
epl_matches = db.query(Match).filter(Match.league == 'epl').count()
print(f"Done! Championship: {champ_matches} matches, EPL: {epl_matches} matches")
db.close()
