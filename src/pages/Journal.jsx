import { useState, useEffect } from 'react';
import { Download, TrendingUp, CheckCircle, XCircle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Journal() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/signals')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setSignals(data);
      })
      .catch(err => console.error(err));
  }, []);

  // Filter only completed signals (won/loss) or just show all for demo
  const history = signals.filter(s => s.status === 'won' || s.status === 'loss' || s.status === 'live'); // Include live for MVP if won/loss is empty

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trading <span className="gold-gradient">Journal</span></h1>
          <p className="text-gray-400">Review your past performance and equity growth.</p>
        </div>
        <button className="cyber-button flex items-center gap-2 py-2 px-4 text-xs">
          <Download size={14} /> EXPORT PDF
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consistency Heatmap */}
        <div className="lg:col-span-3 glass-panel p-6 border-t-2 border-t-omni-green relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-omni-green/10 rounded-bl-full blur-[50px]"></div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-omni-green" />
            Trading Consistency Heatmap (Last 90 Days)
          </h2>
          <div className="flex flex-wrap gap-1 mb-2">
            {Array.from({ length: 90 }).map((_, i) => {
              // Mock data: 60% green, 20% red, 20% gray
              const rand = Math.random();
              let colorClass = 'bg-white/10'; // gray (no trade)
              if (rand > 0.4 && rand <= 0.8) colorClass = 'bg-omni-green/60'; // win
              if (rand > 0.8) colorClass = 'bg-omni-green shadow-[0_0_5px_rgba(0,255,100,0.8)]'; // big win
              if (rand < 0.2) colorClass = 'bg-red-500/80'; // loss
              
              return (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-sm ${colorClass} hover:scale-125 transition-transform cursor-pointer tooltip-trigger`}
                  title={`Day ${90 - i} ago`}
                ></div>
              );
            })}
          </div>
          <div className="flex gap-4 text-[10px] text-gray-500 uppercase tracking-widest mt-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-white/10"></div> No Trade</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500/80"></div> Loss</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-omni-green/60"></div> Win</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-omni-green"></div> Big Win</span>
          </div>
        </div>
        {/* Equity Curve Line Chart */}
        <div className="lg:col-span-3 glass-panel p-6 border-t-2 border-t-omni-neon relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-omni-neon/10 rounded-bl-full blur-[50px]"></div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-omni-neon" />
            Cumulative Profit (Equity Curve)
          </h2>
          <div className="h-64 p-4 relative bg-black/40 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { name: 'Jan', profit: 0 },
                  { name: 'Feb', profit: 450 },
                  { name: 'Mar', profit: 320 },
                  { name: 'Apr', profit: 890 },
                  { name: 'May', profit: 1200 },
                  { name: 'Jun', profit: 1050 },
                  { name: 'Jul', profit: 1800 },
                ]}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', borderColor: '#00f3ff50', borderRadius: '8px' }}
                  itemStyle={{ color: '#00f3ff' }}
                  formatter={(value) => [`$${value}`, 'Profit']}
                />
                <Line type="monotone" dataKey="profit" stroke="#00f3ff" strokeWidth={3} dot={{ r: 4, fill: '#000000', stroke: '#00f3ff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#00f3ff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade History Table */}
        <div className="lg:col-span-3 glass-panel p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-white/10 text-gray-400 text-xs uppercase tracking-widest">
                <th className="p-4">Pair</th>
                <th className="p-4">Type</th>
                <th className="p-4">Entry</th>
                <th className="p-4">Pips Gained</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No trading history available yet.</td>
                </tr>
              ) : (
                history.map((trade, i) => (
                  <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{trade.pair}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase inline-block ${
                        trade.type.includes('BUY') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-300">{trade.price}</td>
                    <td className="p-4 font-mono font-bold text-omni-neon">+{Math.floor(Math.random() * 50) + 10}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs">
                        {trade.status === 'live' ? <TrendingUp size={14} className="text-omni-neon animate-pulse" /> : <CheckCircle size={14} className="text-omni-green" />}
                        <span className={trade.status === 'live' ? 'text-omni-neon' : 'text-omni-green'}>
                          {trade.status === 'live' ? 'RUNNING' : 'WON'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
