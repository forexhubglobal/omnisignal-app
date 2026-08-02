import { Activity, TrendingUp, DollarSign, Gauge } from 'lucide-react';
import { AdvancedRealTimeChart, ForexCrossRates } from "react-ts-tradingview-widgets";
import { useState, useEffect } from 'react';

export default function Home() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/signals')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setSignals(data);
      })
      .catch(err => console.error(err));
  }, []);

  // Calculate dynamic stats based on DB
  const activeSignals = signals.filter(s => s.status === 'live' || s.status === 'standby').length;
  const wonSignals = signals.filter(s => s.status === 'won').length;
  const totalCompleted = signals.filter(s => s.status === 'won' || s.status === 'loss').length;
  
  const winRate = totalCompleted > 0 ? ((wonSignals / totalCompleted) * 100).toFixed(1) + '%' : '100%';
  const pipsGained = signals.length > 0 ? '+' + (signals.length * 15) + ' pips' : '+0 pips'; // Mock calculation for now

  const stats = [
    { label: 'Win Rate (Overall)', value: winRate, icon: <Activity className="text-omni-neon" />, trend: 'Live Data' },
    { label: 'Total Pips Captured', value: pipsGained, icon: <TrendingUp className="text-omni-gold" />, trend: 'Estimates' },
    { label: 'Active Signals', value: activeSignals.toString(), icon: <DollarSign className="text-green-400" />, trend: 'System' },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, <span className="gold-gradient">Trader</span></h1>
        <p className="text-gray-400">Here's your market overview for today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,243,255,0.15)] transition-all duration-300 group cursor-pointer border-t border-t-white/10 hover:border-t-omni-neon">
            <div className="flex justify-between items-center relative">
              <div className="p-3 bg-black/40 rounded-lg border border-white/10 group-hover:border-omni-neon transition-colors shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-omni-neon/20 animate-pulse-fast opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">{stat.icon}</div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-omni-neon shadow-[0_0_10px_rgba(0,243,255,0.1)]">
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs tracking-widest uppercase">{stat.label}</p>
              <p className="text-3xl font-mono font-bold text-white mt-1 neon-text">{stat.value}</p>
            </div>
          </div>
        ))}
        
        {/* Fear & Greed Radar */}
        <div className="glass-panel p-6 flex flex-col gap-2 hover:-translate-y-1 transition-all duration-300 border-t-2 border-t-red-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <Gauge className="text-red-500" size={20} />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Market Sentiment</h3>
          </div>
          
          <div className="flex justify-between items-end relative z-10">
            <p className="text-2xl font-black text-red-500 tracking-wider">24 <span className="text-sm font-medium text-red-400 uppercase">Fear</span></p>
          </div>
          
          <div className="mt-2 w-full h-3 bg-black/50 rounded-full overflow-hidden relative z-10 border border-white/10 flex">
            {/* Color Gradient Bar */}
            <div className="h-full w-1/4 bg-red-500"></div>
            <div className="h-full w-1/4 bg-orange-500"></div>
            <div className="h-full w-1/4 bg-yellow-500"></div>
            <div className="h-full w-1/4 bg-green-500"></div>
            
            {/* Pointer (Mocked at 24%) */}
            <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-20" style={{ left: '24%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6 border-t-2 border-t-omni-neon relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-omni-neon/10 rounded-bl-full blur-[30px]"></div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-omni-neon animate-pulse-fast shadow-[0_0_10px_#00f3ff]"></span>
            Omni AI Market Terminal
          </h2>
          <div className="h-[500px] w-full border border-omni-neon/20 bg-black/40 rounded-xl relative overflow-hidden shadow-inner">
            <AdvancedRealTimeChart 
              theme="dark" 
              autosize 
              symbol="OANDA:XAUUSD" 
              interval="15" 
              timezone="Asia/Singapore" 
              style="1" 
              locale="en" 
              enable_publishing={false} 
              backgroundColor="rgba(10, 8, 15, 1)"
              gridColor="rgba(0, 243, 255, 0.05)"
              hide_side_toolbar={false}
            />
          </div>
        </div>

        {/* Forex Heatmap */}
        <div className="lg:col-span-1 glass-panel p-6 border-t-2 border-t-omni-gold relative overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4">Currency Heatmap</h2>
          <div className="flex-1 w-full rounded-xl overflow-hidden bg-black/40">
            <ForexCrossRates colorTheme="dark" width="100%" height="100%" isTransparent={true} locale="en" currencies={["EUR","USD","JPY","GBP","CHF","AUD","CAD"]} />
          </div>
        </div>

      </div>
    </div>
  );
}
