import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HelpPage.css';

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="help-page">
      <div className="help-background">
        <div className="stars">
          {Array.from({ length: 150 }, (_, i) => (
            <div key={i} className={`star star-${i % 3}`}></div>
          ))}
        </div>
      </div>

      <div className="help-content">
        <div className="help-header">
          <h1>❓ Help & Guide</h1>
          <p>Learn how to use Meteor Madness: Defend Earth</p>
        </div>

        <div className="help-sections">
          {/* Getting Started */}
          <section className="help-section">
            <h2>🎯 Getting Started</h2>
            <div className="help-cards">
              <div className="help-card">
                <h3>1. Load Real NEO Data</h3>
                <p>Click <strong>"Load Real NEO"</strong> on the landing page to browse over 40,000 real asteroids from NASA's database.</p>
              </div>
              <div className="help-card">
                <h3>2. Select an Asteroid</h3>
                <p>Choose an asteroid to see its 3D orbit visualization, orbital elements, and approach data.</p>
              </div>
              <div className="help-card">
                <h3>3. Enter Game Mode</h3>
                <p>Click <strong>"Enter Game Mode"</strong> to start analyzing impact scenarios and testing deflection strategies.</p>
              </div>
            </div>
          </section>

          {/* Study & Explore */}
          <section className="help-section">
            <h2>🔬 Study & Explore</h2>
            <div className="help-card">
              <h3>Adjust Parameters</h3>
              <p>Use sliders to modify asteroid properties:</p>
              <ul>
                <li><strong>Semi-Major Axis:</strong> Orbit size (0.5-3.0 AU)</li>
                <li><strong>Eccentricity:</strong> Orbit shape (0-0.99)</li>
                <li><strong>Inclination:</strong> Orbit tilt (0-180°)</li>
                <li><strong>Radius:</strong> Asteroid size (1-500m)</li>
                <li><strong>Density:</strong> Material density (1000-8000 kg/m³)</li>
                <li><strong>Velocity:</strong> Impact speed (1-70 km/s)</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>View Calculations</h3>
              <p>See real-time calculations of:</p>
              <ul>
                <li><strong>Kinetic Energy:</strong> E = ½mv²</li>
                <li><strong>TNT Equivalent:</strong> Energy converted to megatons</li>
                <li><strong>Crater Diameter:</strong> Schmidt-Holsapple scaling</li>
                <li><strong>Seismic Magnitude:</strong> Earthquake equivalent</li>
                <li><strong>Blast, Thermal, and Tsunami Radii</strong></li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Scenario Modes</h3>
              <p><strong>🔬 Observe Only:</strong> Scientific analysis without intervention</p>
              <p><strong>🛡️ Defend Earth:</strong> Test deflection strategies and mitigation</p>
            </div>
          </section>

          {/* Defend Earth */}
          <section className="help-section">
            <h2>🛡️ Defend Earth</h2>
            <div className="help-card">
              <h3>Deflection Strategies</h3>
              <div className="strategy-grid">
                <div className="strategy-item">
                  <h4>Kinetic Impactor</h4>
                  <p>Direct spacecraft impact (DART-style)</p>
                  <span className="badge">85% Effectiveness</span>
                  <span className="badge">180 days lead time</span>
                </div>
                <div className="strategy-item">
                  <h4>Gravity Tractor</h4>
                  <p>Slow gravitational pull</p>
                  <span className="badge">70% Effectiveness</span>
                  <span className="badge">365 days lead time</span>
                </div>
                <div className="strategy-item">
                  <h4>Nuclear Deflection</h4>
                  <p>High-energy explosive</p>
                  <span className="badge">95% Effectiveness</span>
                  <span className="badge">90 days lead time</span>
                </div>
              </div>
            </div>
            <div className="help-card">
              <h3>Mission Parameters</h3>
              <ul>
                <li><strong>Delta-V (ΔV):</strong> Change in velocity (m/s) - Higher values increase success</li>
                <li><strong>Lead Time:</strong> Days before impact - More time = higher success</li>
                <li><strong>Success Probability:</strong> Calculated based on method, ΔV, and lead time</li>
              </ul>
              <p className="formula">Success = Effectiveness × (Lead Time Factor) × (ΔV Factor)</p>
            </div>
          </section>

          {/* Prepare for Impact */}
          <section className="help-section">
            <h2>🏃 Prepare for Impact</h2>
            <div className="help-card">
              <h3>Mitigation Measures</h3>
              <ul>
                <li><strong>Evacuation:</strong> Move people away from impact zone (saves 80% of evacuated population)</li>
                <li><strong>Shelters:</strong> Underground protection from blast (60% survival rate)</li>
                <li><strong>Infrastructure:</strong> Harden buildings against damage (reduces casualties by 30%)</li>
                <li><strong>Early Warning:</strong> Alert systems and public education (20% additional lives saved)</li>
                <li><strong>Medical Surge:</strong> Extra hospital capacity (40% of injured saved)</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Dashboard Metrics</h3>
              <p>Track the effectiveness of your mitigation strategy:</p>
              <ul>
                <li><strong>Lives Saved:</strong> Total population protected</li>
                <li><strong>Economic Loss Prevented:</strong> Damage reduction in billions</li>
                <li><strong>Infrastructure Damage Reduced:</strong> Buildings protected</li>
                <li><strong>Response Coordination:</strong> Overall preparedness score</li>
              </ul>
            </div>
          </section>

          {/* Impact Map */}
          <section className="help-section">
            <h2>🗺️ Impact Map</h2>
            <div className="help-card">
              <h3>Visualization Layers</h3>
              <div className="legend-grid">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ff0000' }}></div>
                  <div>
                    <strong>Blast Zones (Red)</strong>
                    <p>5 PSI: Complete destruction</p>
                    <p>3 PSI: Heavy damage</p>
                    <p>1 PSI: Moderate damage</p>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ff4500' }}></div>
                  <div>
                    <strong>Seismic Effects (Orange)</strong>
                    <p>Earthquake-like ground shaking</p>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#0077be' }}></div>
                  <div>
                    <strong>Tsunami (Blue)</strong>
                    <p>Wave propagation (oceanic impacts)</p>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ff6b35' }}></div>
                  <div>
                    <strong>Wildfire (Red-Orange)</strong>
                    <p>Thermal ignition zones</p>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#8b4513' }}></div>
                  <div>
                    <strong>Atmospheric (Brown)</strong>
                    <p>Climate effects (large impacts)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Understanding the Science */}
          <section className="help-section">
            <h2>📊 Understanding the Science</h2>
            <div className="help-card">
              <h3>Key Formulas</h3>
              <div className="formula-grid">
                <div className="formula-item">
                  <strong>Kinetic Energy</strong>
                  <code>E = ½mv²</code>
                  <p>Energy of impact</p>
                </div>
                <div className="formula-item">
                  <strong>TNT Equivalent</strong>
                  <code>TNT = E / 4.184×10⁹ J</code>
                  <p>Explosive power</p>
                </div>
                <div className="formula-item">
                  <strong>Crater Diameter</strong>
                  <code>D = k × ∛(m) × v^0.44</code>
                  <p>Schmidt-Holsapple scaling</p>
                </div>
                <div className="formula-item">
                  <strong>Seismic Magnitude</strong>
                  <code>Mw = log₁₀(ηs × E) - 4.8</code>
                  <p>Earthquake scale</p>
                </div>
                <div className="formula-item">
                  <strong>Tsunami Radius</strong>
                  <code>R = C × √(TNT/1000)</code>
                  <p>Wave propagation</p>
                </div>
              </div>
            </div>
            <div className="help-card">
              <h3>Data Sources</h3>
              <ul>
                <li><strong>NASA NeoWs API:</strong> Asteroid orbital data and close approaches</li>
                <li><strong>USGS:</strong> Seismic and terrain data</li>
                <li><strong>NOAA:</strong> Tsunami modeling and ocean data</li>
                <li><strong>CIESIN:</strong> Population density grids</li>
              </ul>
            </div>
          </section>

          {/* Tips & Best Practices */}
          <section className="help-section">
            <h2>💡 Tips & Best Practices</h2>
            <div className="help-cards">
              <div className="help-card tip-card">
                <h3>🎯 For Best Results</h3>
                <ul>
                  <li>Start with smaller asteroids to understand the mechanics</li>
                  <li>Compare different deflection strategies</li>
                  <li>Maximize lead time for higher success rates</li>
                  <li>Combine deflection with civil protection measures</li>
                </ul>
              </div>
              <div className="help-card tip-card">
                <h3>⚠️ Important Notes</h3>
                <ul>
                  <li>All calculations are based on scientific models</li>
                  <li>Real-world scenarios have additional uncertainties</li>
                  <li>Population estimates are approximate</li>
                  <li>Atmospheric effects only appear for large impacts (&gt;1 MT)</li>
                </ul>
              </div>
              <div className="help-card tip-card">
                <h3>🚀 Quick Navigation</h3>
                <ul>
                  <li>Use the footer to jump between sections</li>
                  <li>Back buttons return to previous pages</li>
                  <li>Game Mode has its own internal navigation</li>
                  <li>Help is always accessible from the footer</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Buttons */}
        <div className="help-footer">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
