import { useState } from 'react';
import { Activity, Search, ShieldCheck } from 'lucide-react';
import { TechnicalAnalysis } from 'react-ts-tradingview-widgets';

export default function XRay() {
  const [searchInput, setSearchInput] = useState('XAUUSD');
  const [symbol, setSymbol] = useState('OANDA:XAUUSD');

  const handleSearch = (e) => {
    e.preventDefault();
    const formatted = searchInput.toUpperCase().trim();
    // Simple heuristic: if it doesn't have a colon, prepend FX_IDC: for generic forex or BINANCE: for crypto if it ends with USDT.
    let fullSymbol = formatted;
    if (!formatted.includes(':')) {
      if (formatted.endsWith('USDT') || formatted === 'BTCUSD') {
        fullSymbol = `BINANCE:${formatted}`;
      } else {
        fullSymbol = `OANDA:${formatted}`;
      }
    }
    setSymbol(fullSymbol);
  };

  const timeframes = [
    { label: '15 Minutes (Scalp)', interval: '15m' },
    { label: '1 Hour (Intraday)', interval: '1h' },
    { label: '4 Hours (Swing)', interval: '4h' },
    { label: 'Daily (Macro)', interval: '1D' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="text-omni-green" size={32} />
            Omni <span className="text-omni-green drop-shadow-[0_0_10px_#00ff64]">X-Ray</span> Scanner
          </h1>
          <p className="text-gray-400">Multi-Timeframe (MTF) Alignment Analysis based on live technical indicators.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex relative w-full md:w-auto">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="e.g. XAUUSD, BTCUSDT"
            className="bg-black/50 border border-white/10 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:border-omni-green w-full md:w-64"
          />
          <button type="submit" className="bg-omni-green text-black px-4 py-2 rounded-r-lg hover:bg-green-500 font-bold flex items-center gap-2">
            <Search size={18} /> SCAN
          </button>
        </form>
      </header>

      {/* Alignment Status Banner */}
      <div className="glass-panel p-4 border border-omni-green/50 bg-omni-green/10 flex items-center justify-center gap-3 animate-pulse shadow-[0_0_20px_rgba(0,255,100,0.2)]">
        <ShieldCheck className="text-omni-green" size={24} />
        <h2 className="text-white font-bold tracking-widest uppercase">
          Scanning LIVE Order Flow & Technicals for: <span className="text-omni-green">{symbol}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {timeframes.map((tf) => (
          <div key={tf.interval} className="glass-panel p-4 flex flex-col relative overflow-hidden group">
            {/* HUD Corner Decorations (Subtle Pulse) */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-omni-neon/50 animate-pulse"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-omni-neon/50 animate-pulse delay-75"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-omni-neon/50 animate-pulse delay-150"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-omni-neon/50 animate-pulse delay-300"></div>
            
            <h3 className="text-center font-bold text-omni-gold tracking-widest text-sm mb-4 border-b border-white/10 pb-2 z-10">
              {tf.label}
            </h3>
            
            {/* Container to crop TradingView Logo */}
            <div className="w-full relative -mx-2 overflow-hidden h-[400px]">
              <div className="h-[450px] w-full">
                <TechnicalAnalysis 
                  colorTheme="dark" 
                  width="100%" 
                  height="100%" 
                  symbol={symbol} 
                  interval={tf.interval}
                  isTransparent={true}
                  showIntervalTabs={false}
                />
              </div>
              
              {/* Scanline Overlay (Static CRT Effect) */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-20 z-10"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 glass-panel p-6 border-l-4 border-l-omni-neon relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-omni-neon/10 rounded-bl-full blur-[30px]"></div>
        <h3 className="text-omni-neon font-bold mb-2 uppercase tracking-widest text-sm">How to use X-Ray Alignment?</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          The Omni X-Ray pulls live technical data (Moving Averages, Oscillators, Pivot Points). 
          <strong> Perfect Alignment</strong> occurs when all 4 timeframes point to "Buy" or "Strong Buy". 
          This indicates a highly probable setup with institutional backing across all timeframes. 
          If the meters point in opposing directions (e.g., 15m Buy, 4H Sell), it indicates a choppy market—avoid trading.
        </p>
      </div>
    </div>
  );
}
