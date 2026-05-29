from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base

class BotManager(Base):
    __tablename__ = "bot_managers"
    id              = Column(Integer, primary_key=True)
    club_id         = Column(Integer, unique=True)
    name            = Column(String)
    nationality     = Column(String)
    rating          = Column(Integer, default=50)
    formation       = Column(String, default='4-4-2')
    style           = Column(String, default='balanced')
    mentality       = Column(String, default='balanced')
    transfer_policy = Column(String, default='balanced')  # youth/experience/balanced
    wins_streak     = Column(Integer, default=0)
    losses_streak   = Column(Integer, default=0)
    seasons         = Column(Integer, default=0)
    fired           = Column(Integer, default=0)  # сколько раз уволен
    history         = Column(JSON, default=[])
