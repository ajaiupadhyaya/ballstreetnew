import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

export default function AIInsights() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/market/ai-insights');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">AI Trading Insights</h3>
        <p className="mt-1 text-sm text-gray-500">
          Machine learning predictions and market sentiment analysis
        </p>
      </div>

      {/* Market Sentiment */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">Market Sentiment</h4>
        <div className="flex items-center">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{
                  width: `${((insights.market_sentiment + 1) / 2) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="ml-4 text-sm text-gray-500">
            {insights.market_sentiment > 0 ? 'Bullish' : 'Bearish'}
          </span>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">Top Opportunities</h4>
        <div className="space-y-4">
          {insights.top_opportunities.map((opportunity) => (
            <div
              key={opportunity.player}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{opportunity.player}</p>
                <p className="text-sm text-gray-500">
                  Current: ${opportunity.current_price.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  ${opportunity.predicted_price.toFixed(2)}
                </p>
                <p
                  className={`text-sm ${
                    opportunity.potential_return >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {opportunity.potential_return >= 0 ? '+' : ''}
                  {opportunity.potential_return.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">
          Performance Prediction Factors
        </h4>
        <div className="space-y-2">
          {Object.entries(insights.top_opportunities[0].feature_importance)
            .sort(([, a], [, b]) => b - a)
            .map(([feature, importance]) => (
              <div key={feature} className="flex items-center">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${importance * 100}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm text-gray-500">{feature}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 