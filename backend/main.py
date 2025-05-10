# main.py

from fastapi import FastAPI
from nba_api.stats.static import players
from nba_api.stats.endpoints import playergamelog
import pandas as pd

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can replace "*" with ["http://localhost:5173"] later for safety
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "BallStreet backend is live!"}

@app.get("/player/{player_name}")
def get_player_data(player_name: str):
    player = players.find_players_by_full_name(player_name)
    if not player:
        return {"error": "Player not found"}

    player_id = player[0]['id']
    try:
        gamelog = playergamelog.PlayerGameLog(player_id=player_id, season='2023-24')
        df = gamelog.get_data_frames()[0]
    except Exception as e:
        return {"error": f"Failed to fetch game log: {str(e)}"}

    df['PERF_SCORE'] = df['PTS'] + 1.2 * df['REB'] + 1.5 * df['AST'] - 2 * df['TOV']
    df['BallStreet_Price'] = df['PERF_SCORE'].cumsum()

    return {
        "player": player[0]['full_name'],
        "prices": df[['GAME_DATE', 'BallStreet_Price']].to_dict(orient='records')
    }