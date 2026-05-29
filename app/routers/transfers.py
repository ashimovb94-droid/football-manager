from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.player import Player
from app.models.club import Club
from app.models.user import User
from app.auth import verify_token
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import random

router = APIRouter()

# Трансферные окна
WINDOWS = [
    {"start": "05-01", "end": "08-31", "name": "Летнее"},
    {"start": "01-01", "end": "01-31", "name": "Зимнее"},
]

def is_window_open():
    now = datetime.utcnow().strftime("%m-%d")
    for w in WINDOWS:
        if w["start"] <= now <= w["end"]:
            return True, w["name"]
    return False, None

def club_will_sell(player, asking_price, selling_club):
    """Решение клуба продавать ли игрока"""
    # Топ игроки не продаются дёшево
    if player.overall >= 88:
        return False, "Клуб не хочет продавать ключевого игрока"
    if player.overall >= 80 and asking_price < player.value * 1.3:
        return False, f"Клуб требует минимум £{player.value * 1.3:.1f}M"
    if asking_price < player.value * 0.8:
        return False, f"Предложение слишком низкое. Минимальная цена £{player.value:.1f}M"
    return True, "OK"

def player_will_join(player, buying_club, user_club_rating):
    """Решение игрока переходить ли"""
    if player.overall >= 85 and user_club_rating < 70:
        return False, f"Игрок уровня {player.overall} не рассматривает клубы с рейтингом ниже 70"
    if player.overall >= 80 and user_club_rating < 60:
        return False, "Игрок хочет играть на более высоком уровне"
    return True, "OK"

class TokenData(BaseModel):
    token: str
    player_id: int

class BuyData(BaseModel):
    token: str
    player_id: int
    offer: float  # предложенная цена

class SellData(BaseModel):
    token: str
    player_id: int
    price: float

class ListData(BaseModel):
    token: str
    player_id: int
    listed: bool

