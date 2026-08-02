import { useState } from 'react';
import { EconomicCalendar, TechnicalAnalysis } from "react-ts-tradingview-widgets";

export default function AITools() {
  const [balance, setBalance] = useState('1000');
  const [risk, setRisk] = useState('1');
  const [stopLoss, setStopLoss] = useState('20');
  
  const calculateLotSize = () => {
    const riskAmount = (parseFloat(balance) * parseFloat(risk)) / 100;
    // Standard formula: (Risk Amount) / (Stop Loss Pips * Pip Value)
    // Assuming standard $10 pip value for simplicity
    const lotSize = riskAmount / (parseFloat(stopLoss) * 10);
    return isNaN(lotSize) || !isFinite(lotSize) ? '0.00' : lotSize.toFixed(2);
  };

  const [high, setHigh] = useState('');
  const [low, setLow] = useState('');
  const [trend, setTrend] = useState('up');

  const calcFibo = () => {
    const h = parseFloat(high);
    const l = parseFloat(low);
    if (isNaN(h) || isNaN(l)) return null;
    const diff = h - l;
    
    if (trend === 'up') {
      return {
        entry: h - (diff * 0.618), // 61.8% retracement
        sl: l - (diff * 0.1),      // Just below 100%
        tp1: h + (diff * 0.272),   // -27.2% extension
        tp2: h + (diff * 0.618),   // -61.8% extension
      };
    } else {
      return {
        entry: l + (diff * 0.618),
        sl: h + (diff * 0.1),
        tp1: l - (diff * 0.272),
        tp2: l - (diff * 0.618),
      };
    }
  };
  const fiboLevels = calcFibo();

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2"><span className="gold-gradient">AI</span> Tools</h1>
        <p className="text-gray-400">Advanced analytical tools powered by Omni AI.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Position Size Calculator</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Account Balance ($)</label>
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-omni-neon focus:ring-1 focus:ring-omni-neon transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Risk Percentage (%)</label>
              <input type="number" value={risk} onChange={e => setRisk(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-omni-neon focus:ring-1 focus:ring-omni-neon transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Stop Loss (Pips)</label>
              <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-omni-neon focus:ring-1 focus:ring-omni-neon transition-all" />
            </div>
            
            <div className="mt-6 p-4 bg-omni-neon/10 border border-omni-neon/30 rounded-lg text-center">
              <p className="text-xs text-omni-neon uppercase tracking-widest mb-1">Recommended Lot Size</p>
              <p className="text-3xl font-mono font-bold text-white neon-text">{calculateLotSize()}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Fibonacci Entry Planner (Golden Zone)</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => setTrend('up')} 
                className={`flex-1 py-2 rounded font-bold text-xs ${trend === 'up' ? 'bg-omni-green text-black' : 'bg-white/10 text-gray-400'}`}
              >
                UPTREND
              </button>
              <button 
                onClick={() => setTrend('down')} 
                className={`flex-1 py-2 rounded font-bold text-xs ${trend === 'down' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}
              >
                DOWNTREND
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Swing High Price</label>
                <input type="number" value={high} onChange={e => setHigh(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-omni-gold focus:ring-1 focus:ring-omni-gold transition-all" placeholder="e.g. 2350.50" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Swing Low Price</label>
                <input type="number" value={low} onChange={e => setLow(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-omni-gold focus:ring-1 focus:ring-omni-gold transition-all" placeholder="e.g. 2300.00" />
              </div>
            </div>
            
            {fiboLevels && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-omni-gold/10 border border-omni-gold/30 rounded-lg text-center">
                  <p className="text-[10px] text-omni-gold uppercase tracking-widest mb-1">Golden Entry (61.8%)</p>
                  <p className="text-xl font-mono font-bold text-white">{fiboLevels.entry.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                  <p className="text-[10px] text-red-500 uppercase tracking-widest mb-1">Stop Loss</p>
                  <p className="text-xl font-mono font-bold text-white">{fiboLevels.sl.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-omni-green/10 border border-omni-green/30 rounded-lg text-center">
                  <p className="text-[10px] text-omni-green uppercase tracking-widest mb-1">TP 1 (-27.2%)</p>
                  <p className="text-xl font-mono font-bold text-white">{fiboLevels.tp1.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-omni-green/10 border border-omni-green/30 rounded-lg text-center">
                  <p className="text-[10px] text-omni-green uppercase tracking-widest mb-1">TP 2 (-61.8%)</p>
                  <p className="text-xl font-mono font-bold text-white">{fiboLevels.tp2.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="glass-panel p-6 md:col-span-2 border-t-2 border-t-omni-neon relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-omni-neon/10 rounded-bl-full blur-[30px]"></div>
          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Omni AI Multi-Indicator Screener</h3>
          <div className="h-[400px] w-full border border-white/10 rounded-xl relative overflow-hidden bg-black/40">
            <TechnicalAnalysis colorTheme="dark" width="100%" height="100%" isTransparent={true} symbol="OANDA:XAUUSD" interval="15m" showIntervalTabs={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
