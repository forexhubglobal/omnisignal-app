import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function Signals() {
  const [signals, setSignals] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://omnisignal-app.onrender.com';

  useEffect(() => {
    // Fetch historical signals
    fetch(`${API_URL}/api/signals`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setSignals(data);
      })
      .catch(err => console.error("Error fetching signals:", err));

    // Connect to WebSocket
    const socket = io(API_URL);
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    // Listen for new incoming signals in real-time
    socket.on('new_signal', (newSignal) => {
      setSignals(prevSignals => [newSignal, ...prevSignals]);
      
      // Play AI Audio Alert Beep
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
      audio.volume = 0.3;
      audio.play().catch(e => console.log("Audio play blocked by browser:", e));

      // AI Voice Synthesis (Text-to-Speech)
      if ('speechSynthesis' in window) {
        const typeSpeech = newSignal.type.toLowerCase().includes('buy') ? 'Buy' : 'Sell';
        const msg = new SpeechSynthesisUtterance(`Omni AI Alert. New ${typeSpeech} signal detected for ${newSignal.pair}.`);
        msg.rate = 1.1; // Slightly faster, more robotic
        msg.pitch = 0.9;
        window.speechSynthesis.speak(msg);
      }

      // Play a small notification sound or trigger a vibration
      if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    socket.on('signal_updated', (updatedData) => {
      setSignals(prevSignals => {
        const newSignals = [...prevSignals];
        const index = newSignals.findIndex(s => s.pair === updatedData.pair && s.status === 'live');
        if (index !== -1) {
          newSignals[index] = { ...newSignals[index], status: updatedData.status };
        }
        return newSignals;
      });
    });

    return () => socket.disconnect();
  }, []);
  return (
    <div className="space-y-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Live <span className="gold-gradient">Signals</span></h1>
          <p className="text-gray-400">Real-time alerts from Omni AI Terminal.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm shadow-[0_0_15px_rgba(0,243,255,0.3)] ${isConnected ? 'bg-omni-neon/10 border-omni-neon/40 text-omni-neon' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-omni-neon animate-pulse-fast shadow-[0_0_8px_#00f3ff]' : 'bg-red-500'}`} />
          {isConnected ? 'System Active' : 'System Offline'}
        </div>
      </header>

      <div className="grid gap-4">
        {signals.length === 0 ? (
          <div className="text-center text-gray-500 py-12 glass-panel">
            <div className="w-16 h-16 border-2 border-omni-neon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-mono animate-pulse">WAITING FOR OMNI AI SIGNALS...</p>
          </div>
        ) : (
          signals.map((signal) => (
            <div 
              key={signal.id} 
              className={`glass-panel p-5 border-l-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${
                signal.status === 'live' ? 'border-l-omni-green shadow-[0_0_30px_rgba(0,255,102,0.15)] hover:shadow-[0_0_40px_rgba(0,255,102,0.3)]' :
                signal.status === 'completed' ? 'border-l-gray-400 bg-gray-900/50 opacity-80' :
                signal.status === 'standby' ? 'border-l-omni-gold shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]' :
                signal.status === 'active' ? 'border-l-omni-red shadow-[0_0_20px_rgba(255,42,42,0.1)] hover:shadow-[0_0_30px_rgba(255,42,42,0.2)]' :
                'border-l-gray-500 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 relative">
                
                {/* Asset & Type */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center font-bold text-lg border border-white/10 group-hover:border-omni-neon transition-colors shadow-inner">
                    {signal.pair.substring(0,3)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{signal.pair}</h3>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded uppercase inline-block mt-1 ${
                      signal.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                      signal.type.includes('BUY') ? 'bg-green-500/20 text-green-400' :
                      signal.type.includes('SELL') ? 'bg-red-500/20 text-red-400' :
                      signal.type.includes('STANDBY') ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {signal.type}
                    </div>
                  </div>
                </div>

                {/* Price Details */}
                <div className="grid grid-cols-3 gap-6 md:gap-8 text-center bg-black/40 p-3 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Entry</p>
                    <p className="font-mono font-bold text-white neon-text">{signal.price}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-omni-green uppercase tracking-widest mb-1">Take Profit</p>
                    <p className="font-mono font-bold text-omni-green">{signal.tp}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-omni-red uppercase tracking-widest mb-1">Stop Loss</p>
                    <p className="font-mono font-bold text-omni-red">{signal.sl}</p>
                  </div>
                </div>

                {/* Time & Action */}
                <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-omni-neon/70">
                    <Clock size={12} /> {signal.time}
                  </div>
                  {signal.status === 'live' || signal.status === 'standby' ? (
                    <button className="cyber-button text-xs py-1.5">
                      INITIATE
                    </button>
                  ) : signal.status === 'completed' ? (
                    <div className="text-omni-neon text-xs font-bold px-3 py-1.5 border border-omni-neon/50 rounded bg-omni-neon/10">
                      COMPLETED ✅
                    </div>
                  ) : null}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
