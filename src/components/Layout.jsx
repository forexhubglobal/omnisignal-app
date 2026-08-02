import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Signal, BrainCircuit, BookOpen, GraduationCap, UserCircle, Trophy, ShoppingCart, Users, AlertTriangle, Volume2, VolumeX, Calendar, Target, MonitorPlay, Cpu, Waves, Compass, Activity } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      
      let textToSpeak = newState 
        ? "Omni Voice A I activated. I am now monitoring the markets for you." 
        : "Voice A I deactivated.";
        
      const msg = new SpeechSynthesisUtterance(textToSpeak);
      msg.rate = 0.95; // Slightly slower, deliberate pace
      msg.pitch = 0.8; // Deeper pitch for JARVIS effect
      
      // Try to find a JARVIS-like voice (British Male)
      const voices = window.speechSynthesis.getVoices();
      const jarvisVoice = voices.find(v => 
        (v.lang === 'en-GB' || v.name.includes('UK English Male') || v.name.includes('George') || v.name.includes('Daniel')) &&
        !v.name.includes('Female') && !v.name.includes('Hazel') && !v.name.includes('Susan')
      );
      
      if (jarvisVoice) {
        msg.voice = jarvisVoice;
      }
      
      window.speechSynthesis.speak(msg);
    } else {
      alert("Browser boss tak support Voice AI ni.");
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Signals', path: '/signals', icon: <Signal size={20} /> },
    { name: 'Command Center', path: '/command-center', icon: <MonitorPlay size={20} /> },
    { name: 'AI Tools', path: '/ai-tools', icon: <BrainCircuit size={20} /> },
    { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
    { name: 'Prop Firm', path: '/propfirm', icon: <Target size={20} /> },
    { name: 'Omni X-Ray', path: '/xray', icon: <Activity size={20} /> },
    { name: 'Omni Core AI', path: '/omnicore', icon: <Cpu size={20} /> },
    { name: 'Whale Radar', path: '/whale-tracker', icon: <Waves size={20} /> },
    { name: 'Strength Matrix', path: '/strength', icon: <Compass size={20} /> },
    { name: 'Journal', path: '/journal', icon: <BookOpen size={20} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={20} /> },
    { name: 'Marketplace', path: '/marketplace', icon: <ShoppingCart size={20} /> },
    { name: 'Affiliate', path: '/affiliate', icon: <Users size={20} /> },
    { name: 'Learning', path: '/learning', icon: <GraduationCap size={20} /> },
    { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent text-white relative">
      {/* Animated Orbs */}
      <div className="fixed top-0 left-[-10%] w-96 h-96 bg-omni-gold/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob z-[-1]"></div>
      <div className="fixed top-[-10%] right-[-10%] w-96 h-96 bg-omni-neon/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 z-[-1]"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-[40rem] h-[40rem] bg-purple-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000 z-[-1]"></div>
      
      {/* Scanline Overlay */}
      <div className="fixed inset-0 w-full h-[5px] bg-omni-neon/10 animate-scanline z-50 pointer-events-none opacity-50 blur-[1px]"></div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 glass-panel p-6 m-4 h-[calc(100vh-32px)] sticky top-4 bg-black/40 shadow-[4px_0_24px_rgba(0,243,255,0.05)]">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-omni-gold to-yellow-600 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(212,175,55,0.5)]">
            O
          </div>
          <h1 className="text-xl font-bold tracking-wider gold-gradient">OMNI AI</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? 'text-omni-neon bg-omni-neon/10 border border-omni-neon/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-omni-neon shadow-[0_0_10px_#00f3ff]"></div>}
                
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                <span className="font-medium tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
          <button 
            onClick={toggleVoice}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 font-bold text-xs ${
              voiceEnabled 
                ? 'bg-omni-neon/20 text-omni-neon border border-omni-neon/50 shadow-[0_0_15px_rgba(0,243,255,0.2)]' 
                : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              {voiceEnabled ? <Volume2 size={16} className="animate-pulse" /> : <VolumeX size={16} />}
              VOICE AI
            </span>
            <span>{voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Global News Alert Banner (Mockup) */}
          <div className="mb-6 w-full bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center justify-center gap-3 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <AlertTriangle className="text-red-500" size={24} />
            <p className="text-white font-bold tracking-wide text-sm md:text-base">
              HIGH IMPACT NEWS IN 30 MINS: NFP - AVOID TRADING!
            </p>
          </div>
          
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full glass-panel border-t border-white/10 p-3 z-50 flex overflow-x-auto gap-6 custom-scrollbar rounded-none rounded-t-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? 'text-omni-gold' : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
