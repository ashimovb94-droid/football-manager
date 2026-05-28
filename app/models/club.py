from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base

class Club(Base):
    __tablename__ = "clubs"
    id          = Column(Integer, primary_key=True)
    name        = Column(String)
    city        = Column(String)
    league      = Column(String)  # championship / epl / ucl / uel
    primary     = Column(String)
    secondary   = Column(String)
    budget      = Column(Float)
    rating      = Column(Integer)
    min_rating  = Column(Integer, default=0)
    goal        = Column(String)
    expectations= Column(String)
    logo_url    = Column(String, nullable=True)
