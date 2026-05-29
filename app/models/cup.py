from sqlalchemy import Column, Integer, String
from app.database import Base

class CupMatch(Base):
    __tablename__ = "cup_matches"
    id              = Column(Integer, primary_key=True)
    season_id       = Column(Integer)
    round           = Column(Integer)
    round_name      = Column(String)
    home_id         = Column(Integer, nullable=True)
    away_id         = Column(Integer, nullable=True)
    home_score      = Column(Integer, nullable=True)
    away_score      = Column(Integer, nullable=True)
    penalties_home  = Column(Integer, nullable=True)
    penalties_away  = Column(Integer, nullable=True)
    winner_id       = Column(Integer, nullable=True)
    status          = Column(String, default='scheduled')
    date            = Column(String)
    bracket_pos     = Column(Integer)

class CupWinner(Base):
    __tablename__ = "cup_winners"
    id          = Column(Integer, primary_key=True)
    season_id   = Column(Integer)
    club_id     = Column(Integer)
    club_name   = Column(String)
    season_year = Column(String)
