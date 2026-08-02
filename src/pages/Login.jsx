import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (data.success) {
        onLogin();
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-omni-dark relative overflow-hidden p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-omni-gold/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-omni-neon/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-omni-gold to-yellow-600 mx-auto flex items-center justify-center font-bold text-3xl shadow-[0_0_30px_rgba(212,175,55,0.4)] mb-4">
            O
          </div>
          <h1 className="text-3xl font-bold gold-gradient mb-2">OMNI AI</h1>
          <p className="text-gray-400 text-sm">Professional Trading Signals</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-500 text-sm text-center">{error}</div>}
          
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-omni-gold focus:ring-1 focus:ring-omni-gold transition-all" placeholder="John Doe" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email Address (Hint: admin@omniai.com)</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-omni-gold focus:ring-1 focus:ring-omni-gold transition-all" placeholder="trader@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password (Hint: admin123)</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-omni-gold focus:ring-1 focus:ring-omni-gold transition-all" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-omni-gold to-yellow-600 text-black font-bold py-3 px-4 rounded-lg mt-6 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? 'Authenticating...' : (isLogin ? 'Access Terminal' : 'Create Account')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-omni-gold hover:underline font-medium">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
