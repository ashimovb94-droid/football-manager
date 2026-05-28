from app.database import engine, Base
from app.models.club import Club
from app.models.player import Player
from app.models.user import User

Base.metadata.create_all(bind=engine)
print("Tables created!")
from app.models.tactics import Tactics
Base.metadata.create_all(bind=engine)
print("Tactics table created!")
from app.models.season import Season, Match, Standing, EuroGroup, EuroMatch
Base.metadata.create_all(bind=engine)
print("Season tables created!")
