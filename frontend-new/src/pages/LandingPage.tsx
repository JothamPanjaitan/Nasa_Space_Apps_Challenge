import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);

  const asteroidFacts = [
    "Over 1 million asteroids have been discovered in our solar system",
    "The largest asteroid, Ceres, is about 590 miles (950 km) across",
    "NASA tracks over 30,000 Near-Earth Objects (NEOs)",
    "A 10km asteroid impact caused the extinction of dinosaurs 66 million years ago",
    "The Chelyabinsk meteor in 2013 released energy equivalent to 500 kilotons of TNT",
    "NASA's DART mission successfully changed an asteroid's orbit in 2022"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % asteroidFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [asteroidFacts.length]);

  return (
    <div className="landing-page">
      {/* Animated Starfield Background */}
      <div className="starfield"></div>
      
      {/* Hero Section */}
      <div className="hero-container">
        <div className="hero-content fade-in">
          {/* Main Title */}
          <div className="hero-title-wrapper">
            <h1 className="hero-title">
              <span className="title-line-1">Meteor Madness</span>
              <span className="title-line-2">Defend Earth</span>
            </h1>
            <div className="title-glow"></div>
          </div>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Scientific asteroid impact simulator with real NASA data.
            <br />
            Visualize threats. Plan deflections. Save humanity.
          </p>

          {/* CTA Buttons */}
          <div className="cta-buttons">
            <button 
              className="btn btn-accent btn-large"
              onClick={() => navigate('/game')}
            >
              <span className="btn-icon">🎮</span>
              Defend Earth (Quick Start)
            </button>
            <button 
              className="btn btn-primary btn-large"
              onClick={() => navigate('/')}
            >
              <span className="btn-icon">🌍</span>
              Explore Scenario
            </button>
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => navigate('/mitigation')}
            >
              <span className="btn-icon">🛰️</span>
              Load Real NEO
            </button>
          </div>

          {/* Features Grid */}
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon">🔬</div>
              <h3>Science-First</h3>
              <p>Accurate physics models based on Holsapple scaling laws and USGS data</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">🌐</div>
              <h3>3D Visualization</h3>
              <p>Interactive Cesium globe with orbital trajectories and impact zones</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">🎯</div>
              <h3>Mitigation Sandbox</h3>
              <p>Test deflection strategies with delta-v calculations and lead time</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">📊</div>
              <h3>Impact Analysis</h3>
              <p>Detailed casualty estimates, damage radii, and economic impact</p>
            </div>
          </div>
        </div>

        {/* Rotating Earth with Impactor Arc */}
        <div className="hero-visual">
          <div className="earth-container planet-glow">
            <div className="earth-sphere"></div>
            <div className="earth-atmosphere"></div>
          </div>
          <svg className="impactor-arc" viewBox="0 0 400 400">
            <defs>
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'var(--accent-500)', stopOpacity: 0 }} />
                <stop offset="50%" style={{ stopColor: 'var(--accent-500)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'var(--danger-600)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              className="orbital-line"
              d="M 50 200 Q 150 50, 250 150 T 350 200"
              stroke="url(#arcGradient)"
              strokeWidth="3"
              fill="none"
            />
            <circle className="impactor-dot" cx="350" cy="200" r="6" fill="var(--danger-600)">
              <animate attributeName="cx" values="50;350" dur="4s" repeatCount="indefinite" />
              <animate attributeName="cy" values="200;200" dur="4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>

      {/* Facts Strip */}
      <div className="facts-strip glass-panel">
        <div className="fact-content">
          <span className="fact-icon">💡</span>
          <span className="fact-text">{asteroidFacts[factIndex]}</span>
          <span className="fact-attribution">— NASA JPL</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <div className="stat-value">30,000+</div>
          <div className="stat-label">NEOs Tracked</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">2,300+</div>
          <div className="stat-label">Potentially Hazardous</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">100%</div>
          <div className="stat-label">Science Accuracy</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">Real-Time</div>
          <div className="stat-label">NASA Data</div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
