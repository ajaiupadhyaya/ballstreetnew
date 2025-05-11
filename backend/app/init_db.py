from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from nba_api.stats.static import players
import json
from datetime import datetime, timedelta
import random

# Create all tables
models.Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    
    try:
        # Create sample user
        user = models.User(
            email="test@example.com",
            username="testuser",
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiG",  # password: testpass
            balance=10000.0
        )
        db.add(user)
        db.commit()
        
        # Get NBA players
        nba_players = players.get_active_players()
        
        # Add some sample players
        for player in nba_players[:50]:  # Add first 50 active players
            # Generate random price history
            base_price = random.uniform(50, 200)
            price_history = [
                base_price + random.uniform(-10, 10)
                for _ in range(30)  # 30 days of history
            ]
            
            # Generate random performance metrics
            performance_metrics = {
                "points_per_game": random.uniform(5, 30),
                "rebounds_per_game": random.uniform(2, 15),
                "assists_per_game": random.uniform(1, 10),
                "steals_per_game": random.uniform(0, 2),
                "blocks_per_game": random.uniform(0, 3)
            }
            
            player_model = models.Player(
                nba_id=player['id'],
                name=player['full_name'],
                team=player['team_id'],
                position=player['position'],
                current_price=price_history[-1],
                price_history=price_history,
                performance_metrics=performance_metrics,
                twitter_sentiment=random.uniform(-1, 1),
                injury_status="Active"
            )
            db.add(player_model)
        
        db.commit()
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 