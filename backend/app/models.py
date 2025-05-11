from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    balance = Column(Float, default=10000.0)  # Starting balance
    created_at = Column(DateTime, default=datetime.utcnow)
    
    portfolio = relationship("Portfolio", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    nba_id = Column(Integer, unique=True, index=True)
    name = Column(String, index=True)
    team = Column(String)
    position = Column(String)
    current_price = Column(Float)
    price_history = Column(JSON)  # Store historical prices
    performance_metrics = Column(JSON)  # Store calculated metrics
    twitter_sentiment = Column(Float)  # Average sentiment score
    injury_status = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    portfolio_entries = relationship("Portfolio", back_populates="player")
    transactions = relationship("Transaction", back_populates="player")

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    shares = Column(Float)
    average_buy_price = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="portfolio")
    player = relationship("Player", back_populates="portfolio_entries")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    transaction_type = Column(String)  # "BUY" or "SELL"
    shares = Column(Float)
    price_per_share = Column(Float)
    total_amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="transactions")
    player = relationship("Player", back_populates="transactions")
