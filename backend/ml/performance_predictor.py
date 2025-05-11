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
        
    def predict_performance(self, current_stats: Dict) -> float:
    """Predict next game performance with better error handling"""
    try:
        features = self.prepare_features(current_stats)
        
        # Check if model is trained properly
        if not hasattr(self.model, 'feature_importances_'):
            # Model not properly trained, return weighted sum of stats instead
            pts_weight = 1.0
            reb_weight = 1.2
            ast_weight = 1.5
            stl_weight = 2.0
            blk_weight = 2.0
            
            weighted_sum = (
                current_stats.get('PTS', 0) * pts_weight +
                current_stats.get('REB', 0) * reb_weight +
                current_stats.get('AST', 0) * ast_weight +
                current_stats.get('STL', 0) * stl_weight +
                current_stats.get('BLK', 0) * blk_weight
            )
            return weighted_sum
        
        # Model is trained, use it for prediction
        features = self.scaler.transform(features)
        return float(self.model.predict(features)[0])
    except Exception as e:
        print(f"Error predicting performance: {e}")
        # Return average of key stats as fallback
        return sum([
            current_stats.get('PTS', 0),
            current_stats.get('REB', 0) * 1.2,
            current_stats.get('AST', 0) * 1.5,
            current_stats.get('STL', 0) * 2.0,
            current_stats.get('BLK', 0) * 2.0
        ])
        
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