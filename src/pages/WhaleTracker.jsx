import { useState, useEffect } from 'react';
import { Radar, Waves, AlertTriangle, ArrowRightCircle } from 'lucide-react';

export default function WhaleTracker() {
  const [alerts, setAlerts] = useState([]);

  const generateWhaleAlert = () => {
    const assets = ['BTC', 'ETH', 'XAU/USD', 'EUR/USD', 'USDT'];
    const types = ['TRANSFER', 'BUY WALL', 'SELL WALL', 'LIQUIDATION'];
    const exchanges = ['Binance', 'Coinbase', 'Unknown Wallet', 'CME Group', 'FTX Estate'];
    
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
    const amount = (Math.random() * 500 + 50).toFixed(1); // 50M to 550M
    
    let colorClass = 'text-omni-neon';
    let bgClass = 'bg-omni-neon/10 border-omni-neon/30';
    if (type.includes('BUY')) { colorClass = 'text-omni-green'; bgClass = 'bg-omni-green/10 border-omni-green/30'; }
    if (type.includes('SELL') || type === 'LIQUIDATION') { colorClass = 'text-red-500'; bgClass = 'bg-red-500/10 border-red-500/30'; }

    return {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      asset,
      type,
      exchange,
      amount: `$${amount}M`,
      colorClass,
      bgClass
    };
  };

  useEffect(() => {
    // Initial load
    setAlerts(Array.from({ length: 5 }).map(() => generateWhaleAlert()));

    const interval = setInterval(() => {
      setAlerts(prev => {
        const newAlerts = [generateWhaleAlert(), ...prev];
        if (newAlerts.length > 15) newAlerts.pop();
        return newAlerts;
      });
    }, 4500); // New alert every 4.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Waves className="text-omni-neon" size={32} />
          Whale Activity <span className="gold-gradient">Radar</span>
        </h1>
        <p className="text-gray-400">Track institutional block orders and dark pool liquidity in real-time.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar Visual */}
        <div className="glass-panel p-6 border-t-2 border-t-omni-neon flex flex-col items-center justify-center relative overflow-hidden bg-black/50">
          <h2 className="absolute top-4 left-4 text-xs font-bold text-gray-500 flex items-center gap-2">
            <Radar size={16} className="text-omni-neon animate-spin-slow" /> SCANNING BLOCKS
          </h2>
          
          <div className="relative w-64 h-64 rounded-full border border-omni-neon/20 flex items-center justify-center overflow-hidden">
            {/* Radar Sweep */}
            <div className="absolute w-full h-full rounded-full radar-sweep"></div>
            {/* Grid Rings */}
            <div className="absolute w-48 h-48 rounded-full border border-omni-neon/10"></div>
            <div className="absolute w-32 h-32 rounded-full border border-omni-neon/10"></div>
            <div className="absolute w-16 h-16 rounded-full border border-omni-neon/10"></div>
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-omni-neon/20"></div>
            <div className="absolute h-full w-[1px] bg-omni-neon/20"></div>
            
            {/* Blips (Static mock) */}
            <div className="absolute w-3 h-3 bg-red-500 rounded-full blur-[2px] top-10 left-20 animate-pulse"></div>
            <div className="absolute w-4 h-4 bg-omni-green rounded-full blur-[2px] bottom-16 right-16 animate-pulse delay-300"></div>
            <div className="absolute w-2 h-2 bg-omni-neon rounded-full blur-[1px] top-32 left-10 animate-pulse delay-500"></div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-3xl font-bold text-white tracking-widest font-mono">1.24B</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Total Vol (24H)</p>
          </div>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-2 glass-panel p-4 border border-white/10 bg-black/60 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-omni-gold animate-pulse" size={16} /> LIVE ALERTS
            </h3>
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold animate-pulse">REC</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border ${alert.bgClass} flex items-center justify-between animate-[slideIn_0.5s_ease-out]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded bg-black/50 ${alert.colorClass}`}>
                    <ArrowRightCircle size={20} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${alert.colorClass}`}>{alert.type}</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {alert.asset} <span className="text-gray-500 mx-1">via</span> {alert.exchange}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono text-white">{alert.amount}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .radar-sweep {
          background: conic-gradient(from 0deg, transparent 70%, rgba(0, 243, 255, 0.4) 100%);
          animation: radar-spin 4s linear infinite;
          border-radius: 50%;
        }
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
