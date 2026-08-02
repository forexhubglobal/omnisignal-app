import { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello Trader! I am Omni AI Coach. How can I help you optimize your portfolio today?", isBot: true }
  ]);
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInput("");
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { text: data.reply || "Connection error.", isBot: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Error connecting to Omni AI server.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 glass-panel flex flex-col h-[400px] shadow-[0_10px_40px_rgba(0,243,255,0.2)] border border-omni-neon/30 rounded-2xl overflow-hidden mb-4">
          <div className="bg-black/60 p-4 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-omni-neon to-transparent animate-pulse-fast"></div>
            <div className="flex items-center gap-2">
              <Bot className="text-omni-neon" size={20} />
              <span className="font-bold text-white tracking-wide">Omni AI Coach</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                  msg.isBot 
                    ? 'bg-black/40 border border-white/5 text-gray-300 rounded-tl-none' 
                    : 'bg-omni-neon/10 border border-omni-neon/20 text-white rounded-tr-none shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              placeholder={isLoading ? "AI is typing..." : "Ask Omni AI..."} 
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-omni-neon outline-none disabled:opacity-50"
            />
            <button onClick={handleSend} className="p-2 bg-omni-neon/10 text-omni-neon rounded-lg hover:bg-omni-neon hover:text-black transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-black border-2 border-omni-neon rounded-full flex items-center justify-center text-omni-neon shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] transition-all relative group"
      >
        <div className="absolute inset-0 bg-omni-neon/20 rounded-full animate-ping opacity-50"></div>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
