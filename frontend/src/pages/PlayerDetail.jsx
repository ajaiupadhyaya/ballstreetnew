import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export default function PlayerDetail() {
  const { id } = useParams();
  const chartContainerRef = useRef(null);

  const { data: player, isLoading: playerLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/player/${id}`);
      return response.data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['player-stats', id],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/player/${id}/stats`);
      return response.data;
    },
  });

  useEffect(() => {
    if (stats && chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      const data = stats.stats.map((stat) => ({
        time: stat.GAME_DATE,
        open: stat.BallStreet_Price * 0.95,
        high: stat.BallStreet_Price * 1.05,
        low: stat.BallStreet_Price * 0.9,
        close: stat.BallStreet_Price,
      }));

      candlestickSeries.setData(data);
      chart.timeScale().fitContent();

      const handleResize = () => {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [stats]);

  if (playerLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{player.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {player.team} • {player.position}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Player Stats */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Performance Stats
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Points</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.stats[0]?.PTS || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rebounds</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.stats[0]?.REB || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assists</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.stats[0]?.AST || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Steals</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.stats[0]?.STL || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blocks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.stats[0]?.BLK || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Turnovers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.stats[0]?.TOV || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Price */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Current Price
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              ${player.current_price.toFixed(2)}
            </p>
            <p
              className={`text-sm ${
                player.price_change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {player.price_change >= 0 ? '+' : ''}
              {player.price_change.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Price History</h3>
        <div ref={chartContainerRef} className="h-[400px]" />
      </div>

      {/* Recent Games */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Games</h3>
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {stats?.stats.slice(0, 5).map((game, index) => (
                <li key={index} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {game.MATCHUP}
                      </p>
                      <p className="text-sm text-gray-500">{game.GAME_DATE}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {game.PTS} PTS • {game.REB} REB • {game.AST} AST
                      </p>
                      <p className="text-sm text-gray-500">
                        Performance Score: {game.PERF_SCORE.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 