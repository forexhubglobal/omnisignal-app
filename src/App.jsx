import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Signals from './pages/Signals';
import AITools from './pages/AITools';
import Learning from './pages/Learning';
import Journal from './pages/Journal';
import Leaderboard from './pages/Leaderboard';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Affiliate from './pages/Affiliate';
import Calendar from './pages/Calendar';
import PropFirm from './pages/PropFirm';
import CommandCenter from './pages/CommandCenter';
import OmniCore from './pages/OmniCore';
import WhaleTracker from './pages/WhaleTracker';
import StrengthMatrix from './pages/StrengthMatrix';
import XRay from './pages/XRay';
import Chatbot from './components/Chatbot';
import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './firebase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-omni-dark text-omni-gold">
        <div className="animate-pulse font-bold text-xl">MENGAKSES OMNI TERMINAL...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="signals" element={<Signals />} />
          <Route path="tools" element={<AITools />} />
          <Route path="ai-tools" element={<AITools />} />
          <Route path="journal" element={<Journal />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="learning" element={<Learning />} />
          <Route path="profile" element={<Profile />} />
          <Route path="affiliate" element={<Affiliate />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="propfirm" element={<PropFirm />} />
          <Route path="command-center" element={<CommandCenter />} />
          <Route path="omnicore" element={<OmniCore />} />
          <Route path="whale-tracker" element={<WhaleTracker />} />
          <Route path="strength" element={<StrengthMatrix />} />
          <Route path="xray" element={<XRay />} />
        </Route>
      </Routes>
      {isAuthenticated && <Chatbot />}
    </Router>
  );
}

export default App;
