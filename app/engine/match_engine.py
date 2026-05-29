import random
import math
from app.database import SessionLocal
from app.models.player import Player
from app.models.club import Club

def get_club_strength(club_id, db, lineup=None):
    if lineup:
        player_ids = [p['id'] for p in lineup.values() if p]
        players = db.query(Player).filter(Player.id.in_(player_ids)).all()
    else:
        players = db.query(Player).filter(Player.club_id == club_id).all()
    if not players:
        club = db.query(Club).filter(Club.id == club_id).first()
        return club.rating if club else 50
    return sum(p.overall for p in players) / len(players)

def simulate_match(home_id, away_id, home_lineup=None, away_lineup=None,
                   home_style='balanced', away_style='balanced', is_friendly=False):
    db = SessionLocal()
    home_str = get_club_strength(home_id, db, home_lineup)
    away_str = get_club_strength(away_id, db, away_lineup)

    style_mods = {
        'attacking':  {'att': 1.2, 'def': 0.9},
        'defensive':  {'att': 0.8, 'def': 1.2},
        'pressing':   {'att': 1.1, 'def': 1.1},
        'possession': {'att': 0.95, 'def': 1.05},
        'balanced':   {'att': 1.0, 'def': 1.0},
    }
    hm = style_mods.get(home_style, style_mods['balanced'])
    am = style_mods.get(away_style, style_mods['balanced'])

    home_att = home_str * hm['att'] * 1.05
    home_def = home_str * hm['def']
    away_att = away_str * am['att']
    away_def = away_str * am['def']

    home_xg = max(0.3, (home_att - away_def) / 20 + 1.2)
    away_xg = max(0.2, (away_att - home_def) / 20 + 1.0)
    if is_friendly:
        home_xg *= 0.8
        away_xg *= 0.8

    home_goals = _poisson(home_xg)
    away_goals = _poisson(away_xg)

    home_players = _get_players(home_id, db, home_lineup)
    away_players = _get_players(away_id, db, away_lineup)

    events = _generate_full_commentary(
        home_id, away_id, home_goals, away_goals,
        home_players, away_players, home_str, away_str
    )

    db.close()
    return {
        "home_score": home_goals,
        "away_score": away_goals,
        "events": events,
        "home_xg": round(home_xg, 2),
        "away_xg": round(away_xg, 2),
    }

def _poisson(lam):
    L = math.exp(-lam)
    k, p = 0, 1.0
    while p > L:
        k += 1
        p *= random.random()
    return k - 1

def _get_players(club_id, db, lineup=None):
    if lineup:
        ids = [p['id'] for p in lineup.values() if p]
        return db.query(Player).filter(Player.id.in_(ids)).all()
    return db.query(Player).filter(Player.club_id == club_id).limit(11).all()

def _random_scorer(players):
    if not players:
        return "Неизвестный"
    weights = []
    for p in players:
        if p.position in ['ST', 'LW', 'RW']: weights.append(5)
        elif p.position in ['CAM', 'CM', 'LM', 'RM']: weights.append(2)
        elif p.position in ['CDM']: weights.append(1)
        else: weights.append(0.3)
    total = sum(weights)
    r = random.random() * total
    cumulative = 0
    for p, w in zip(players, weights):
        cumulative += w
        if r <= cumulative:
            return f"{p.name} {p.surname}"
    return f"{players[0].name} {players[0].surname}"

def _random_assist(players, scorer_name):
    candidates = [p for p in players if f"{p.name} {p.surname}" != scorer_name]
    if not candidates:
        return None
    weights = []
    for p in candidates:
        if p.position in ['CAM', 'LW', 'RW', 'LM', 'RM']: weights.append(4)
        elif p.position in ['CM', 'CDM']: weights.append(2)
        else: weights.append(0.5)
    total = sum(weights)
    r = random.random() * total
    cumulative = 0
    for p, w in zip(candidates, weights):
        cumulative += w
        if r <= cumulative:
            return f"{p.name} {p.surname}"
    return None

GOAL_COMMENTS = [
    "Великолепный гол!",
    "Мяч в сетке!",
    "Не оставил шансов вратарю!",
    "Точный удар!",
    "Красивый гол!",
    "Молниеносная атака завершена голом!",
    "Неотразимый удар!",
]

MISS_COMMENTS = [
    "Удар мимо ворот.",
    "Вратарь парирует!",
    "Мяч попал в штангу!",
    "Выше ворот!",
    "Спасение защитника!",
    "Не попал в створ.",
]

