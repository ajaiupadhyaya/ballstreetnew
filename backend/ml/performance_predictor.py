import xgboost as xgb
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Dict, List

class PerformancePredictor:
    def __init__(self):
        self.model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5
        )
        self.scaler = StandardScaler()
        
    def prepare_features(self, stats: Dict) -> np.ndarray:
        """Prepare features for the model"""
        features = [
            stats.get('PTS', 0),
            stats.get('REB', 0),
            stats.get('AST', 0),
            stats.get('STL', 0),
            stats.get('BLK', 0),
            stats.get('TOV', 0),
            stats.get('FG_PCT', 0),
            stats.get('FG3_PCT', 0),
            stats.get('FT_PCT', 0),
            stats.get('MIN', 0),
            stats.get('PLUS_MINUS', 0)
        ]
        return np.array(features).reshape(1, -1)
        
    def train(self, historical_data: List[Dict]):
        """Train the model on historical performance data"""
        X = []
        y = []
        
        for game in historical_data:
            features = self.prepare_features(game)
            X.append(features[0])
            y.append(game['PERF_SCORE'])
            
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X, y)
        
    def predict_performance(self, current_stats: Dict) -> float:
        """Predict next game performance"""
        features = self.prepare_features(current_stats)
        features = self.scaler.transform(features)
        return float(self.model.predict(features)[0])
        
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        feature_names = [
            'Points', 'Rebounds', 'Assists', 'Steals', 'Blocks',
            'Turnovers', 'FG%', '3P%', 'FT%', 'Minutes', 'Plus/Minus'
        ]
        importance = self.model.feature_importances_
        return dict(zip(feature_names, importance)) 