import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
import pandas as pd

class PricePredictor:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        
    def prepare_data(self, data, lookback=7):
        """Prepare data for LSTM model"""
        scaled_data = self.scaler.fit_transform(data.reshape(-1, 1))
        X, y = [], []
        
        for i in range(lookback, len(scaled_data)):
            X.append(scaled_data[i-lookback:i, 0])
            y.append(scaled_data[i, 0])
            
        return np.array(X), np.array(y)
    
    def build_model(self, lookback=7):
        """Build LSTM model"""
        self.model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(lookback, 1)),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(1)
        ])
        
        self.model.compile(optimizer='adam', loss='mse')
        
    def train(self, price_history, epochs=50, batch_size=32):
    """Train the model on historical price data"""
    if len(price_history) < 8:  # Need at least 8 points for training with lookback=7
        print("Not enough price history for training. Using simple model.")
        return False
    
    try:
        X, y = self.prepare_data(price_history)
        X = X.reshape((X.shape[0], X.shape[1], 1))
        
        if not self.model:
            self.build_model()
            
        self.model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0)
        return True
    except Exception as e:
        print(f"Error training price model: {e}")
        return False
        
def predict_next_day(self, recent_prices):
    """Predict next day's price with error handling"""
    if not self.model:
        # Fallback to simple moving average
        return np.mean(recent_prices)
        
    try:
        if len(recent_prices) < 7:
            # Not enough data, use simple moving average
            return np.mean(recent_prices)
            
        scaled_data = self.scaler.transform(recent_prices.reshape(-1, 1))
        X = scaled_data[-7:].reshape(1, 7, 1)
        prediction = self.model.predict(X)
        return float(self.scaler.inverse_transform(prediction)[0][0])
    except Exception as e:
        print(f"Error predicting price: {e}")
        # Fallback to last price with small random change
        last_price = recent_prices[-1]
        return last_price * (1 + np.random.uniform(-0.05, 0.05))