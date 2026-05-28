from sqlalchemy import Column, Integer, String, Float, Boolean, JSON
from app.database import Base

class Player(Base):
    __tablename__ = "players"
    id          = Column(Integer, primary_key=True)
    name        = Column(String)
    surname     = Column(String)
    position    = Column(String)
    club_id     = Column(Integer)
    age         = Column(Integer)
    born        = Column(String)
    nationality = Column(String)
    overall     = Column(Integer)
    potential   = Column(Integer)
    salary      = Column(Float)
    value       = Column(Float)
    contract    = Column(Integer)
    fitness     = Column(Integer, default=100)
    morale      = Column(Integer, default=8)
    fatigue     = Column(Integer, default=0)
    injury      = Column(JSON, nullable=True)
    stats       = Column(JSON, default={})
    form        = Column(JSON, default=[])
    awards      = Column(JSON, default=[])
    photo_url   = Column(String, nullable=True)
