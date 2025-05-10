import { useState } from "react"
import axios from "axios"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

export default function App() {
  const [playerName, setPlayerName] = useState("")
  const [prices, setPrices] = useState([])
  const [error, setError] = useState(null)

  const fetchPlayer = async () => {
    setError(null)
    setPrices([])

    try {
      const response = await axios.get(`http://127.0.0.1:8000/player/${playerName}`)
      if (response.data.error) {
        setError(response.data.error)
      } else {
        setPrices(response.data.prices.reverse()) // ensure time-order
      }
    } catch (err) {
      setError("Could not fetch data. Check the backend is running.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">🏀 BallStreet</h1>

      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <input
          type="text"
          placeholder="e.g. LeBron James"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
        />
        <button
          onClick={fetchPlayer}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
        >
          Fetch Player Stock
        </button>
      </div>

      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      {prices.length > 0 && (
        <div className="mt-10 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-center">📈 Price Chart</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={prices}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="GAME_DATE" hide />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="BallStreet_Price" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}