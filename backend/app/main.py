# main.py
import asyncio
from fastapi import WebSocketDisconnect
from fastapi import FastAPI, Depends, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timedelta
import logging

from nba_api.stats.static import players
from nba_api.stats.endpoints import playergamelog, commonplayerinfo
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

from database import get_db, engine
import models
from models import User, Player, Portfolio, Transaction
from ml.price_predictor import PricePredictor
from ml.sentiment_analyzer import SentimentAnalyzer
from ml.performance_predictor import PerformancePredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                #client may have disconnected
                pass

manager = ConnectionManager()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BallStreet API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Performance score calculation
def calculate_performance_score(stats):
    weights = {
        'PTS': 1.0,
        'REB': 1.2,
        'AST': 1.5,
        'STL': 2.0,
        'BLK': 2.0,
        'TOV': -2.0,
        'FG_PCT': 50.0,
        'FG3_PCT': 50.0,
        'FT_PCT': 50.0
    }
    
    score = sum(stats.get(stat, 0) * weight for stat, weight in weights.items())
    return score

# Price normalization
def normalize_price(score, min_score=-50, max_score=100):
    scaler = MinMaxScaler(feature_range=(10, 1000))
    normalized = scaler.fit_transform([[score]])[0][0]
    return normalized

# Initialize ML models
price_predictor = PricePredictor()
sentiment_analyzer = SentimentAnalyzer()
performance_predictor = PerformancePredictor()

# Player endpoints
@app.get("/players", response_model=List[Player], tags=["Players"])
def get_players(db: Session = Depends(get_db)):
    """
    Get a list of all players in the system.
    """
    return db.query(Player).all()

