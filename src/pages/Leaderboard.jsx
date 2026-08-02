import { Trophy, Medal, Star, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/leaderboard`);
        const data = await res.json();
        setLeaders(data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="mb-8 text-center flex flex-col items-center">
        <Trophy size={48} className="text-omni-gold mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold text-white mb-2">Global <span className="gold-gradient">Leaderboard</span></h1>
        <p className="text-gray-400">See how you stack up against the best traders in the Omni AI community.</p>
      </header>

      <div className="glass-panel p-0 overflow-hidden border-t-2 border-t-omni-gold relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-omni-gold/10 rounded-bl-full blur-[50px] pointer-events-none"></div>
        
        <table className="w-full text-left border-collapse relative z-10">
          <thead>
            <tr className="bg-black/60 border-b border-white/10 text-gray-400 text-xs uppercase tracking-widest">
              <th className="p-4 text-center">Rank</th>
              <th className="p-4">Trader</th>
              <th className="p-4">Tier</th>
              <th className="p-4 text-right">Win Rate</th>
              <th className="p-4 text-right">Total Pips (Monthly)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">Loading Leaderboard...</td>
              </tr>
            ) : leaders.map((trader) => (
              <tr key={trader.rank} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${trader.name.includes('(You)') ? 'bg-omni-neon/10 border-l-4 border-l-omni-neon' : ''}`}>
                <td className="p-4 text-center">
                  {trader.rank === 1 && <Medal className="mx-auto text-omni-gold" size={24} />}
                  {trader.rank === 2 && <Medal className="mx-auto text-gray-300" size={24} />}
                  {trader.rank === 3 && <Medal className="mx-auto text-amber-600" size={24} />}
                  {trader.rank > 3 && <span className="font-bold text-gray-500">{trader.rank}</span>}
                </td>
                <td className={`p-4 font-bold ${trader.rank === 1 ? 'text-omni-gold' : 'text-white'} flex items-center gap-2`}>
                  {trader.name}
                  {trader.rank === 1 && <Star size={14} className="text-omni-gold fill-omni-gold" />}
                </td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                    trader.isPro ? 'bg-omni-gold/10 border-omni-gold/30 text-omni-gold' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    {trader.isPro ? 'OMNI PRO' : 'BASIC'}
                  </span>
                </td>
                <td className="p-4 text-right font-mono font-bold text-white">
                  {trader.winRate}
                </td>
                <td className="p-4 text-right font-mono font-bold text-omni-green flex justify-end items-center gap-1">
                  {trader.profit}
                  <ArrowUpRight size={14} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
