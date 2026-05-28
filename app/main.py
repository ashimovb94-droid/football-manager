from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import clubs, players, users, transfers, season

app = FastAPI(title="Football Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clubs.router, prefix="/clubs", tags=["clubs"])
app.include_router(players.router, prefix="/players", tags=["players"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(transfers.router, prefix="/transfers", tags=["transfers"])
app.include_router(season.router, prefix="/season", tags=["season"])

@app.get("/")
def root():
    return {"status": "Football Manager API running"}
