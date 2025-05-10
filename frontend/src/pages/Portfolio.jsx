import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

export default function Portfolio() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/portfolio/1'); // TODO: Replace with actual user ID
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

  // Calculate portfolio value
  const totalValue = portfolio?.reduce(
    (sum, holding) => sum + holding.shares * holding.player.current_price,
    0
  ) || 0;

  // Calculate portfolio performance
  const performance = portfolio?.reduce(
    (sum, holding) => {
      const costBasis = holding.shares * holding.average_buy_price;
      const currentValue = holding.shares * holding.player.current_price;
      return sum + (currentValue - costBasis);
    },
    0
  ) || 0;

  const performancePercentage = (performance / totalValue) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Portfolio</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your investments and performance
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${totalValue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Performance</h3>
          <p
            className={`mt-2 text-3xl font-semibold ${
              performance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {performance >= 0 ? '+' : ''}${performance.toFixed(2)}
          </p>
          <p
            className={`text-sm ${
              performance >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {performance >= 0 ? '+' : ''}
            {performancePercentage.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Holdings</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {portfolio?.length || 0}
          </p>
          <p className="text-sm text-gray-500">Active positions</p>
        </div>
      </div>

      {/* Holdings List */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Holdings</h3>
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {portfolio?.map((holding) => (
                <li key={holding.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {holding.player.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {holding.shares} shares @ ${holding.average_buy_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${(holding.shares * holding.player.current_price).toFixed(2)}
                      </p>
                      <p
                        className={`text-sm ${
                          holding.player.current_price >= holding.average_buy_price
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {holding.player.current_price >= holding.average_buy_price
                          ? '+'
                          : ''}
                        {(
                          ((holding.player.current_price - holding.average_buy_price) /
                            holding.average_buy_price) *
                          100
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Portfolio Performance
        </h3>
        <div className="h-80">
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                {
                  label: 'Portfolio Value',
                  data: [10000, 10500, 10200, 10800, 11200, 11500],
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