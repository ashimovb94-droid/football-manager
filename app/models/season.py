from sqlalchemy import Column, Integer, String, Boolean, JSON, Float
from app.database import Base

class Season(Base):
    __tablename__ = "seasons"
    id          = Column(Integer, primary_key=True)
    number      = Column(Integer, default=1)
    league      = Column(String)  # championship / epl
    status      = Column(String, default='active')  # active / finished

class Match(Base):
    __tablename__ = "matches"
    id           = Column(Integer, primary_key=True)
    season_id    = Column(Integer)
    league       = Column(String)  # championship / epl / ucl / uel / uecl / fa_cup
    round        = Column(Integer)
    home_id      = Column(Integer)
    away_id      = Column(Integer)
    home_score   = Column(Integer, nullable=True)
    away_score   = Column(Integer, nullable=True)
    status       = Column(String, default='scheduled')  # scheduled / finished / live
    date         = Column(String)

class Standing(Base):
    __tablename__ = "standings"
    id          = Column(Integer, primary_key=True)
    season_id   = Column(Integer)
    league      = Column(String)
    club_id     = Column(Integer)
    played      = Column(Integer, default=0)
    won         = Column(Integer, default=0)
    drawn       = Column(Integer, default=0)
    lost        = Column(Integer, default=0)
    gf          = Column(Integer, default=0)
    ga          = Column(Integer, default=0)
    points      = Column(Integer, default=0)

# Заготовки для еврокубков
class EuroGroup(Base):
    __tablename__ = "euro_groups"
    id          = Column(Integer, primary_key=True)
    season_id   = Column(Integer)
    competition = Column(String)  # ucl / uel / uecl
    group_name  = Column(String)  # A / B / C...
    club_ids    = Column(JSON)

class EuroMatch(Base):
    __tablename__ = "euro_matches"
    id           = Column(Integer, primary_key=True)
    season_id    = Column(Integer)
    competition  = Column(String)
    stage        = Column(String)  # group / r16 / qf / sf / final
    round        = Column(Integer, nullable=True)
    home_id      = Column(Integer)
    away_id      = Column(Integer)
    home_score   = Column(Integer, nullable=True)
    away_score   = Column(Integer, nullable=True)
    status       = Column(String, default='scheduled')
    date         = Column(String)
    leg          = Column(Integer, default=1)  # 1 или 2 (для двух матчей)

class PreseasonConfig(Base):
    __tablename__ = "preseason_config"
    id          = Column(Integer, primary_key=True)
    start_date  = Column(String)   # ISO datetime когда стартовала предсезонка
    season_start= Column(String)   # ISO datetime когда стартует сезон
    status      = Column(String, default='active')  # active / finished

class PreseasonResult(Base):
    __tablename__ = "preseason_results"
    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer)
    day         = Column(Integer)
    match_num   = Column(Integer)
    home_score  = Column(Integer)
    away_score  = Column(Integer)