ATTACK_COMMENTS = [
    "Хорошая атака, но пока без результата.",
    "Опасный момент у ворот!",
    "Навес в штрафную отбит.",
    "Передача не нашла адресата.",
    "Прострел вдоль ворот!",
    "Хорошая комбинация в центре поля.",
]

NEUTRAL_COMMENTS = [
    "Обе команды борются за мяч в центре поля.",
    "Напряжённая борьба в середине.",
    "Темп матча высокий.",
    "Игра идёт на встречных курсах.",
    "Команды обмениваются ударами.",
    "Хорошая организация игры в обороне.",
]

def _generate_full_commentary(home_id, away_id, home_goals, away_goals,
                               home_players, away_players, home_str, away_str):
    events = []
    home_scored = 0
    away_scored = 0

    # Генерируем минуты голов
    goal_minutes = sorted(random.sample(range(1, 90), min(home_goals + away_goals, 20)))
    goal_idx = 0
    goal_queue = []
    for m in goal_minutes:
        if home_scored < home_goals and (away_scored >= away_goals or random.random() > 0.5):
            goal_queue.append(('home', m))
            home_scored += 1
        elif away_scored < away_goals:
            goal_queue.append(('away', m))
            away_scored += 1

    home_scored = 0
    away_scored = 0

    # Ключевые минуты для комментариев
    key_minutes = sorted(set(
        list(range(5, 90, random.randint(6, 10))) +
        [m for _, m in goal_queue]
    ))

    for minute in key_minutes:
        # Проверяем гол на этой минуте
        goal = next((g for g in goal_queue if g[1] == minute), None)

        if goal:
            team, _ = goal
            if team == 'home':
                scorer = _random_scorer(home_players)
                assist = _random_assist(home_players, scorer) if random.random() > 0.4 else None
                home_scored += 1
            else:
                scorer = _random_scorer(away_players)
                assist = _random_assist(away_players, scorer) if random.random() > 0.4 else None
                away_scored += 1

            event = {
                "minute": minute,
                "type": "goal",
                "team": team,
                "player": scorer,
                "assist": assist,
                "score": f"{home_scored}-{away_scored}",
                "comment": random.choice(GOAL_COMMENTS),
            }
            if assist:
                event["comment"] += f" Ассист: {assist}."
            events.append(event)

        else:
            # Рандомное событие
            rand = random.random()
            if rand < 0.15:
                # Жёлтая карточка
                team = 'home' if random.random() > 0.5 else 'away'
                players = home_players if team == 'home' else away_players
                if players:
                    player = random.choice(players)
                    events.append({
                        "minute": minute,
                        "type": "yellow_card",
                        "team": team,
                        "player": f"{player.name} {player.surname}",
                        "comment": "Жёлтая карточка за грубый фол.",
                    })
            elif rand < 0.18:
                # Замена
                team = 'home' if random.random() > 0.5 else 'away'
                players = home_players if team == 'home' else away_players
                if len(players) >= 2:
                    p_out = random.choice(players)
                    p_in_name = f"Запасной {random.randint(1,5)}"
                    events.append({
                        "minute": minute,
                        "type": "substitution",
                        "team": team,
                        "player": f"{p_out.name} {p_out.surname}",
                        "player_in": p_in_name,
                        "comment": f"Замена: {p_in_name} выходит вместо {p_out.name} {p_out.surname}.",
                    })
            elif rand < 0.35:
                # Опасный момент
                team = 'home' if random.random() < (home_str / (home_str + away_str)) else 'away'
                players = home_players if team == 'home' else away_players
                player = _random_scorer(players) if players else "Игрок"
                events.append({
                    "minute": minute,
                    "type": "chance",
                    "team": team,
                    "player": player,
                    "comment": f"{player} — {random.choice(MISS_COMMENTS)}",
                })
            elif rand < 0.55:
                # Атака
                team = 'home' if random.random() < (home_str / (home_str + away_str)) else 'away'
                events.append({
                    "minute": minute,
                    "type": "attack",
                    "team": team,
                    "comment": random.choice(ATTACK_COMMENTS),
                })
            else:
                # Нейтральное
                events.append({
                    "minute": minute,
                    "type": "neutral",
                    "comment": random.choice(NEUTRAL_COMMENTS),
                })

    # Добавляем начало и конец
    events.insert(0, {"minute": 0, "type": "kickoff", "comment": "⚽ Матч начался!"})
    events.append({"minute": 90, "type": "fulltime",
                   "comment": f"⏱ Финальный свисток! Счёт: {home_scored}-{away_scored}"})

    return sorted(events, key=lambda x: x["minute"])
