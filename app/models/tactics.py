from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class Tactics(Base):
    __tablename__ = "tactics"
    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, unique=True)
    formation   = Column(String, default='4-3-3')
    style       = Column(String, default='balanced')
    mentality   = Column(String, default='balanced')
    lineup      = Column(JSON, default={})
