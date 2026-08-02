import { useState } from 'react';
import { Target, ShieldAlert, Activity, DollarSign, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function PropFirm() {
  const [startBalance, setStartBalance] = useState(100000);
  const [currentBalance, setCurrentBalance] = useState(102500);
  const [dailyStartBalance, setDailyStartBalance] = useState(100000);
  
  const [dailyLimitPct, setDailyLimitPct] = useState(5);
  const [maxLimitPct, setMaxLimitPct] = useState(10);
  const [profitTargetPct, setProfitTargetPct] = useState(10);

  // Calculations
  const currentProfit = currentBalance - startBalance;
  const profitTargetAmount = startBalance * (profitTargetPct / 100);
  const profitProgress = Math.max(0, Math.min(100, (currentProfit / profitTargetAmount) * 100));

  const maxLossAllowed = startBalance * (maxLimitPct / 100);
  const maxDrawdownLevel = startBalance - maxLossAllowed;
  const currentDrawdown = startBalance - currentBalance;
  const maxDrawdownProgress = currentDrawdown > 0 ? Math.min(100, (currentDrawdown / maxLossAllowed) * 100) : 0;

  const dailyLossAllowed = dailyStartBalance * (dailyLimitPct / 100);
  const dailyDrawdownLevel = dailyStartBalance - dailyLossAllowed;
  const currentDailyDrawdown = dailyStartBalance - currentBalance;
  const dailyDrawdownProgress = currentDailyDrawdown > 0 ? Math.min(100, (currentDailyDrawdown / dailyLossAllowed) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Target className="text-omni-gold" size={32} />
          Prop Firm <span className="gold-gradient">Tracker</span>
        </h1>
        <p className="text-gray-400">Monitor your challenge accounts. Never breach a drawdown limit again.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Panel */}
        <div className="glass-panel p-6 col-span-1 border-t-2 border-t-omni-neon">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-omni-neon" size={20} /> Account Setup
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Initial Balance ($)</label>
              <input type="number" value={startBalance} onChange={e => setStartBalance(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-omni-neon" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Start of Day Balance ($)</label>
              <input type="number" value={dailyStartBalance} onChange={e => setDailyStartBalance(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-omni-neon" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Current Live Balance ($)</label>
              <input type="number" value={currentBalance} onChange={e => setCurrentBalance(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-omni-gold font-bold focus:outline-none focus:border-omni-gold" />
            </div>
            
            <hr className="border-white/10 my-4" />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Daily Loss Limit (%)</label>
                <input type="number" value={dailyLimitPct} onChange={e => setDailyLimitPct(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Max Loss Limit (%)</label>
                <input type="number" value={maxLimitPct} onChange={e => setMaxLimitPct(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-1">Profit Target (%)</label>
              <input type="number" value={profitTargetPct} onChange={e => setProfitTargetPct(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-omni-green" />
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Profit Target */}
          <div className="glass-panel p-6 border-l-4 border-l-omni-green relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-omni-green/10 rounded-bl-full blur-[30px]"></div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-omni-green" size={24} /> Phase 1 Profit Target
              </h2>
              <span className="text-omni-green font-mono font-bold text-xl">${profitTargetAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Current Profit: ${currentProfit > 0 ? currentProfit.toLocaleString() : '0'}</span>
              <span>{profitProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-omni-green transition-all duration-1000 shadow-[0_0_10px_rgba(0,255,100,0.5)]" 
                style={{ width: `${profitProgress}%` }}
              ></div>
            </div>
            {profitProgress >= 100 && (
              <p className="text-omni-green text-xs mt-2 font-bold uppercase animate-pulse">🎉 Target Reached! You passed the challenge.</p>
            )}
          </div>

          {/* Daily Drawdown */}
          <div className="glass-panel p-6 border-l-4 border-l-orange-500 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-orange-500" size={24} /> Daily Drawdown Limit
              </h2>
              <span className="text-orange-500 font-mono font-bold text-xl">${dailyLossAllowed.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-2">Breach Level: Drops below <strong className="text-orange-400">${dailyDrawdownLevel.toLocaleString()}</strong></p>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Current Daily Loss: ${currentDailyDrawdown > 0 ? currentDailyDrawdown.toLocaleString() : '0'}</span>
              <span>{dailyDrawdownProgress.toFixed(1)}% to breach</span>
            </div>
            <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div 
                className={`h-full transition-all duration-1000 ${dailyDrawdownProgress > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)] animate-pulse' : 'bg-orange-500'}`} 
                style={{ width: `${dailyDrawdownProgress}%` }}
              ></div>
            </div>
            {dailyDrawdownProgress >= 100 && (
              <p className="text-red-500 text-xs mt-2 font-bold uppercase animate-pulse">❌ Account Breached: Daily Limit Exceeded</p>
            )}
          </div>

          {/* Max Drawdown */}
          <div className="glass-panel p-6 border-l-4 border-l-red-500 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/10 rounded-tl-full blur-[30px]"></div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertOctagon className="text-red-500" size={24} /> Max Drawdown Limit
              </h2>
              <span className="text-red-500 font-mono font-bold text-xl">${maxLossAllowed.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-2">Breach Level: Drops below <strong className="text-red-400">${maxDrawdownLevel.toLocaleString()}</strong></p>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Current Total Loss: ${currentDrawdown > 0 ? currentDrawdown.toLocaleString() : '0'}</span>
              <span>{maxDrawdownProgress.toFixed(1)}% to breach</span>
            </div>
            <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div 
                className={`h-full transition-all duration-1000 ${maxDrawdownProgress > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)] animate-pulse' : 'bg-red-500'}`} 
                style={{ width: `${maxDrawdownProgress}%` }}
              ></div>
            </div>
            {maxDrawdownProgress >= 100 && (
              <p className="text-red-500 text-xs mt-2 font-bold uppercase animate-pulse">❌ Account Breached: Max Limit Exceeded</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
