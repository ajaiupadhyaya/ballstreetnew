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
  const { data: trendingPlayers, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/market/trending');
      return response.data;
    },
  });

  const { data: volatilePlayers, isLoading: volatileLoading } = useQuery({
    queryKey: ['volatile'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/market/volatile');
      return response.data;
    },
  });

  if (trendingLoading || volatileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Market Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track the performance of NBA players in real-time
        </p>
      </div>

      {/* AI Insights */}
      <AIInsights />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trending Players */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Trending Players</h3>
          <div className="space-y-4">
            {trendingPlayers?.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{player.name}</p>
                  <p className="text-sm text-gray-500">{player.team}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    ${player.current_price.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-500">
                    +{((player.price_history[-1] - player.price_history[-2]) / player.price_history[-2] * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volatile Players */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">High Volatility</h3>
          <div className="space-y-4">
            {volatilePlayers?.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{player.name}</p>
                  <p className="text-sm text-gray-500">{player.team}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${player.current_price.toFixed(2)}
                  </p>
                  <p className="text-sm text-orange-500">
                    Vol: {player.volatility.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Index Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Market Index</h3>
        <div className="h-80">
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                {
                  label: 'BallStreet Index',
                  data: [100, 120, 115, 134, 168, 132],
                  borderColor: 'rgb(59, 130, 246)',
                  tension: 0.1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
              },
              scales: {
                y: {
                  beginAtZero: false,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 