from app.database import engine, Base
from app.models.club import Club
from app.models.player import Player
from app.models.user import User

Base.metadata.create_all(bind=engine)
print("Tables created!")
