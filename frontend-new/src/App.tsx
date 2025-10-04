import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import GameController from './game/GameController';
import ImpactMap from './ImpactMap';
import MitigationPage from './pages/MitigationPage';
import CesiumImpactVisualization from './components/CesiumImpactVisualization';
import LandingPage from './pages/LandingPage';
import './styles/global.css';
import './App.css';

function Navigation() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Hide nav on landing page
  if (location.pathname === '/landing') {
    return null;
  }

  return (
    <nav className="main-nav glass-panel">
      <div className="nav-brand">
        <Link to="/landing" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
          <span className="nav-icon">🛰️</span>
          3D Simulator
        </Link>
        <Link to="/game" className="nav-link" onClick={() => setMenuOpen(false)}>
          <span className="nav-icon">🎮</span>
          Game Mode
        </Link>
        <Link to="/impact" className="nav-link" onClick={() => setMenuOpen(false)}>
          <span className="nav-icon">🗺️</span>
          Impact Map
        </Link>
        <Link to="/mitigation" className="nav-link" onClick={() => setMenuOpen(false)}>
          <span className="nav-icon">🛡️</span>
          Mitigation
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-main">
        <Navigation />
        
        <div className="app-content">
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/" element={<CesiumImpactVisualization />} />
            <Route path="/game" element={<GameController />} />
            <Route path="/impact" element={<ImpactMap />} />
            <Route path="/mitigation" element={<MitigationPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;