import { EconomicCalendar } from "react-ts-tradingview-widgets";
import { Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';

export default function Calendar() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <CalendarIcon className="text-omni-neon" size={32} />
          Economic <span className="gold-gradient">Calendar</span>
        </h1>
        <p className="text-gray-400">Track high-impact global news events and market volatility.</p>
      </header>

      <div className="glass-panel p-6 border-t-2 border-t-red-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-bl-full blur-[50px]"></div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10 bg-red-500/20 border border-red-500/50 p-4 rounded-lg">
          <AlertTriangle className="text-red-500 animate-pulse" size={24} />
          <div>
            <h3 className="font-bold text-white">Warning: High Volatility Expected</h3>
            <p className="text-xs text-red-200">Avoid trading 30 minutes before and after high-impact (3-bull) news events.</p>
          </div>
        </div>

        <div className="h-[600px] w-full rounded-xl overflow-hidden bg-black/60 relative z-10 border border-white/10 shadow-inner">
          <EconomicCalendar 
            colorTheme="dark" 
            height="100%" 
            width="100%" 
            isTransparent={true}
            locale="en"
            importanceFilter="-1,0,1"
          />
        </div>
      </div>
    </div>
  );
}
