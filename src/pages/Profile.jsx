import { useState, useEffect } from 'react';
import { Save, AlertTriangle, ShieldCheck, Send, Palette, Award, Crosshair, TrendingUp, Lock } from 'lucide-react';

export default function Profile() {
  const [broker, setBroker] = useState('mt4');
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Account <span className="gold-gradient">Settings</span></h1>
        <p className="text-gray-400">Manage your Omni AI integrations and security.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                <input type="text" disabled value="VIP Trader" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                <input type="email" disabled value="admin@whitehouseacademy.com" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Subscription Tier</label>
                <div className="flex items-center gap-2 mt-1">
                  <ShieldCheck className="text-omni-gold" size={20} />
                  <span className="font-bold text-omni-gold">OMNI LIFETIME PRO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Telegram Integration */}
          <div className="glass-panel p-6 border-t-2 border-t-[#0088cc] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0088cc]/10 rounded-bl-full blur-[30px]"></div>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Send className="text-[#0088cc]" size={20} />
              Telegram Alerts
            </h2>
            <p className="text-xs text-gray-400 mb-4">Receive live Omni AI trading signals directly to your Telegram app.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Your Telegram ID / Username</label>
                <input type="text" placeholder="@your_username" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#0088cc] outline-none transition-colors" />
              </div>
              <button className="w-full bg-[#0088cc]/20 hover:bg-[#0088cc] text-[#0088cc] hover:text-white border border-[#0088cc]/50 transition-all font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                <Send size={16} /> Connect to Telegram Bot
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme Engine */}
          <div className="glass-panel p-6 border-t-2 border-t-purple-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full blur-[30px]"></div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Palette className="text-purple-500" size={20} />
              Terminal Theme
            </h2>
            <div className="flex gap-2">
              <button onClick={() => changeTheme('dark')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs border ${theme === 'dark' ? 'bg-omni-neon/20 border-omni-neon text-omni-neon' : 'bg-black border-white/10 text-gray-400'}`}>
                CYBERPUNK
              </button>
              <button onClick={() => changeTheme('gold')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs border ${theme === 'gold' ? 'bg-omni-gold/20 border-omni-gold text-omni-gold' : 'bg-[#12100b] border-white/10 text-gray-400'}`}>
                PRESTIGE
              </button>
              <button onClick={() => changeTheme('light')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs border ${theme === 'light' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>
                LIGHT MODE
              </button>
            </div>
          </div>

          {/* Gamification Badges */}
          <div className="glass-panel p-6 border-t-2 border-t-omni-gold relative overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Award className="text-omni-gold" size={20} />
              Trading Achievements
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-omni-gold/10 border border-omni-gold/30 rounded-xl text-center">
                <div className="w-12 h-12 bg-gradient-to-tr from-omni-gold to-yellow-600 rounded-full flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                  <TrendingUp className="text-black" size={20} />
                </div>
                <p className="text-[10px] font-bold text-omni-gold uppercase">First Blood</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-omni-neon/10 border border-omni-neon/30 rounded-xl text-center">
                <div className="w-12 h-12 bg-gradient-to-tr from-omni-neon to-blue-500 rounded-full flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                  <Crosshair className="text-black" size={20} />
                </div>
                <p className="text-[10px] font-bold text-omni-neon uppercase">Sniper</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl text-center opacity-50 grayscale">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Whale</p>
              </div>
            </div>
          </div>

          {/* Auto-CopyTrade Setup */}
          <div className="glass-panel p-6 border-t-2 border-t-omni-neon relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-omni-neon/10 rounded-bl-full blur-[30px]"></div>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              Auto-CopyTrade API
              <span className="text-[10px] px-2 py-0.5 bg-omni-neon/20 text-omni-neon rounded-full border border-omni-neon/30 animate-pulse">BETA</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">Connect your broker account to allow Omni AI to execute signals automatically.</p>
            
            <div className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Platform</label>
                <select value={broker} onChange={(e) => setBroker(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-omni-neon outline-none">
                  <option value="mt4">MetaTrader 4 (MT4)</option>
                  <option value="mt5">MetaTrader 5 (MT5)</option>
                  <option value="ctrader">cTrader</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Broker Server</label>
                <input type="text" placeholder="e.g. ICMarkets-Live03" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-omni-neon outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Account Number</label>
                <input type="text" placeholder="Enter Login ID" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-omni-neon outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Investor Password (Read-Only)</label>
                <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-omni-neon outline-none transition-colors" />
              </div>
              
              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <AlertTriangle size={14} className="text-omni-gold" />
                  End-to-End Encrypted
                </div>
                <button className="cyber-button flex items-center gap-2 py-2 px-4">
                  <Save size={16} /> CONNECT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
