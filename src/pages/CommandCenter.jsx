import { MonitorPlay, Maximize2 } from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

export default function CommandCenter() {
  const charts = [
    { symbol: "OANDA:XAUUSD", name: "Gold (XAU/USD)" },
    { symbol: "FX:EURUSD", name: "Euro (EUR/USD)" },
    { symbol: "FX:GBPJPY", name: "Pound Yen (GBP/JPY)" },
    { symbol: "BINANCE:BTCUSD", name: "Bitcoin (BTC/USD)" }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -mx-4 md:-mx-8 px-4 md:px-8">
      <header className="mb-4 flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <MonitorPlay className="text-omni-neon" size={24} />
            Command <span className="gold-gradient">Center</span>
          </h1>
          <p className="text-xs text-gray-400">Pro-Level Multi-Monitor Grid Layout.</p>
        </div>
        <button className="flex items-center gap-2 text-xs font-bold text-omni-neon bg-omni-neon/10 border border-omni-neon/30 px-3 py-1.5 rounded hover:bg-omni-neon/20 transition-colors">
          <Maximize2 size={14} /> FULLSCREEN
        </button>
      </header>

      {/* 2x2 Grid for Charts */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4 h-full">
        {charts.map((chart, i) => (
          <div key={i} className="glass-panel p-2 flex flex-col h-full border-t border-t-omni-neon/50 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-omni-neon/5 rounded-bl-full blur-[30px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-2 px-2 z-10">
              <span className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-omni-green animate-pulse"></span>
                {chart.name}
              </span>
            </div>
            
            <div className="flex-1 rounded border border-white/5 bg-black/60 overflow-hidden relative z-10">
              <AdvancedRealTimeChart 
                theme="dark" 
                autosize 
                symbol={chart.symbol}
                interval="15" 
                timezone="Asia/Singapore" 
                style="1" 
                locale="en" 
                enable_publishing={false} 
                backgroundColor="rgba(10, 8, 15, 1)"
                gridColor="rgba(0, 243, 255, 0.05)"
                hide_top_toolbar={true}
                hide_side_toolbar={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
