"""
Единый оркестратор жизненного цикла игры.
Вызывается кроном каждый час.
"""
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import SessionLocal
from app.models.season import Season, Match, Standing, PreseasonConfig, PreseasonResult
from app.models.cup import CupMatch
from app.models.club import Club
from app.models.user import User
from app.models.bot_manager import BotManager
from app.engine.bot_engine import simulate_round
from app.engine.match_engine import simulate_match
import random

def run():
    db = SessionLocal()
    try:
        config = db.query(PreseasonConfig).filter(PreseasonConfig.status == 'active').first()
        
        if not config:
            print("[LIFECYCLE] No active preseason config")
            db.close()
            return
        
        now = datetime.utcnow()
        season_start = datetime.fromisoformat(config.season_start)
        
        # === ПРЕДСЕЗОНКА ===
        if now < season_start:
            _handle_preseason(db, config, now)
            db.close()
            return
        
        # === СЕЗОН ===
        season = db.query(Season).filter(Season.status == 'active').first()
        if not season:
            print("[LIFECYCLE] No active season - creating...")
            _start_new_season(db, config)
            db.close()
            return
        
        # Проверяем трансферное окно
        _check_transfer_window(db, now)

        # Восстановление усталости игроков каждый час
        _recover_fatigue(db)

        # Трансферы ботов
        _bot_transfers(db)
        
        # Симулируем матчи чья дата наступила
        _simulate_due_matches(db, season, now)
        
        # Симулируем кубок — всегда до проверки завершения сезона
        _simulate_cup_matches(db, season, now)
        
        # Симулируем все просроченные раунды кубка
        for _ in range(6):
            _simulate_cup_matches(db, season, now)

        # Проверяем завершён ли сезон
        for league in ['championship', 'epl']:
            remaining = db.query(Match).filter(
                Match.season_id == season.id,
                Match.league == league,
                Match.status == 'scheduled'
            ).count()
            
            if remaining == 0:
                total = db.query(Match).filter(
                    Match.season_id == season.id,
                    Match.league == league
                ).count()
                if total > 0:
                    print(f"[LIFECYCLE] {league} season complete!")
                    _finish_league(db, season, league)
        
        db.commit()
        
    except Exception as e:
        print(f"[LIFECYCLE ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def _check_transfer_window(db, now):
    """Генерирует новость при открытии/закрытии трансферного окна"""
    from app.utils.news_helper import create_news
    from app.models.user import User
    
    month_day = now.strftime("%m-%d")
    hour = now.hour
    
    # Открытие летнего окна 1 июня
    if month_day == "06-01" and hour == 0:
        users = db.query(User).filter(User.club_id != None).all()
        for u in users:
            create_news(db, u.club_id, "transfer_window",
                "Окно открыто до 31 августа. Самое время усилить состав.",
                "cash-outline")
    
    # Закрытие летнего окна 1 сентября
    elif month_day == "09-01" and hour == 0:
        users = db.query(User).filter(User.club_id != None).all()
        for u in users:
            create_news(db, u.club_id, "transfer_window",
                "Трансферное окно закрыто",
                "Летнее окно закрыто. Следующее — январское.",
                "lock-closed-outline")
    
    # Открытие зимнего окна 1 января
    elif month_day == "01-01" and hour == 0:
        users = db.query(User).filter(User.club_id != None).all()
        for u in users:
            create_news(db, u.club_id, "transfer_window",
                "Январское окно открыто до 31 января.",
                "snow-outline")

def _recover_fatigue(db):
    """Восстанавливает усталость игроков на 2 единицы каждый час"""
    from app.models.player import Player
    db.execute(text(
        "UPDATE players SET fatigue = GREATEST(0, fatigue - 2) WHERE fatigue > 0"
    ))
    db.commit()

def _bot_transfers(db):
    """Боты покупают/продают игроков"""
    import random
    from app.models.player import Player
    from app.models.bot_manager import BotManager
    
    bots = db.query(BotManager).all()
    for bot in bots:
        club = db.query(Club).filter(Club.id == bot.club_id).first()
        if not club or club.budget < 2: continue
        
        # Покупка — ищем игрока позиции с нужным рейтингом
        if random.random() < 0.1 and club.budget > 5:
            target = db.query(Player).filter(
                Player.club_id != bot.club_id,
                Player.value <= club.budget * 0.3,
                Player.overall >= club.rating - 5,
            ).order_by(Player.overall.desc()).first()
            if target and target.club_id:
                selling_club = db.query(Club).filter(Club.id == target.club_id).first()
                if selling_club and target.overall < 88:
                    club.budget = round(club.budget - target.value, 2)
                    selling_club.budget = round(selling_club.budget + target.value, 2)
                    target.club_id = bot.club_id
                    print(f"[BOT TRANSFER] {club.name} buys {target.name} {target.surname}")
    
    db.commit()

def _handle_preseason(db, config, now):
    """Симулирует несыгранные товарняки прошедших дней"""
    start = datetime.fromisoformat(config.start_date)
    elapsed_hours = (now - start).total_seconds() / 3600
    finished_days = [d for d in [1, 2, 3] if elapsed_hours >= d * 24]
    
    OPPONENTS = [
        {"day": 1, "match": 1, "opponent_id": 14},
        {"day": 1, "match": 2, "opponent_id": 15},
        {"day": 2, "match": 1, "opponent_id": 17},
        {"day": 2, "match": 2, "opponent_id": 18},
        {"day": 3, "match": 1, "opponent_id": 19},
        {"day": 3, "match": 2, "opponent_id": 20},
    ]
    
    users = db.query(User).filter(User.club_id != None).all()
    simulated = 0
    
    for user in users:
        for opp in OPPONENTS:
            if opp['day'] not in finished_days:
                continue
            existing = db.query(PreseasonResult).filter(
                PreseasonResult.user_id == user.id,
                PreseasonResult.day == opp['day'],
                PreseasonResult.match_num == opp['match'],
            ).first()
            if not existing:
                result = simulate_match(
                    home_id=user.club_id,
                    away_id=opp['opponent_id'],
                    is_friendly=True,
                )
                db.add(PreseasonResult(
                    user_id=user.id,
                    day=opp['day'],
                    match_num=opp['match'],
                    home_score=result['home_score'],
                    away_score=result['away_score'],
                ))
                simulated += 1
    
    if simulated:
        db.commit()
        print(f"[PRESEASON] Auto-simulated {simulated} friendlies")

def _simulate_due_matches(db, season, now):
    """Симулирует матчи лиги чья дата наступила"""
    today = now.strftime('%Y-%m-%d')
    
    due_rounds = db.execute(text(
        f"SELECT DISTINCT league, round FROM matches "
        f"WHERE season_id = {season.id} AND status = 'scheduled' AND date <= '{today}' "
        f"ORDER BY league, round"
    )).fetchall()
    
    for row in due_rounds:
        league, round_num = row.league, row.round
        simulated = simulate_round(league, round_num)
        if simulated > 0:
            print(f"[SEASON] Simulated {simulated} matches - {league} round {round_num}")

def _simulate_cup_matches(db, season, now):
    """Симулирует матчи кубка чья дата наступила — все сезоны"""
    today = now.strftime('%Y-%m-%d')
    
    due_rounds = db.execute(text(
        f"SELECT DISTINCT round, season_id FROM cup_matches "
        f"WHERE status = 'scheduled' "
        f"AND home_id IS NOT NULL AND away_id IS NOT NULL "
        f"AND date <= '{today}' ORDER BY season_id, round"
    )).fetchall()
    
    for row in due_rounds:
        round_num = row.round
        cup_season_id = row.season_id
        from app.routers.cup import simulate_cup_round
        # Вызываем напрямую
        matches = db.query(CupMatch).filter(
            CupMatch.season_id == cup_season_id,
            CupMatch.round == round_num,
            CupMatch.status == 'scheduled',
            CupMatch.home_id != None,
            CupMatch.away_id != None,
        ).all()
        
        from app.models.bot_manager import BotManager
        from app.engine.bot_engine import get_bot_lineup
        import random as rnd
        
        for match in matches:
            home_bot = db.query(BotManager).filter(BotManager.club_id == match.home_id).first()
            away_bot = db.query(BotManager).filter(BotManager.club_id == match.away_id).first()
            result = simulate_match(
                home_id=match.home_id, away_id=match.away_id,
                home_lineup=get_bot_lineup(match.home_id, home_bot.formation if home_bot else '4-3-3', db),
                away_lineup=get_bot_lineup(match.away_id, away_bot.formation if away_bot else '4-3-3', db),
            )
            match.home_score = result['home_score']
            match.away_score = result['away_score']
            match.status = 'finished'
            if result['home_score'] > result['away_score']:
                match.winner_id = match.home_id
            elif result['home_score'] < result['away_score']:
                match.winner_id = match.away_id
            else:
                # Ничья — пенальти
                ph = rnd.randint(3, 5)
                pa = rnd.randint(3, 5)
                while ph == pa:
                    pa = rnd.randint(3, 5)
                match.penalties_home = ph
                match.penalties_away = pa
                match.winner_id = match.home_id if ph > pa else match.away_id
            
            # Продвигаем победителя
            _advance_cup(match, season.id, db)
        
        db.commit()
        print(f"[CUP] Simulated round {round_num}")
        
        # Если финал — сохраняем результат
        if round_num == 6:
            _save_cup_result(db, cup_season_id)

def _advance_cup(match, season_id, db):
    if match.round >= 6: return
    next_round = match.round + 1
    next_pos = match.bracket_pos // 2
    next_match = db.query(CupMatch).filter(
        CupMatch.season_id == match.season_id,
        CupMatch.round == next_round,
        CupMatch.bracket_pos == next_pos,
    ).first()
    ROUND_DATES = {2:'2026-01-31',3:'2026-02-21',4:'2026-04-18',5:'2026-05-16',6:'2026-05-30'}
    ROUND_NAMES = {2:'1/16',3:'1/8',4:'1/4',5:'1/2',6:'Финал'}
    if not next_match:
        next_match = CupMatch(
            season_id=season_id, round=next_round,
            round_name=ROUND_NAMES[next_round],
            status='scheduled', date=ROUND_DATES[next_round],
            bracket_pos=next_pos,
        )
        db.add(next_match)
        db.flush()
    if match.bracket_pos % 2 == 0:
        next_match.home_id = match.winner_id
    else:
        next_match.away_id = match.winner_id
    db.commit()

def _finish_league(db, season, league):
    """Завершает лигу: повышение/вылет, обновление рейтингов"""
    standings = db.query(Standing).filter(
        Standing.season_id == season.id,
        Standing.league == league
    ).order_by(Standing.points.desc()).all()
    
    if not standings:
        return
    
    # Повышение/вылет клубов
    if league == 'championship':
        for i, s in enumerate(standings):
            club = db.query(Club).filter(Club.id == s.club_id).first()
            if not club: continue
            if i < 2:
                club.league = 'epl'
                club.budget = round(club.budget + 80.0, 2)
                print(f"[PROMOTION] {club.name} -> EPL +80M")
            elif i < 6:
                club.budget = round(club.budget + 5.0, 2)
            elif i >= len(standings) - 3:
                club.league = 'league1'
                club.budget = round(max(3.0, club.budget - 10.0), 2)
                print(f"[RELEGATION] {club.name} relegated")
    elif league == 'epl':
        for i, s in enumerate(standings):
            club = db.query(Club).filter(Club.id == s.club_id).first()
            if not club: continue
            tv = max(20.0, 120.0 - i * 5.0)
            club.budget = round(club.budget + tv, 2)
            if i >= len(standings) - 3:
                club.league = 'championship'
                club.budget = round(max(5.0, club.budget - 30.0), 2)
                print(f"[RELEGATION] {club.name} from EPL")
    
    # Сохраняем историю карьеры
    sorted_standings = sorted(standings, key=lambda s: (-(s.points), -(s.gf - s.ga)))
    users_all = db.query(User).filter(User.club_id != None).all()
    for user in users_all:
        my_s = next((s for s in sorted_standings if s.club_id == user.club_id), None)
        if not my_s: continue
        pos = [s.club_id for s in sorted_standings].index(user.club_id) + 1
        club = db.query(Club).filter(Club.id == user.club_id).first()
        db.execute(text(
            "INSERT INTO career_history (user_id, season_number, club_id, club_name, league, position, points, won, drawn, lost, gf, ga) "
            f"VALUES ({user.id}, {user.season or 1}, {user.club_id}, '" + (club.name if club else "?") + f"', '{league}', {pos}, {my_s.points}, {my_s.won}, {my_s.drawn}, {my_s.lost}, {my_s.gf}, {my_s.ga})"
        ))
    db.commit()

    # Обновляем рейтинг менеджеров
    users = db.query(User).filter(User.club_id != None).all()
    for user in users:
        my_standing = next((s for s in standings if s.club_id == user.club_id), None)
        if not my_standing: continue
        pos = standings.index(my_standing) + 1
        total = len(standings)
        if pos <= 2:
            user.rating = min(99, (user.rating or 50) + 10)
        elif pos <= 6:
            user.rating = min(99, (user.rating or 50) + 5)
        elif pos >= total - 2:
            user.rating = max(1, (user.rating or 50) - 5)
        else:
            user.rating = min(99, (user.rating or 50) + 2)
        
        # Следующий сезон
        user.season = (user.season or 1) + 1
    
    db.commit()
    
    # Сбрасываем выставленных игроков
    from app.models.player import Player
    db.query(Player).filter(Player.transfer_listed == True).update({
        'transfer_listed': False,
        'asking_price': None
    })
    # Сбрасываем предложения
    db.execute(text("UPDATE transfer_offers SET status = 'expired' WHERE status = 'pending'"))
    db.commit()
    print('[LIFECYCLE] Transfer listings reset')

    # Сохраняем результаты для показа игрокам
    import json
    users_to_notify = db.query(User).filter(User.club_id != None).all()
    for user in users_to_notify:
        my_s = next((s for s in standings if s.club_id == user.club_id), None)
        if not my_s: continue
        pos = [s.club_id for s in standings].index(user.club_id) + 1
        club = db.query(Club).filter(Club.id == user.club_id).first()
        results_data = {
            'position': pos,
            'points': my_s.points,
            'won': my_s.won,
            'drawn': my_s.drawn,
            'lost': my_s.lost,
            'gf': my_s.gf,
            'ga': my_s.ga,
            'league': league,
            'club_name': club.name if club else '',
            'season_number': user.season or 1,
        }
        db.execute(text(f"UPDATE users SET pending_results = :r WHERE id = {user.id}"), {'r': json.dumps(results_data)})
    db.commit()
    print('[LIFECYCLE] Results saved for players')

    # Стартуем новую предсезонку
    _start_new_preseason(db)

def _start_new_season(db, config):
    """Создаёт новый сезон"""
    import subprocess
    subprocess.run(['python3', 'generate_season.py'], cwd='/var/www/football-manager')
    subprocess.run(['python3', 'generate_cup.py'], cwd='/var/www/football-manager')
    print("[LIFECYCLE] New season generated!")

def _start_new_preseason(db):
    """Завершает текущую предсезонку и стартует новую через паузу"""
    # Завершаем текущую
    db.query(PreseasonConfig).update({'status': 'done'})
    
    # Новая предсезонка через 24 часа (пауза между сезонами)
    now = datetime.utcnow()
    new_start = now + timedelta(hours=24)
    season_start = new_start + timedelta(hours=72)
    
    db.add(PreseasonConfig(
        start_date=new_start.isoformat(),
        season_start=season_start.isoformat(),
        status='active'
    ))
    db.commit()
    print("[LIFECYCLE] New preseason scheduled!")

if __name__ == '__main__':
    run()

def _save_cup_result(db, season_id):
    """Сохраняет результат кубка и уведомляет игроков"""
    import json
    from app.utils.news_helper import create_news
    
    final = db.query(CupMatch).filter(
        CupMatch.season_id == season_id,
        CupMatch.round == 6,
        CupMatch.status == 'finished'
    ).first()
    
    if not final or not final.winner_id:
        return
    
    winner_club = db.query(Club).filter(Club.id == final.winner_id).first()
    loser_id = final.away_id if final.winner_id == final.home_id else final.home_id
    loser_club = db.query(Club).filter(Club.id == loser_id).first()
    
    print(f"[CUP WINNER] {winner_club.name} wins the cup!")
    
    users = db.query(User).filter(User.club_id != None).all()
    for user in users:
        if user.club_id == final.winner_id:
            cup_data = {
                'type': 'winner',
                'club_name': winner_club.name,
                'score': f"{final.home_score}-{final.away_score}",
                'opponent': loser_club.name if loser_club else '?',
            }
            db.execute(text(f"UPDATE users SET pending_cup = :r WHERE id = {user.id}"), {'r': json.dumps(cup_data)})
            create_news(db, user.club_id, 'cup',
                f"{winner_club.name} — ОБЛАДАТЕЛЬ КУБКА!",
                f"Финал: {winner_club.name} {final.home_score}-{final.away_score} {loser_club.name if loser_club else '?'}",
                'trophy-outline')
        elif user.club_id == loser_id:
            cup_data = {
                'type': 'finalist',
                'club_name': loser_club.name if loser_club else '?',
                'score': f"{final.home_score}-{final.away_score}",
                'opponent': winner_club.name,
            }
            db.execute(text(f"UPDATE users SET pending_cup = :r WHERE id = {user.id}"), {'r': json.dumps(cup_data)})
            create_news(db, user.club_id, 'cup',
                f"Финал кубка — поражение",
                f"{winner_club.name} выиграл кубок. Счёт: {final.home_score}-{final.away_score}",
                'medal-outline')
        else:
            create_news(db, user.club_id, 'cup',
                f"{winner_club.name} — обладатель Кубка Англии!",
                f"Финал: {winner_club.name} {final.home_score}-{final.away_score} {loser_club.name if loser_club else '?'}",
                'trophy-outline')
    
    db.commit()
