import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import AIInsights from '../components/AIInsights';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { data: marketData, isLoading: marketLoading, error: marketError } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      try {
        const response = await axios.get('http://localhost:8000/market/overview');
        return response.data;
      } catch (error) {
        console.error('Error fetching market data:', error);
        throw error;
      }
    },
    retry: 1
  });

  const { data: aiInsights, isLoading: aiLoading, error: aiError } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: async () => {
      try {
        const response = await axios.get('http://localhost:8000/market/ai-insights');
        return response.data;
      } catch (error) {
        console.error('Error fetching AI insights:', error);
        throw error;
      }
    },
    retry: 1
  });

  if (marketError || aiError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 text-lg">
          Error loading data. Please check if the backend server is running.
        </div>
        <div className="text-gray-600">
          Make sure you're running: uvicorn main:app --reload in the backend directory
        </div>
      </div>
    );
  }

  if (marketLoading || aiLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-gray-600">Loading market data...</div>
      </div>
    );
  }

  // If we have no data, show a message
  if (!marketData || !aiInsights) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-gray-600">No data available. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900">Total Market Cap</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${marketData?.total_market_cap?.toLocaleString() ?? '0'}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-900">24h Volume</h3>
            <p className="text-3xl font-bold text-green-600">
              ${marketData?.volume_24h?.toLocaleString() ?? '0'}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-900">Active Players</h3>
            <p className="text-3xl font-bold text-purple-600">
              {marketData?.active_players ?? '0'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Trading Insights</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Market Sentiment</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${((aiInsights?.market_sentiment ?? 0) + 1) * 50}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {(aiInsights?.market_sentiment ?? 0) > 0 ? 'Bullish' : 'Bearish'} Market
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Opportunities</h3>
            <div className="space-y-4">
              {aiInsights?.top_opportunities?.map((opportunity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{opportunity.player_name}</h4>
                    <p className="text-sm text-gray-600">Current: ${opportunity.current_price}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">Predicted: ${opportunity.predicted_price}</p>
                    <p className={`text-sm ${opportunity.potential_return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {opportunity.potential_return > 0 ? '+' : ''}{opportunity.potential_return}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 