@router.get("/market")
def get_market(
    position: Optional[str] = None,
    min_ovr: Optional[int] = None,
    max_price: Optional[float] = None,
    free_agents: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    q = db.query(Player)
    if free_agents:
        q = q.filter(Player.club_id == None)
    else:
        q = q.filter(Player.club_id != None)
    if position:
        q = q.filter(Player.position == position)
    if min_ovr:
        q = q.filter(Player.overall >= min_ovr)
    if max_price:
        q = q.filter(Player.value <= max_price)
    players = q.order_by(Player.overall.desc()).limit(50).all()
    result = []
    for p in players:
        club = db.query(Club).filter(Club.id == p.club_id).first() if p.club_id else None
        result.append({
            "id": p.id, "name": p.name, "surname": p.surname,
            "position": p.position, "nationality": p.nationality,
            "age": p.age, "overall": p.overall, "potential": p.potential,
            "value": p.value, "salary": p.salary, "contract": p.contract,
            "club_id": p.club_id,
            "club_name": club.name if club else "Свободный агент",
            "club_primary": club.primary if club else "#333",
            "is_free_agent": p.club_id is None,
            "transfer_listed": getattr(p, 'transfer_listed', False) or False,
            "transfer_request": getattr(p, 'transfer_request', False) or False,
        })
    return result

@router.post("/buy")
def buy_player(data: BuyData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")

    user = db.query(User).filter(User.id == user_id).first()
    club = db.query(Club).filter(Club.id == user.club_id).first()
    player = db.query(Player).filter(Player.id == data.player_id).first()

    if not player or not club:
        raise HTTPException(status_code=404, detail="Не найдено")

    # Свободный агент — нет окна не нужно
    if player.club_id is None:
        if club.budget < player.value * 0.1:  # только зарплата
            raise HTTPException(status_code=400, detail="Недостаточно бюджета")
        player.club_id = user.club_id
        db.commit()
        return {"success": True, "message": f"✅ {player.name} {player.surname} подписан как свободный агент!"}

    # Проверяем окно
    window_open, window_name = is_window_open()
    if not window_open:
        raise HTTPException(status_code=400, detail="Трансферное окно закрыто")

    if club.budget < data.offer:
        raise HTTPException(status_code=400, detail=f"Недостаточно бюджета. У вас £{club.budget:.1f}M")

    selling_club = db.query(Club).filter(Club.id == player.club_id).first()

    # Решение клуба
    will_sell, reason = club_will_sell(player, data.offer, selling_club)
    if not will_sell:
        raise HTTPException(status_code=400, detail=f"❌ {selling_club.name if selling_club else 'Клуб'} отказал: {reason}")

    # Решение игрока
    will_join, reason = player_will_join(player, club, club.rating)
    if not will_join:
        raise HTTPException(status_code=400, detail=f"❌ Игрок отказался: {reason}")

    # Сделка
    club.budget -= data.offer
    if selling_club:
        selling_club.budget += data.offer
    player.club_id = user.club_id
    db.commit()
    db.commit()
    try:
        from app.utils.news_helper import create_news
        selling_name = selling_club.name if selling_club else "свободный агент"
        create_news(db, user.club_id, "transfer",
            f"{club.name} подписал {player.name} {player.surname}",
            f"{player.position} из {selling_name} за £{data.offer:.1f}M. Рейтинг: {player.overall}",
            "person-add-outline")
    except Exception as e:
        print(f"News error: {e}")

    return {
        "success": True,
        "message": f"✅ {player.name} {player.surname} подписан за £{data.offer:.1f}M!",
        "new_budget": club.budget
    }

@router.post("/sell")
def sell_player(data: SellData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")

    user = db.query(User).filter(User.id == user_id).first()
    club = db.query(Club).filter(Club.id == user.club_id).first()
    player = db.query(Player).filter(Player.id == data.player_id).first()

    if not player or not club:
        raise HTTPException(status_code=404, detail="Не найдено")
    if player.club_id != user.club_id:
        raise HTTPException(status_code=400, detail="Игрок не в вашем клубе")

    window_open, _ = is_window_open()
    if not window_open:
        raise HTTPException(status_code=400, detail="Трансферное окно закрыто")

    # Проверяем адекватность цены
    if data.price > player.value * 2:
        raise HTTPException(status_code=400, detail=f"Цена слишком высокая. Максимум £{player.value * 2:.1f}M")
    if data.price < player.value * 0.3:
        raise HTTPException(status_code=400, detail=f"Цена слишком низкая. Минимум £{player.value * 0.3:.1f}M")

    # Находим покупателя среди ботов
    from app.models.bot_manager import BotManager
    import random
    bots = db.query(BotManager).all()
    random.shuffle(bots)
    buyer = None
    for bot in bots:
        bot_club = db.query(Club).filter(Club.id == bot.club_id).first()
        if not bot_club or bot.club_id == user.club_id:
            continue
        # Бот покупает если у него хватает бюджета и цена разумная
        if bot_club.budget >= data.price and data.price <= player.value * 1.5:
            buyer = bot_club
            break

    if not buyer:
        raise HTTPException(status_code=400, detail="Нет желающих купить за такую цену. Попробуй снизить цену")

    # Сделка по запрошенной цене
    club.budget = round(club.budget + data.price, 2)
    buyer.budget = round(buyer.budget - data.price, 2)
    player.club_id = buyer.id
    db.commit()

    return {
        "success": True,
        "message": f"✅ {player.name} {player.surname} продан в {buyer.name} за £{data.price:.1f}M!",
        "new_budget": club.budget,
        "buyer": buyer.name
    }

class ListPlayerData(BaseModel):
    token: str
    player_id: int
    asking_price: float

class OfferResponseData(BaseModel):
    token: str
    offer_id: int
    accept: bool

@router.post("/list")
def list_player(data: ListPlayerData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player or player.club_id != user.club_id:
        raise HTTPException(status_code=400, detail="Игрок не в вашем клубе")
    if data.asking_price > player.value * 2:
        raise HTTPException(status_code=400, detail=f"Цена слишком высокая. Максимум £{player.value * 2:.1f}M")
    player.transfer_listed = True
    player.asking_price = data.asking_price
    db.commit()
    return {"success": True, "message": f"✅ {player.name} {player.surname} выставлен на продажу за £{data.asking_price:.1f}M"}

@router.post("/unlist")
def unlist_player(data: TokenData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player or player.club_id != user.club_id:
        raise HTTPException(status_code=400, detail="Игрок не в вашем клубе")
    player.transfer_listed = False
    player.asking_price = None
    db.commit()
    return {"success": True}

@router.get("/offers/{token}")
def get_offers(token: str, db: Session = Depends(get_db)):
    from sqlalchemy import text
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    rows = db.execute(text(
        "SELECT o.*, p.name, p.surname, p.position, p.overall, c.name as from_club_name "
        "FROM transfer_offers o "
        "JOIN players p ON p.id = o.player_id "
        "JOIN clubs c ON c.id = o.from_club_id "
        f"WHERE o.to_club_id = {user.club_id} AND o.status = 'pending'"
    )).fetchall()
    return [dict(r._mapping) for r in rows]

@router.post("/offer-response")
def respond_offer(data: OfferResponseData, db: Session = Depends(get_db)):
    from sqlalchemy import text
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Токен недействителен")
    user = db.query(User).filter(User.id == user_id).first()
    club = db.query(Club).filter(Club.id == user.club_id).first()
    row = db.execute(text(f"SELECT * FROM transfer_offers WHERE id = {data.offer_id}")).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Предложение не найдено")
    offer = dict(row._mapping)
    if data.accept:
        player = db.query(Player).filter(Player.id == offer['player_id']).first()
        buying_club = db.query(Club).filter(Club.id == offer['from_club_id']).first()
        if buying_club.budget < offer['offer_price']:
            raise HTTPException(status_code=400, detail="У клуба больше нет денег")
        club.budget = round(club.budget + offer['offer_price'], 2)
        buying_club.budget = round(buying_club.budget - offer['offer_price'], 2)
        player.club_id = buying_club.id
        player.transfer_listed = False
        player.asking_price = None
        db.execute(text(f"UPDATE transfer_offers SET status = 'accepted' WHERE id = {data.offer_id}"))
        db.commit()
        return {"success": True, "message": f"✅ {player.name} {player.surname} продан в {buying_club.name} за £{offer['offer_price']:.1f}M!"}
    else:
        db.execute(text(f"UPDATE transfer_offers SET status = 'rejected' WHERE id = {data.offer_id}"))
        db.commit()
        return {"success": True, "message": "Предложение отклонено"}
