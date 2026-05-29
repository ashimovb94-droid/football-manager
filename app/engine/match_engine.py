import random
from app.database import SessionLocal
from app.models.player import Player
from app.models.club import Club

def get_club_strength(club_id, db, lineup=None):
    """Считает силу клуба на основе игроков"""
    if lineup:
        player_ids = [p['id'] for p in lineup.values() if p]
        players = db.query(Player).filter(Player.id.in_(player_ids)).all()
    else:
        players = db.query(Player).filter(Player.club_id == club_id).all()
    
    if not players:
        club = db.query(Club).filter(Club.id == club_id).first()
        return club.rating if club else 50
    
    avg = sum(p.overall for p in players) / len(players)
    return avg

def simulate_match(home_id, away_id, home_lineup=None, away_lineup=None, 
                   home_style='balanced', away_style='balanced',
                   is_friendly=False):
    """Симулирует матч и возвращает результат с событиями"""
    db = SessionLocal()
    
    home_str = get_club_strength(home_id, db, home_lineup)
    away_str = get_club_strength(away_id, db, away_lineup)
    
    # Модификаторы стиля
    style_mods = {
        'attacking':  {'att': 1.2, 'def': 0.9},
        'defensive':  {'att': 0.8, 'def': 1.2},
        'pressing':   {'att': 1.1, 'def': 1.1},
        'possession': {'att': 0.95, 'def': 1.05},
        'balanced':   {'att': 1.0, 'def': 1.0},
    }
    
    hm = style_mods.get(home_style, style_mods['balanced'])
    am = style_mods.get(away_style, style_mods['balanced'])
    
    home_att = home_str * hm['att'] * 1.05  # +5% домашнее преимущество
    home_def = home_str * hm['def']
    away_att = away_str * am['att']
    away_def = away_str * am['def']
    
    # Ожидаемые голы
    home_xg = max(0.3, (home_att - away_def) / 20 + 1.2)
    away_xg = max(0.2, (away_att - home_def) / 20 + 1.0)
    
    if is_friendly:
        home_xg *= 0.8
        away_xg *= 0.8
    
    # Голы по Пуассону
    home_goals = _poisson(home_xg)
    away_goals = _poisson(away_xg)
    
    # Генерируем события
    events = _generate_events(home_id, away_id, home_goals, away_goals, db, home_lineup, away_lineup)
    
    db.close()
    
    return {
        "home_score": home_goals,
        "away_score": away_goals,
        "events": events,
        "home_xg": round(home_xg, 2),
        "away_xg": round(away_xg, 2),
    }

def _poisson(lam):
    """Генерирует случайное число голов"""
    import math
    L = math.exp(-lam)
    k, p = 0, 1.0
    while p > L:
        k += 1
        p *= random.random()
    return k - 1

def _generate_events(home_id, away_id, home_goals, away_goals, db, home_lineup=None, away_lineup=None):
    """Генерирует список событий матча"""
    events = []
    minutes = sorted(random.sample(range(1, 90), min(home_goals + away_goals + 4, 20)))
    
    home_players = _get_players(home_id, db, home_lineup)
    away_players = _get_players(away_id, db, away_lineup)
    
    home_scored = 0
    away_scored = 0
    
    for minute in minutes:
        if home_scored < home_goals and (away_scored >= away_goals or random.random() > 0.5):
            scorer = _random_scorer(home_players)
            events.append({
                "minute": minute,
                "type": "goal",
                "team": "home",
                "player": scorer,
                "score": f"{home_scored + 1}-{away_scored}"
            })
            home_scored += 1
        elif away_scored < away_goals:
            scorer = _random_scorer(away_players)
            events.append({
                "minute": minute,
                "type": "goal",
                "team": "away",
                "player": scorer,
                "score": f"{home_scored}-{away_scored + 1}"
            })
            away_scored += 1
    
    # Карточки
    for _ in range(random.randint(1, 4)):
        minute = random.randint(10, 89)
        team = random.choice(["home", "away"])
        players = home_players if team == "home" else away_players
        if players:
            player = random.choice(players)
            events.append({
                "minute": minute,
                "type": "yellow_card",
                "team": team,
                "player": f"{player.name} {player.surname}",
            })
    
    # Сортируем по минуте
    events.sort(key=lambda x: x["minute"])
    return events

def _get_players(club_id, db, lineup=None):
    if lineup:
        ids = [p['id'] for p in lineup.values() if p]
        return db.query(Player).filter(Player.id.in_(ids)).all()
    return db.query(Player).filter(Player.club_id == club_id).limit(11).all()

def _random_scorer(players):
    if not players:
        return "Неизвестный"
    # Нападающие забивают чаще
    weights = []
    for p in players:
        if p.position in ['ST', 'LW', 'RW']:
            weights.append(4)
        elif p.position in ['CAM', 'CM']:
            weights.append(2)
        else:
            weights.append(1)
    total = sum(weights)
    r = random.random() * total
    cumulative = 0
    for p, w in zip(players, weights):
        cumulative += w
        if r <= cumulative:
            return f"{p.name} {p.surname}"
    return f"{players[0].name} {players[0].surname}"
