from transformers import pipeline
import tweepy
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()

class SentimentAnalyzer:
    def __init__(self):
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="finiteautomata/bertweet-base-sentiment-analysis"
        )
        
        # Initialize Twitter API
        auth = tweepy.OAuthHandler(
            os.getenv("TWITTER_API_KEY"),
            os.getenv("TWITTER_API_SECRET")
        )
        auth.set_access_token(
            os.getenv("TWITTER_ACCESS_TOKEN"),
            os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        )
        self.twitter_api = tweepy.API(auth)
        
    def get_tweets(self, player_name: str, count: int = 100) -> List[str]:
        """Fetch recent tweets about a player"""
        try:
            tweets = self.twitter_api.search_tweets(
                q=player_name,
                lang="en",
                count=count,
                tweet_mode="extended"
            )
            return [tweet.full_text for tweet in tweets]
        except Exception as e:
            print(f"Error fetching tweets: {e}")
            return []
            
    def analyze_sentiment(self, texts: List[str]) -> Dict:
        """Analyze sentiment of texts"""
        if not texts:
            return {"positive": 0, "negative": 0, "neutral": 0}
            
        results = self.sentiment_analyzer(texts)
        
        # Aggregate results
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        for result in results:
            label = result["label"].lower()
            sentiment_counts[label] += 1
            
        # Calculate percentages
        total = len(results)
        return {
            "positive": sentiment_counts["positive"] / total,
            "negative": sentiment_counts["negative"] / total,
            "neutral": sentiment_counts["neutral"] / total
        }
        
    def get_player_sentiment(self, player_name: str) -> Dict:
        """Get sentiment analysis for a player"""
        tweets = self.get_tweets(player_name)
        sentiment = self.analyze_sentiment(tweets)
        
        # Calculate sentiment score (-1 to 1)
        sentiment_score = (
            sentiment["positive"] - sentiment["negative"]
        ) / (sentiment["positive"] + sentiment["negative"] + sentiment["neutral"])
        
        return {
            "sentiment_distribution": sentiment,
            "sentiment_score": sentiment_score
        } 