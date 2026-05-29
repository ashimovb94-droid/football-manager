import random
from app.database import SessionLocal
from app.models.bot_manager import BotManager
from app.models.season import Match, Standing, Season
from app.models.club import Club
from app.models.player import Player
from app.models.tactics import Tactics
from app.engine.match_engine import simulate_match
from datetime import datetime

def get_bot_lineup(club_id, formation, db):
    """Автоматически расставляет игроков бота"""
    from app.engine.match_engine import _get_players
    
    PRIORITY = {
        'GK': ['GK'], 'CB': ['CB', 'RB', 'LB'], 'LB': ['LB', 'RB', 'CB'],
        'RB': ['RB', 'LB', 'CB'], 'LWB': ['LWB', 'LB', 'CB'], 'RWB': ['RWB', 'RB', 'CB'],
        'CDM': ['CDM', 'CM'], 'CM': ['CM', 'CDM', 'CAM'], 'CAM': ['CAM', 'CM', 'CDM'],
        'LM': ['LM', 'CM'], 'RM': ['RM', 'CM'], 'LW': ['LW', 'LM'],
        'RW': ['RW', 'RM'], 'ST': ['ST', 'LW', 'RW'],
    }
    
    FORMATIONS = {
        '4-4-2':  [('gk','GK'),('rb','RB'),('cb1','CB'),('cb2','CB'),('lb','LB'),('rm','RM'),('cm1','CM'),('cm2','CM'),('lm','LM'),('st1','ST'),('st2','ST')],
        '4-3-3':  [('gk','GK'),('rb','RB'),('cb1','CB'),('cb2','CB'),('lb','LB'),('cm1','CM'),('cdm','CDM'),('cm2','CM'),('rw','RW'),('st','ST'),('lw','LW')],
        '4-2-3-1':[('gk','GK'),('rb','RB'),('cb1','CB'),('cb2','CB'),('lb','LB'),('cdm1','CDM'),('cdm2','CDM'),('ram','CAM'),('cam','CAM'),('lam','CAM'),('st','ST')],
        '3-5-2':  [('gk','GK'),('cb1','CB'),('cb2','CB'),('cb3','CB'),('rwb','RWB'),('cm1','CM'),('cdm','CDM'),('cm2','CM'),('lwb','LWB'),('st1','ST'),('st2','ST')],
        '3-4-3':  [('gk','GK'),('cb1','CB'),('cb2','CB'),('cb3','CB'),('rm','RM'),('cm1','CM'),('cm2','CM'),('lm','LM'),('rw','RW'),('st','ST'),('lw','LW')],
        '5-3-2':  [('gk','GK'),('rwb','RWB'),('cb1','CB'),('cb2','CB'),('cb3','CB'),('lwb','LWB'),('cm1','CM'),('cdm','CDM'),('cm2','CM'),('st1','ST'),('st2','ST')],
    }
    
    positions = FORMATIONS.get(formation, FORMATIONS['4-3-3'])
    players = db.query(Player).filter(Player.club_id == club_id).all()
    used = set()
    lineup = {}
    
    for pos_id, pos_label in positions:
        priorities = PRIORITY.get(pos_label, [pos_label])
        for prio in priorities:
            candidates = [p for p in players if p.position == prio and p.id not in used]
            candidates.sort(key=lambda x: x.overall, reverse=True)
            if candidates:
                lineup[pos_id] = {'id': candidates[0].id}
                used.add(candidates[0].id)
                break
    
    return lineup

def simulate_round(league, round_num):
    """Симулирует все матчи тура"""
    db = SessionLocal()
    season = db.query(Season).filter(Season.status == 'active').first()
    if not season:
        db.close()
        return 0

    matches = db.query(Match).filter(
        Match.season_id == season.id,
        Match.league == league,
        Match.round == round_num,
        Match.status == 'scheduled',
    ).all()

    simulated = 0
    for match in matches:
        home_bot = db.query(BotManager).filter(BotManager.club_id == match.home_id).first()
        away_bot = db.query(BotManager).filter(BotManager.club_id == match.away_id).first()

        home_lineup = get_bot_lineup(match.home_id, home_bot.formation if home_bot else '4-3-3', db)
        away_lineup = get_bot_lineup(match.away_id, away_bot.formation if away_bot else '4-3-3', db)

        result = simulate_match(
            home_id=match.home_id,
            away_id=match.away_id,
            home_lineup=home_lineup,
            away_lineup=away_lineup,
            home_style=home_bot.style if home_bot else 'balanced',
            away_style=away_bot.style if away_bot else 'balanced',
        )

        match.home_score = result['home_score']
        match.away_score = result['away_score']
        match.status = 'finished'

        _update_standings(match, season.id, db)
        _update_bot_stats(home_bot, away_bot, result, db)
        simulated += 1

    db.commit()
    db.close()
    return simulated

def _update_standings(match, season_id, db):
    home_s = db.query(Standing).filter(Standing.season_id == season_id, Standing.club_id == match.home_id).first()
    away_s = db.query(Standing).filter(Standing.season_id == season_id, Standing.club_id == match.away_id).first()
    if not home_s or not away_s:
        return
    home_s.played += 1
    away_s.played += 1
    home_s.gf += match.home_score
    home_s.ga += match.away_score
    away_s.gf += match.away_score
    away_s.ga += match.home_score
    if match.home_score > match.away_score:
        home_s.won += 1; home_s.points += 3; away_s.lost += 1
        if home_s: home_s.wins_streak = getattr(home_s, 'wins_streak', 0) + 1
    elif match.home_score < match.away_score:
        away_s.won += 1; away_s.points += 3; home_s.lost += 1
    else:
        home_s.drawn += 1; away_s.drawn += 1
        home_s.points += 1; away_s.points += 1

def _update_bot_stats(home_bot, away_bot, result, db):
    if not home_bot or not away_bot:
        return
    if result['home_score'] > result['away_score']:
        home_bot.wins_streak += 1; home_bot.losses_streak = 0
        away_bot.losses_streak += 1; away_bot.wins_streak = 0
    elif result['home_score'] < result['away_score']:
        away_bot.wins_streak += 1; away_bot.losses_streak = 0
        home_bot.losses_streak += 1; home_bot.wins_streak = 0
    else:
        home_bot.wins_streak = 0; away_bot.wins_streak = 0

    # Бот меняет тактику после 3 поражений подряд
    FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2']
    STYLES = ['attacking', 'defensive', 'balanced', 'pressing', 'possession']
    import random
    if home_bot.losses_streak >= 3:
        home_bot.formation = random.choice(FORMATIONS)
        home_bot.style = random.choice(STYLES)
        home_bot.losses_streak = 0
    if away_bot.losses_streak >= 3:
        away_bot.formation = random.choice(FORMATIONS)
        away_bot.style = random.choice(STYLES)
        away_bot.losses_streak = 0
