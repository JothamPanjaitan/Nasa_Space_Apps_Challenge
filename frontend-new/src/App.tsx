import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import GameController from './game/GameController';
import ImpactMap from './ImpactMap';
import MitigationPage from './pages/MitigationPage';
import OrbitalSimulator from './components/OrbitalSimulator';
import LandingPage from './pages/LandingPage';
import HelpPage from './pages/HelpPage';
import FooterNav from './components/FooterNav';
import './styles/global.css';
import './App.css';

function Navigation() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Hide nav on landing page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="main-nav glass-panel">
      <div className="nav-brand">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🌍</span>
          <span style={{ 
            fontWeight: 700, 
            fontSize: '18px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Meteor Madness
          </span>
        </Link>
      </div>
      
      <button 
        className="nav-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
        <Link to="/asteroid-data" className="nav-link" onClick={() => setMenuOpen(false)}>
          <span className="nav-icon">🛰️</span>
          Asteroid Live Data
        </Link>
        <Link to="/game" className="nav-link" onClick={() => setMenuOpen(false)}>
          <span className="nav-icon">🎮</span>
          Game Mode
        </Link>
      </div>
    </nav>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const routeToFooterState = (path: string) => {
    if (path.startsWith('/asteroid-data')) return 'asteroid_data';
    if (path.startsWith('/game')) return 'game';
    return 'intro';
  };

  // Don't show footer on landing page, game mode, or asteroid-data page
  const showFooter = location.pathname !== '/' && 
                     !location.pathname.startsWith('/game') && 
                     location.pathname !== '/asteroid-data';

  return (
    <div className="app-main">
      {location.pathname !== '/' && <Navigation />}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/asteroid-data" element={<OrbitalSimulator />} />
          <Route path="/game" element={<GameController />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </div>
      {showFooter && (
        <FooterNav
          currentState={routeToFooterState(location.pathname)}
          onNavigate={(state) => {
            if (state === 'back') {
              window.history.back();
              return;
            }
            const map: Record<string, string> = {
              intro: '/',
              asteroid_data: '/asteroid-data',
              game: '/game',
            };
            const to = map[state] || '/';
            navigate(to);
          }}
          onHelp={() => alert('Use the footer to navigate: Simulator → Impact → Mitigation → Protect')}
          canGoBack={true}
          canGoForward={false}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;