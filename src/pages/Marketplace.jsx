import { ShoppingCart, Crown, Shield, Zap, TrendingUp, MonitorSmartphone } from 'lucide-react';
import { useState } from 'react';

export default function Marketplace() {
  const [purchaseStatus, setPurchaseStatus] = useState(null);

  const handlePurchase = (item) => {
    setPurchaseStatus(`Initiating secure checkout for ${item}... Please contact Admin to proceed.`);
    setTimeout(() => setPurchaseStatus(null), 4000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <header className="mb-8 flex flex-col items-center text-center">
        <ShoppingCart size={48} className="text-omni-gold mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Omni <span className="gold-gradient">Marketplace</span></h1>
        <p className="text-gray-400">Upgrade your trading arsenal with premium tools and exclusive access.</p>
      </header>

      {purchaseStatus && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-black/90 border border-omni-neon text-omni-neon px-6 py-3 rounded-full z-50 animate-pulse shadow-[0_0_20px_rgba(0,243,255,0.4)]">
          {purchaseStatus}
        </div>
      )}

      {/* Subscriptions Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
          <Crown className="text-omni-gold" />
          VIP Memberships
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pro Monthly */}
          <div className="glass-panel p-8 border-t-2 border-t-white/20 hover:border-t-omni-neon transition-all flex flex-col items-center text-center group cursor-pointer">
            <h3 className="text-xl font-bold text-white mb-2">Omni PRO</h3>
            <div className="text-4xl font-black text-white mb-6">$99 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
            <ul className="space-y-3 text-sm text-gray-400 mb-8 w-full text-left">
              <li className="flex items-center gap-2"><Shield size={16} className="text-omni-green" /> All Asset Classes (Forex, Crypto)</li>
              <li className="flex items-center gap-2"><Shield size={16} className="text-omni-green" /> Real-time Voice Alerts</li>
              <li className="flex items-center gap-2"><Shield size={16} className="text-gray-600" /> Auto-CopyTrade Integration</li>
            </ul>
            <button onClick={() => handlePurchase('Omni PRO')} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-white font-bold group-hover:bg-omni-neon group-hover:text-black transition-colors mt-auto">
              Subscribe Now
            </button>
          </div>

          {/* Lifetime Access */}
          <div className="glass-panel p-8 border-t-2 border-t-omni-gold relative overflow-hidden flex flex-col items-center text-center group cursor-pointer shadow-[0_0_30px_rgba(255,215,0,0.1)] hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] transform hover:-translate-y-2 transition-all">
            <div className="absolute top-4 right-4 bg-omni-gold text-black text-[10px] font-black px-2 py-1 rounded uppercase animate-pulse">Best Value</div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-omni-gold/10 rounded-bl-full blur-[30px] pointer-events-none"></div>
            
            <h3 className="text-xl font-bold text-white mb-2">LIFETIME ACCESS</h3>
            <div className="text-4xl font-black text-omni-gold mb-6">$999 <span className="text-sm font-normal text-gray-500">/ once</span></div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8 w-full text-left relative z-10">
              <li className="flex items-center gap-2"><Shield size={16} className="text-omni-gold" /> Everything in PRO</li>
              <li className="flex items-center gap-2"><Shield size={16} className="text-omni-gold" /> Auto-CopyTrade Integration</li>
              <li className="flex items-center gap-2"><Shield size={16} className="text-omni-gold" /> Private VIP Telegram Access</li>
              <li className="flex items-center gap-2"><Shield size={16} className="text-omni-gold" /> Direct 1-on-1 Support</li>
            </ul>
            <button onClick={() => handlePurchase('LIFETIME ACCESS')} className="w-full py-3 bg-omni-gold/10 border border-omni-gold text-omni-gold font-bold rounded-lg group-hover:bg-omni-gold group-hover:text-black transition-colors mt-auto">
              Upgrade to Lifetime
            </button>
          </div>

          {/* Mentorship */}
          <div className="glass-panel p-8 border-t-2 border-t-white/20 hover:border-t-omni-neon transition-all flex flex-col items-center text-center group cursor-pointer">
            <h3 className="text-xl font-bold text-white mb-2">1-on-1 Mentorship</h3>
            <div className="text-4xl font-black text-white mb-6">$499 <span className="text-sm font-normal text-gray-500">/ session</span></div>
            <ul className="space-y-3 text-sm text-gray-400 mb-8 w-full text-left">
              <li className="flex items-center gap-2"><MonitorSmartphone size={16} className="text-omni-neon" /> 2 Hours Zoom Session</li>
              <li className="flex items-center gap-2"><MonitorSmartphone size={16} className="text-omni-neon" /> Portfolio Analysis</li>
              <li className="flex items-center gap-2"><MonitorSmartphone size={16} className="text-omni-neon" /> Custom Strategy Setup</li>
            </ul>
            <button onClick={() => handlePurchase('Mentorship Session')} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-white font-bold group-hover:bg-omni-neon group-hover:text-black transition-colors mt-auto">
              Book Session
            </button>
          </div>

        </div>
      </section>

      {/* Software & Bots Section */}
      <section className="pt-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
          <Zap className="text-omni-neon" />
          Software & Trading Bots
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Auto-Bot */}
          <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-center hover:border-omni-neon transition-colors group">
            <div className="w-24 h-24 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-omni-neon shadow-inner">
              <Zap size={40} className="text-omni-neon" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-white">Omni Auto-Bot (MT4/MT5)</h3>
              <p className="text-xs text-gray-400 mt-2">Fully automated Expert Advisor (EA). Connects directly to our backend to execute signals on your broker automatically while you sleep.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-xl text-white">$299</span>
                <button onClick={() => handlePurchase('Omni Auto-Bot')} className="px-4 py-1.5 bg-omni-neon/10 text-omni-neon border border-omni-neon/30 rounded hover:bg-omni-neon hover:text-black transition-colors text-sm font-bold">
                  Buy License
                </button>
              </div>
            </div>
          </div>

          {/* Custom Indicator */}
          <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-center hover:border-omni-gold transition-colors group">
            <div className="w-24 h-24 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-omni-gold shadow-inner">
              <TrendingUp size={40} className="text-omni-gold" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-white">Reversal Sniper Indicator</h3>
              <p className="text-xs text-gray-400 mt-2">Private TradingView script. Highlights exact reversal zones using institutional order block logic. Lifetime access to script.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-xl text-white">$149</span>
                <button onClick={() => handlePurchase('Sniper Indicator')} className="px-4 py-1.5 bg-omni-gold/10 text-omni-gold border border-omni-gold/30 rounded hover:bg-omni-gold hover:text-black transition-colors text-sm font-bold">
                  Get Script
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
