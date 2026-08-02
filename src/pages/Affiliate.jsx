import { Link2, Users, DollarSign, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function Affiliate() {
  const [copied, setCopied] = useState(false);
  const refLink = "https://omniai.com/ref/VIP_Trader77";

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="mb-8 text-center flex flex-col items-center">
        <Users size={48} className="text-omni-neon mb-4 animate-pulse-fast" />
        <h1 className="text-3xl font-bold text-white mb-2">Partner <span className="neon-text">Program</span></h1>
        <p className="text-gray-400">Invite traders and earn 30% recurring commission on every subscription.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-6 border-l-4 border-l-omni-gold flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Clicks</p>
            <h3 className="text-2xl font-bold text-white font-mono">1,240</h3>
          </div>
          <Link2 className="text-omni-gold/50" size={32} />
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-omni-neon flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Active Referrals</p>
            <h3 className="text-2xl font-bold text-white font-mono">15</h3>
          </div>
          <Users className="text-omni-neon/50" size={32} />
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-omni-green flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-omni-green/5"></div>
          <div className="relative z-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Earned</p>
            <h3 className="text-2xl font-bold text-omni-green font-mono">$450.00</h3>
          </div>
          <DollarSign className="text-omni-green/50 relative z-10" size={32} />
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="glass-panel p-8 text-center relative overflow-hidden border-t-2 border-t-white/10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-omni-neon/10 rounded-full blur-[80px]"></div>
        <h2 className="text-xl font-bold text-white mb-2 relative z-10">Your Unique Referral Link</h2>
        <p className="text-sm text-gray-400 mb-6 relative z-10">Share this link on your social media, YouTube, or Telegram channel.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto relative z-10">
          <input 
            type="text" 
            readOnly 
            value={refLink} 
            className="w-full bg-black/60 border border-white/20 rounded-lg px-4 py-3 text-omni-neon font-mono text-center sm:text-left focus:outline-none"
          />
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all w-full sm:w-auto ${
              copied 
                ? 'bg-omni-green text-black shadow-[0_0_15px_rgba(0,255,100,0.4)]' 
                : 'bg-gradient-to-r from-omni-neon to-blue-500 text-black hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]'
            }`}
          >
            {copied ? <><CheckCircle size={18} /> Copied!</> : <><Copy size={18} /> Copy Link</>}
          </button>
        </div>
      </div>

      {/* Active Referrals List */}
      <div className="glass-panel p-0 overflow-hidden">
        <h3 className="p-6 text-lg font-bold text-white border-b border-white/10">Recent Referrals</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/60 border-b border-white/10 text-gray-400 text-xs uppercase tracking-widest">
              <th className="p-4">User</th>
              <th className="p-4">Date Joined</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Commission</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "John_FX", date: "2026-08-01", status: "Active", comm: "$30.00" },
              { name: "CryptoNinja", date: "2026-07-28", status: "Active", comm: "$30.00" },
              { name: "SarahTrades", date: "2026-07-20", status: "Cancelled", comm: "$0.00" },
            ].map((ref, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{ref.name}</td>
                <td className="p-4 text-gray-400">{ref.date}</td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    ref.status === 'Active' ? 'bg-omni-green/20 text-omni-green' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {ref.status}
                  </span>
                </td>
                <td className="p-4 text-right font-mono font-bold text-omni-gold">{ref.comm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
