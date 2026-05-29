from sqlalchemy import Column, Integer, String, Float, JSON, Boolean
from app.database import Base

class Player(Base):
    __tablename__ = "players"
    id              = Column(Integer, primary_key=True)
    name            = Column(String)
    surname         = Column(String)
    position        = Column(String)
    club_id         = Column(Integer, nullable=True)
    age             = Column(Integer)
    born            = Column(String)
    nationality     = Column(String)
    overall         = Column(Integer)
    potential       = Column(Integer)
    salary          = Column(Integer)
    value           = Column(Float)
    contract        = Column(Integer)
    fitness         = Column(Integer, default=100)
    morale          = Column(Integer, default=7)
    fatigue         = Column(Integer, default=0)
    injury          = Column(String, nullable=True)
    stats           = Column(JSON, default={})
    form            = Column(JSON, default=[])
    awards          = Column(JSON, default=[])
    transfer_listed = Column(Boolean, default=False)
    asking_price    = Column(Float, nullable=True)
    transfer_request= Column(Boolean, default=False)
