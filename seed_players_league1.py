from app.database import SessionLocal
from app.models.club import Club
from app.models.player import Player
from app.models.bot_manager import BotManager
import random

POSITIONS = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'RW', 'ST',
             'GK', 'CB', 'LB', 'CM', 'ST', 'RW', 'LW', 'CB', 'CDM', 'CAM', 'ST']

NAMES = ['James','Jack','Tom','Harry','Oliver','George','Charlie','Joe','Sam','Will',
         'Ben','Luke','Dan','Matt','Chris','Ryan','Adam','Josh','Alex','Rob']
SURNAMES = ['Smith','Jones','Williams','Taylor','Brown','Davies','Evans','Wilson',
            'Johnson','Lee','Clarke','Walker','Hall','Wood','Martin','Allen','Baker']
NATIONS = ['Англия', 'Шотландия', 'Уэльс', 'Ирландия']

db = SessionLocal()
clubs = db.query(Club).filter(Club.league == 'league1').all()

for club in clubs:
    existing = db.query(Player).filter(Player.club_id == club.id).count()
    if existing >= 18:
        continue
    
    for i, pos in enumerate(POSITIONS):
        ovr = club.rating + random.randint(-8, 5)
        ovr = max(45, min(68, ovr))
        db.add(Player(
            name=random.choice(NAMES),
            surname=random.choice(SURNAMES),
            position=pos,
            club_id=club.id,
            age=random.randint(18, 33),
            born='2000-01-01',
            nationality=random.choice(NATIONS),
            overall=ovr,
            potential=min(80, ovr + random.randint(0, 8)),
            salary=random.randint(2, 8),
            value=round(random.uniform(0.1, 3.0), 1),
            contract=random.randint(2025, 2028),
            fitness=100, morale=7, fatigue=0,
            stats={}, form=[], awards=[],
        ))
    
    # Бот менеджер
    existing_bot = db.query(BotManager).filter(BotManager.club_id == club.id).first()
    if not existing_bot:
        db.add(BotManager(
            club_id=club.id,
            formation=random.choice(['4-4-2','4-3-3','3-5-2']),
            style=random.choice(['balanced','defensive','attacking']),
            mentality=random.choice(['balanced','defensive']),
            transfer_policy='balanced',
        ))
    
    print(f'Seeded {club.name}')

db.commit()
db.close()
print('Done!')
