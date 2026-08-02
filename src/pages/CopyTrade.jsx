import { useState } from 'react';
import { Copy, ShieldCheck, Zap, Crosshair, TrendingUp, Users, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CopyTrade() {
  const [copying, setCopying] = useState(null);

  const handleCopy = (id) => {
    setCopying(id);
    // Fake a quick "Linking" loading state, then redirect to Broker
    setTimeout(() => {
      setCopying(null);
      // Redirect to Broker's Social Trading / PAMM link (Placeholder - RoboForex CopyFX used as safe alternative)
      window.open(`https://my.roboforex.com/en/copyfx/provider/omni-master-${id}`, '_blank');
    }, 800);
  };

  const generateData = (trend) => {
    let current = 1000;
    return Array.from({ length: 30 }).map((_, i) => {
      current += (Math.random() * 100 * trend) - 20;
      return { day: i, equity: current };
    });
  };

  const masters = [
    {
      id: 'sniper',
      name: 'Omni Sniper AI',
      risk: 'High',
      copiers: 12450,
      winRate: '92%',
      roi: '+340%',
      icon: <Crosshair className="text-red-500" size={32} />,
      color: '#ef4444',
      data: generateData(1.5)
    },
    {
      id: 'swing',
      name: 'Omni Swing AI',
      risk: 'Low',
      copiers: 32800,
      winRate: '85%',
      roi: '+120%',
      icon: <ShieldCheck className="text-omni-green" size={32} />,
      color: '#00ff64',
      data: generateData(0.8)
    },
    {
      id: 'scalper',
      name: 'Omni Scalper AI',
      risk: 'Medium',
      copiers: 8900,
      winRate: '88%',
      roi: '+210%',
      icon: <Zap className="text-omni-gold" size={32} />,
      color: '#ffd700',
      data: generateData(1.2)
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Copy className="text-omni-neon" size={32} />
          CopyTrade <span className="gold-gradient">Master Hub</span>
        </h1>
        <p className="text-gray-400">1-Click Auto Copy. Let the Omni AI algorithms trade for you 24/7.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {masters.map(master => (
          <div key={master.id} className="glass-panel overflow-hidden group hover:-translate-y-2 transition-transform duration-300 relative border-t-2" style={{ borderTopColor: master.color }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full blur-[30px] opacity-20" style={{ backgroundColor: master.color }}></div>
            
            <div className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3 items-center">
                  <div className="p-3 bg-black/50 rounded-xl border border-white/10">
                    {master.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{master.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Users size={12} /> {master.copiers.toLocaleString()} copiers
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase">Risk</p>
                  <p className="font-bold text-white text-sm">{master.risk}</p>
                </div>
                <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase">Win Rate</p>
                  <p className="font-bold text-white text-sm">{master.winRate}</p>
                </div>
                <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase">Monthly ROI</p>
                  <p className="font-bold text-sm" style={{ color: master.color }}>{master.roi}</p>
                </div>
              </div>

              <div className="h-32 mb-6 w-full -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={master.data}>
                    <defs>
                      <linearGradient id={`color-${master.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={master.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={master.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                      itemStyle={{ color: master.color }}
                      labelStyle={{ display: 'none' }}
                      formatter={(val) => [`$${val.toFixed(0)}`, 'Equity']}
                    />
                    <Area type="monotone" dataKey="equity" stroke={master.color} fillOpacity={1} fill={`url(#color-${master.id})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <button 
                onClick={() => handleCopy(master.id)}
                disabled={copying === master.id}
                className="w-full py-3 rounded-lg font-bold text-sm text-black flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: master.color, opacity: copying === master.id ? 0.7 : 1 }}
              >
                {copying === master.id ? (
                  <span className="animate-pulse flex items-center gap-2"><Activity size={16} /> Linking Account...</span>
                ) : (
                  <span className="flex items-center gap-2"><TrendingUp size={16} /> 1-CLICK COPY</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
