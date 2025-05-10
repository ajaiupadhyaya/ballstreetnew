import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { createChart } from 'lightweight-charts';
import { toast } from 'react-toastify';

export default function Market() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('BUY');

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/players');
      return response.data;
    },
  });

  const handleTrade = async () => {
    if (!selectedPlayer || !tradeAmount) return;

    try {
      await axios.post('http://localhost:8000/trade', {
        player_id: selectedPlayer.id,
        transaction_type: tradeType,
        shares: parseFloat(tradeAmount),
      });

      toast.success('Trade executed successfully!');
      setTradeAmount('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to execute trade');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Player Market</h2>
        <p className="mt-1 text-sm text-gray-500">
          Buy and sell shares of NBA players
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Player List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {players?.map((player) => (
                    <li
                      key={player.id}
                      className="py-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {player.name}
                          </p>
                          <p className="text-sm text-gray-500">{player.team}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${player.current_price.toFixed(2)}
                          </p>
                          <p
                            className={`text-sm ${
                              player.price_change >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {player.price_change >= 0 ? '+' : ''}
                            {player.price_change.toFixed(2)}%
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

        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedPlayer ? `Trade ${selectedPlayer.name}` : 'Select a Player'}
            </h3>

            {selectedPlayer && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Price
                  </label>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    ${selectedPlayer.current_price.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Transaction Type
                  </label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <button
                  onClick={handleTrade}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Execute Trade
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 