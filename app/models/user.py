from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True)
    email           = Column(String, unique=True)
    password        = Column(String)
    manager_name    = Column(String)
    club_id         = Column(Integer, nullable=True)
    rating          = Column(Integer, default=50)
    season          = Column(Integer, default=1)
    gold            = Column(Float, default=0)
    secret_question = Column(String, nullable=True)
    secret_answer   = Column(String, nullable=True)
