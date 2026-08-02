export default function Learning() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Academy & <span className="gold-gradient">Learning</span></h1>
        <p className="text-gray-400">Master the Omni AI trading system.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel overflow-hidden group cursor-pointer">
            <div className="h-40 bg-black/40 flex items-center justify-center relative">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-omni-gold border-b-8 border-b-transparent ml-1"></div>
              </div>
            </div>
            <div className="p-4">
              <span className="text-[10px] font-bold text-omni-gold uppercase tracking-wider mb-2 block">Module {i}</span>
              <h3 className="font-bold text-white text-sm">How to trade {i === 1 ? 'Standby Signals' : i === 2 ? 'during NFP' : 'with strict filters'}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
