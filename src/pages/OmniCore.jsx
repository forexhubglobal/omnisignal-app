import { useState, useEffect } from 'react';
import { Cpu, Terminal, ShieldAlert, Zap, Network, Lock, Wifi } from 'lucide-react';

export default function OmniCore() {
  const [logs, setLogs] = useState([]);
  
  const fakeLogs = [
    "[KERNEL] Initializing Quantum Core Processors...",
    "[NETWORK] Intercepting Institutional Order Blocks on XAUUSD...",
    "[AI_ENGINE] Neural Net Pattern Recognition: Bullish Divergence.",
    "[SECURITY] Bypassing Retail Liquidity Traps (Zone: 2320.50).",
    "[DATA] Syncing with Chicago Mercantile Exchange (CME) Feed...",
    "[ANALYSIS] High-Frequency Algorithmic Spikes Detected.",
    "[DECISION] Filtering Fake-out. Waiting for structural confirmation.",
    "[KERNEL] Allocating 400 Teraflops to Deep Learning Module...",
    "[AI_ENGINE] Probability Score: 94.2% Success Rate.",
    "[SYSTEM] Optimization Routine Complete. Standby for Signal."
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev, { id: Date.now(), text: fakeLogs[currentIndex] }];
        if (newLogs.length > 8) newLogs.shift();
        return newLogs;
      });
      currentIndex = (currentIndex + 1) % fakeLogs.length;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[calc(100vh-100px)] -mx-4 md:-mx-8 px-4 md:px-8 bg-[#050505] flex flex-col relative overflow-hidden">
      {/* Background Matrix/Grid Effect */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <header className="mb-4 z-10 flex justify-between items-center mt-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-omni-neon" size={24} />
            Omni <span className="text-omni-neon drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">Core AI</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono tracking-widest">SYSTEM STATUS: <span className="text-omni-green animate-pulse">ONLINE</span></p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-4 z-10">
        
        {/* Core Visualization (Center) */}
        <div className="lg:col-span-2 glass-panel border border-omni-neon/30 flex flex-col items-center justify-center relative overflow-hidden bg-black/60">
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-omni-gold animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-omni-green animate-pulse delay-150"></div>
          </div>
          
          <div className="relative flex items-center justify-center h-64 w-64">
            {/* Glowing Rings */}
            <div className="absolute w-full h-full rounded-full border-2 border-omni-neon/20 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute w-48 h-48 rounded-full border border-omni-neon/40 animate-[spin_7s_linear_infinite_reverse] border-dashed"></div>
            <div className="absolute w-32 h-32 rounded-full border-4 border-omni-neon/10 animate-[spin_3s_linear_infinite]"></div>
            
            {/* Central Orb */}
            <div className="w-20 h-20 rounded-full bg-omni-neon shadow-[0_0_80px_rgba(0,243,255,0.8)] animate-pulse flex items-center justify-center">
              <Network className="text-black" size={32} />
            </div>
          </div>
          
          <p className="mt-8 font-mono text-omni-neon text-sm tracking-[0.3em] uppercase animate-pulse">Neural Net Processing</p>
        </div>

        {/* Terminal Logs & Diagnostics */}
        <div className="flex flex-col gap-6">
          {/* Terminal */}
          <div className="glass-panel p-4 h-64 flex flex-col border border-white/10 bg-black/80 font-mono text-xs">
            <h3 className="text-gray-400 flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
              <Terminal size={14} /> SYSTEM_LOGS.EXE
            </h3>
            <div className="flex-1 overflow-hidden flex flex-col justify-end space-y-2">
              {logs.map(log => (
                <div key={log.id} className="text-omni-neon break-words opacity-80 animate-[slideIn_0.3s_ease-out]">
                  <span className="text-gray-500">{new Date().toISOString().split('T')[1].slice(0, 12)}</span> {log.text}
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostics */}
          <div className="glass-panel p-4 flex-1 border border-white/10 bg-black/80">
            <h3 className="text-gray-400 text-xs font-mono mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <Zap size={14} /> DIAGNOSTICS
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                  <span>TENSOR CORES</span>
                  <span className="text-omni-green">94%</span>
                </div>
                <div className="w-full h-1 bg-black rounded overflow-hidden">
                  <div className="h-full bg-omni-green w-[94%] shadow-[0_0_5px_#00ff64]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                  <span>LATENCY (CME)</span>
                  <span className="text-omni-neon">12ms</span>
                </div>
                <div className="w-full h-1 bg-black rounded overflow-hidden">
                  <div className="h-full bg-omni-neon w-[12%] shadow-[0_0_5px_#00f3ff]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                  <span>THREAT DETECTION</span>
                  <span className="text-omni-gold">ACTIVE</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-omni-gold font-mono mt-1">
                  <ShieldAlert size={14} className="animate-pulse" /> 0 Anomalies
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                  <Lock size={14} className="text-omni-green" /> End-to-End Encrypted
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-mono mt-2">
                  <Wifi size={14} className="text-omni-neon" /> Live Market Feed Sync
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