@app.get("/player/{player_id}", response_model=Player, tags=["Players"])
def get_player(player_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific player.
    
    Args:
        player_id: The ID of the player to retrieve
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@app.get("/player/{player_id}/stats", tags=["Players"])
def get_player_stats(player_id: int, db: Session = Depends(get_db)):
    """
    Get detailed statistics for a specific player.
    
    Args:
        player_id: The ID of the player to get stats for
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    try:
        gamelog = playergamelog.PlayerGameLog(player_id=player.nba_id, season='2023-24')
        df = gamelog.get_data_frames()[0]
        
        # Calculate performance metrics
        df['PERF_SCORE'] = df.apply(lambda row: calculate_performance_score({
            'PTS': row['PTS'],
            'REB': row['REB'],
            'AST': row['AST'],
            'STL': row['STL'],
            'BLK': row['BLK'],
            'TOV': row['TOV'],
            'FG_PCT': row['FG_PCT'],
            'FG3_PCT': row['FG3_PCT'],
            'FT_PCT': row['FT_PCT']
        }), axis=1)
        
        df['BallStreet_Price'] = df['PERF_SCORE'].apply(normalize_price)
        
        return {
            "player": player.name,
            "stats": df.to_dict(orient='records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Portfolio endpoints
@app.get("/portfolio/{user_id}")
def get_portfolio(user_id: int, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    return portfolio

@app.post("/trade", tags=["Trading"])
def execute_trade(
    user_id: int,
    player_id: int,
    transaction_type: str,
    shares: float,
    db: Session = Depends(get_db)
):
    """
    Execute a trade (buy/sell) for a player.
    
    Args:
        user_id: The ID of the user making the trade
        player_id: The ID of the player being traded
        transaction_type: Either "BUY" or "SELL"
        shares: Number of shares to trade
    """
    if transaction_type not in ["BUY", "SELL"]:
        raise HTTPException(status_code=400, detail="Transaction type must be either 'BUY' or 'SELL'")
    
    if shares <= 0:
        raise HTTPException(status_code=400, detail="Number of shares must be greater than 0")
    
    user = db.query(User).filter(User.id == user_id).first()
    player = db.query(Player).filter(Player.id == player_id).first()
    
    if not user or not player:
        raise HTTPException(status_code=404, detail="User or player not found")
    
    total_amount = shares * player.current_price
    
    # Get or create portfolio entry
    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == user_id,
        Portfolio.player_id == player_id
    ).first()
    
    if transaction_type == "BUY":
        if user.balance < total_amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        user.balance -= total_amount
        
        # Update portfolio
        if portfolio:
            # Calculate new average price
            new_total_shares = portfolio.shares + shares
            new_avg_price = ((portfolio.shares * portfolio.average_buy_price) + (shares * player.current_price)) / new_total_shares
            
            portfolio.shares = new_total_shares
            portfolio.average_buy_price = new_avg_price
            portfolio.last_updated = datetime.utcnow()
        else:
            # Create new portfolio entry
            portfolio = Portfolio(
                user_id=user_id,
                player_id=player_id,
                shares=shares,
                average_buy_price=player.current_price,
                last_updated=datetime.utcnow()
            )
            db.add(portfolio)
    else:  # SELL
        if not portfolio or portfolio.shares < shares:
            raise HTTPException(status_code=400, detail="Insufficient shares")
        
        user.balance += total_amount
        
        # Update portfolio
        portfolio.shares -= shares
        portfolio.last_updated = datetime.utcnow()
        
        # Remove portfolio entry if no shares left
        if portfolio.shares <= 0:
            db.delete(portfolio)
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        player_id=player_id,
        transaction_type=transaction_type,
        shares=shares,
        price_per_share=player.current_price,
        total_amount=total_amount
    )
    
    db.add(transaction)
    db.commit()
    
    return {"message": "Trade executed successfully"}

# WebSocket for real-time price updates
@app.websocket("/ws/prices")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            try:
                # Get latest prices for all players
                db = next(get_db())
                players = db.query(Player).all()
                prices = {player.name: player.current_price for player in players}
                await websocket.send_json(prices)
                await asyncio.sleep(1)  # Update every second
            except Exception as e:
                print(f"Error in price update loop: {e}")
                await asyncio.sleep(5)  # Wait before retrying
                continue
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up BallStreet API")
    asyncio.create_task(update_market_prices())

async def update_market_prices():
    """Background task to update player prices"""
    while True:
        try:
            # Update prices in database
            db = next(get_db())
            players = db.query(Player).all()
            
            price_updates = {}
            for player in players:
                # Random price fluctuation (replace with your actual price model later)
                change_pct = np.random.normal(0, 0.01)  # Normal distribution with 1% std dev
                new_price = player.current_price * (1 + change_pct)
                
                # Update price history
                if not isinstance(player.price_history, list):
                    player.price_history = []
                player.price_history.append(player.current_price)
                
                # Keep only last 30 days of history
                if len(player.price_history) > 30:
                    player.price_history = player.price_history[-30:]
                
                player.current_price = new_price
                price_updates[player.name] = new_price
            
            db.commit()
            
            # Broadcast price updates to all connected clients
            await manager.broadcast(price_updates)
            
        except Exception as e:
            print(f"Error updating market prices: {e}")
        
        # Update prices every minute
        await asyncio.sleep(60)

# Market analysis endpoints
@app.get("/market/trending")
def get_trending_players(limit: int = 5, db: Session = Depends(get_db)):
    try:
        players = db.query(Player).all()
        
        # Make sure each player has at least 2 price points
        valid_players = [
            p for p in players 
            if isinstance(p.price_history, list) and len(p.price_history) >= 2
        ]
        
        if not valid_players:
            return []
        
        # Calculate price changes
        trending = []
        for player in valid_players:
            price_change = 0
            if len(player.price_history) >= 2:
                price_change = player.current_price - player.price_history[-2]
                price_change_pct = price_change / player.price_history[-2] * 100
                
                trending.append({
                    "id": player.id,
                    "name": player.name,
                    "current_price": player.current_price,
                    "price_change": price_change,
                    "price_change_pct": price_change_pct
                })
        
        # Sort by percentage change
        trending.sort(key=lambda p: p["price_change_pct"], reverse=True)
        
        return trending[:limit]
    except Exception as e:
        print(f"Error getting trending players: {e}")
        raise HTTPException(status_code=500, detail="Error calculating trending players")


# AI/ML endpoints
@app.get("/player/{player_id}/predictions")
def get_player_predictions(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get player stats
    stats = get_player_stats(player_id, db)
    
    # Get sentiment analysis
    sentiment = sentiment_analyzer.get_player_sentiment(player.name)
    
    # Predict next game performance
    next_game_prediction = performance_predictor.predict_performance(stats['stats'][0])
    
    # Predict next day price
    price_history = np.array(player.price_history)
    if len(price_history) >= 7:
        price_predictor.train(price_history)
        next_day_price = price_predictor.predict_next_day(price_history[-7:])
    else:
        next_day_price = player.current_price
    
    return {
        "player": player.name,
        "next_game_prediction": next_game_prediction,
        "next_day_price": next_day_price,
        "sentiment_analysis": sentiment,
        "feature_importance": performance_predictor.get_feature_importance()
    }

@app.get("/market/ai-insights")
def get_market_insights(db: Session = Depends(get_db)):
    players = db.query(Player).all()
    insights = []
    
    for player in players:
        # Get predictions for each player
        predictions = get_player_predictions(player.id, db)
        
        # Calculate potential return
        potential_return = (
            predictions['next_day_price'] - player.current_price
        ) / player.current_price * 100
        
        insights.append({
            "player": player.name,
            "current_price": player.current_price,
            "predicted_price": predictions['next_day_price'],
            "potential_return": potential_return,
            "sentiment_score": predictions['sentiment_analysis']['sentiment_score'],
            "next_game_prediction": predictions['next_game_prediction']
        })
    
    # Sort by potential return
    insights.sort(key=lambda x: x['potential_return'], reverse=True)
    
    return {
        "top_opportunities": insights[:5],
        "market_sentiment": sum(i['sentiment_score'] for i in insights) / len(insights)
    }

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down BallStreet API")