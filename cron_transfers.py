from app.database import SessionLocal
from app.models.player import Player
from app.models.club import Club
from app.models.bot_manager import BotManager
from sqlalchemy import text
from datetime import datetime, timedelta
import random

db = SessionLocal()

now = datetime.utcnow()

# Находим всех выставленных игроков
listed = db.query(Player).filter(Player.transfer_listed == True).all()

for player in listed:
    # Проверяем нет ли уже предложения
    existing = db.execute(text(
        f"SELECT id FROM transfer_offers WHERE player_id = {player.id} AND status = 'pending'"
    )).fetchone()
    if existing:
        continue

    # Время до предложения зависит от рейтинга
    if player.overall >= 90:
        delay_hours = random.uniform(0.5, 2)    # 30мин - 2ч
        interest_chance = 0.95
    elif player.overall >= 80:
        delay_hours = random.uniform(3, 8)       # 3-8ч
        interest_chance = 0.85
    elif player.overall >= 70:
        delay_hours = random.uniform(12, 36)     # 12-36ч
        interest_chance = 0.70
    elif player.overall >= 60:
        delay_hours = random.uniform(48, 72)     # 2-3 дня
        interest_chance = 0.50
    else:
        delay_hours = random.uniform(72, 120)    # 3-5 дней
        interest_chance = 0.25

    # Проверяем время выставления
    listed_at = db.execute(text(
        f"SELECT created_at FROM transfer_offers WHERE player_id = {player.id} AND status = 'rejected' ORDER BY created_at DESC LIMIT 1"
    )).fetchone()

    # Рандом интереса
    if random.random() > interest_chance:
        continue

    # Ищем бота который может купить
    bots = db.query(BotManager).all()
    random.shuffle(bots)
    for bot in bots:
        if bot.club_id == player.club_id:
            continue
        bot_club = db.query(Club).filter(Club.id == bot.club_id).first()
        if not bot_club:
            continue
        asking = player.asking_price or player.value
        offer = round(asking * random.uniform(0.85, 1.05), 1)
        if bot_club.budget >= offer:
            selling_club = db.query(Club).filter(Club.id == player.club_id).first()
            if not selling_club:
                continue
            db.execute(text(
                f"INSERT INTO transfer_offers (player_id, from_club_id, to_club_id, offer_price) "
                f"VALUES ({player.id}, {bot_club.id}, {selling_club.id}, {offer})"
            ))
            db.commit()
            print(f"[{player.overall} OVR] {bot_club.name} bids £{offer}M for {player.name} {player.surname} (delay: {delay_hours:.1f}h)")
            break

db.close()
