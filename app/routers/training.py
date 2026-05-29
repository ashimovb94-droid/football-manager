from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.player import Player
from app.models.user import User
from app.auth import verify_token
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy import text
import random

router = APIRouter()

TEAM_TRAININGS = {
    'attack':    { 'label': 'Атака',    'positions': ['ST','LW','RW','CAM'], 'stat': 'overall', 'boost': 0.2 },
    'defense':   { 'label': 'Оборона',  'positions': ['CB','LB','RB','CDM'], 'stat': 'overall', 'boost': 0.2 },
    'fitness':   { 'label': 'Физика',   'positions': 'all',                  'stat': 'fatigue',  'boost': -15 },
    'tactics':   { 'label': 'Тактика',  'positions': 'all',                  'stat': 'morale',   'boost': 1 },
    'standards': { 'label': 'Стандарты','positions': ['CM','CAM','LM','RM'], 'stat': 'overall', 'boost': 0.15 },
}

INDIVIDUAL_TRAININGS = {
    'shooting':  { 'label': 'Удар',      'positions': ['ST','LW','RW','CAM'], 'boost': 0.8 },
    'passing':   { 'label': 'Пас',       'positions': ['CM','CDM','CAM'],     'boost': 0.7 },
    'speed':     { 'label': 'Скорость',  'positions': 'all',                  'boost': 0.6 },
    'defending': { 'label': 'Защита',    'positions': ['CB','LB','RB','CDM'], 'boost': 0.8 },
    'gk':        { 'label': 'Вратарь',   'positions': ['GK'],                 'boost': 0.9 },
}

class TeamTrainingData(BaseModel):
    token: str
    focus: str

class IndividualTrainingData(BaseModel):
    token: str
    player_id: int
    focus: str

@router.get("/types")
def get_training_types():
    return {
        "team": [{"id": k, "label": v["label"]} for k, v in TEAM_TRAININGS.items()],
        "individual": [{"id": k, "label": v["label"]} for k, v in INDIVIDUAL_TRAININGS.items()],
    }

@router.get("/status/{token}")
def get_status(token: str, db: Session = Depends(get_db)):
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401)
    rows = db.execute(text(
        f"SELECT * FROM trainings WHERE user_id = {user_id} AND status = 'active' ORDER BY started_at DESC LIMIT 3"
    )).fetchall()
    now = datetime.utcnow()
    result = []
    for r in rows:
        row = dict(r._mapping)
        ends = datetime.fromisoformat(str(row['ends_at']))
        if ends <= now:
            # Тренировка завершилась — применяем
            _apply_training(row, user_id, db)
            db.execute(text(f"UPDATE trainings SET status = 'done' WHERE id = {row['id']}"))
            db.commit()
            row['completed'] = True
        else:
            hours_left = (ends - now).total_seconds() / 3600
            row['hours_left'] = round(hours_left, 1)
            row['completed'] = False
        result.append(row)
    return result

@router.post("/team")
def start_team_training(data: TeamTrainingData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401)
    
    if data.focus not in TEAM_TRAININGS:
        raise HTTPException(status_code=400, detail="Неизвестный тип тренировки")
    
    # Проверяем нет ли активной командной
    existing = db.execute(text(
        f"SELECT id FROM trainings WHERE user_id = {user_id} AND type = 'team' AND status = 'active'"
    )).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Командная тренировка уже идёт")
    
    now = datetime.utcnow()
    ends = now + timedelta(days=7)  # 1 игровая неделя
    
    db.execute(text(
        f"INSERT INTO trainings (user_id, type, focus, started_at, ends_at) "
        f"VALUES ({user_id}, 'team', '{data.focus}', '{now}', '{ends}')"
    ))
    db.commit()
    
    training = TEAM_TRAININGS[data.focus]
    return {
        "success": True,
        "message": f"✅ Начата командная тренировка: {training['label']}",
        "ends_at": ends.isoformat(),
        "hours": 168,
    }

@router.post("/individual")
def start_individual_training(data: IndividualTrainingData, db: Session = Depends(get_db)):
    user_id = verify_token(data.token)
    if not user_id:
        raise HTTPException(status_code=401)
    
    if data.focus not in INDIVIDUAL_TRAININGS:
        raise HTTPException(status_code=400, detail="Неизвестный тип тренировки")
    
    # Максимум 3 индивидуальных тренировки одновременно
    existing = db.execute(text(
        f"SELECT COUNT(*) as cnt FROM trainings WHERE user_id = {user_id} AND type = 'individual' AND status = 'active'"
    )).fetchone()
    if existing and existing.cnt >= 3:
        raise HTTPException(status_code=400, detail="Максимум 3 индивидуальных тренировки одновременно")
    
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Игрок не найден")
    
    now = datetime.utcnow()
    ends = now + timedelta(days=14)  # 2 игровые недели
    
    db.execute(text(
        f"INSERT INTO trainings (user_id, type, focus, started_at, ends_at) "
        f"VALUES ({user_id}, 'individual_{data.player_id}', '{data.focus}', '{now}', '{ends}')"
    ))
    db.commit()
    
    training = INDIVIDUAL_TRAININGS[data.focus]
    return {
        "success": True,
        "message": f"✅ {player.name} {player.surname} тренирует: {training['label']}",
        "ends_at": ends.isoformat(),
    }

def _apply_training(row, user_id, db):
    focus = row['focus']
    user = db.query(User).filter(User.id == user_id).first()
    if not user: return
    
    if row['type'] == 'team' and focus in TEAM_TRAININGS:
        t = TEAM_TRAININGS[focus]
        players = db.query(Player).filter(Player.club_id == user.club_id).all()
        for p in players:
            if t['positions'] == 'all' or p.position in t['positions']:
                if t['stat'] == 'overall':
                    boost = random.uniform(t['boost'] * 0.5, t['boost'] * 1.5)
                    p.overall = min(99, p.overall + round(boost, 1))
                elif t['stat'] == 'fatigue':
                    p.fatigue = max(0, p.fatigue + t['boost'])
                elif t['stat'] == 'morale':
                    p.morale = min(10, p.morale + t['boost'])
    
    elif row['type'].startswith('individual_'):
        player_id = int(row['type'].split('_')[1])
        player = db.query(Player).filter(Player.id == player_id).first()
        if player and focus in INDIVIDUAL_TRAININGS:
            t = INDIVIDUAL_TRAININGS[focus]
            boost = random.uniform(t['boost'] * 0.5, t['boost'] * 1.5)
            if player.age <= 23:
                boost *= 1.5  # молодые растут быстрее
            player.overall = min(99, round(player.overall + boost, 1))
    
    db.commit()
