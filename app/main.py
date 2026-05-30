from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routers import clubs, players, users, transfers, season, tactics, match, preseason, admin, cup, training, news, game

app = FastAPI(title="Football Manager API")
app.mount("/static", StaticFiles(directory="static"), name="static")

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
app.include_router(game.router, prefix="/game", tags=["game"])
app.include_router(news.router, prefix="/news", tags=["news"])
app.include_router(training.router, prefix="/training", tags=["training"])
app.include_router(cup.router, prefix="/cup", tags=["cup"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(preseason.router, prefix="/preseason", tags=["preseason"])
app.include_router(match.router, prefix="/match", tags=["match"])
app.include_router(tactics.router, prefix="/tactics", tags=["tactics"])
app.include_router(season.router, prefix="/season", tags=["season"])

@app.get("/")
def root():
    return {"status": "Football Manager API running"}
