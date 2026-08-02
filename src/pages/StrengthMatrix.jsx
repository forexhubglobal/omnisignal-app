import { useState, useEffect } from 'react';
import { Compass, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function StrengthMatrix() {
  const [currencies, setCurrencies] = useState([
    { name: 'USD', value: 85, color: '#00f3ff', flag: '🇺🇸' },
    { name: 'EUR', value: 45, color: '#3b82f6', flag: '🇪🇺' },
    { name: 'GBP', value: 72, color: '#8b5cf6', flag: '🇬🇧' },
    { name: 'JPY', value: 12, color: '#ef4444', flag: '🇯🇵' },
    { name: 'AUD', value: 60, color: '#f59e0b', flag: '🇦🇺' },
    { name: 'CAD', value: 55, color: '#10b981', flag: '🇨🇦' },
    { name: 'CHF', value: 30, color: '#64748b', flag: '🇨🇭' },
    { name: 'NZD', value: 68, color: '#ec4899', flag: '🇳🇿' }
  ]);

  useEffect(() => {
    // Simulate real-time data changes
    const interval = setInterval(() => {
      setCurrencies(prev => 
        [...prev]
          .map(c => ({
            ...c,
            // Randomly adjust value by -5 to +5, keeping between 0-100
            value: Math.max(0, Math.min(100, c.value + (Math.random() * 10 - 5)))
          }))
          .sort((a, b) => b.value - a.value)
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const strongest = currencies[0];
  const weakest = currencies[currencies.length - 1];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Compass className="text-omni-neon" size={32} />
            Strength <span className="gold-gradient">Matrix</span>
          </h1>
          <p className="text-gray-400">Real-time relative strength index of major global currencies.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-omni-green bg-omni-green/10 px-3 py-1.5 rounded border border-omni-green/30">
          <RefreshCw size={14} className="animate-spin" /> LIVE
        </div>
      </header>

      {/* AI Recommendation Panel */}
      <div className="glass-panel p-6 border-l-4 border-l-omni-gold relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 w-32 h-32 bg-omni-gold/10 rounded-bl-full blur-[30px]"></div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">AI Trade Suggestion</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl mb-2">{strongest.flag}</p>
              <p className="text-xl font-bold text-white">{strongest.name}</p>
              <p className="text-xs text-omni-green flex items-center justify-center gap-1"><TrendingUp size={12}/> STRONGEST</p>
            </div>
            <div className="text-2xl font-bold text-gray-600">VS</div>
            <div className="text-center">
              <p className="text-4xl mb-2">{weakest.flag}</p>
              <p className="text-xl font-bold text-white">{weakest.name}</p>
              <p className="text-xs text-red-500 flex items-center justify-center gap-1"><TrendingDown size={12}/> WEAKEST</p>
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <p className="text-gray-300 text-sm mb-2">Based on current fundamental momentum, the highest probability setup is:</p>
            <p className="text-2xl font-bold font-mono">
              <span className="text-omni-green">BUY</span> {strongest.name}/{weakest.name}
            </p>
            <button className="mt-4 px-6 py-2 bg-omni-gold text-black font-bold text-xs rounded hover:bg-yellow-400 transition-colors">
              VIEW CHART
            </button>
          </div>
        </div>
      </div>

      {/* Strength Bars */}
      <div className="glass-panel p-6">
        <div className="space-y-6">
          {currencies.map((currency) => (
            <div key={currency.name} className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white text-lg flex items-center gap-2">
                  <span>{currency.flag}</span> {currency.name}
                </span>
                <span className="font-mono font-bold" style={{ color: currency.color }}>
                  {currency.value.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full transition-all duration-1000 ease-in-out relative"
                  style={{ 
                    width: `${currency.value}%`, 
                    backgroundColor: currency.color,
                    boxShadow: `0 0 10px ${currency.color}`
                  }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
