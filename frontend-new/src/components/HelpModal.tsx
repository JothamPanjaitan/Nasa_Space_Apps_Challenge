import React, { useState } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: string;
}

export default function HelpModal({ isOpen, onClose, currentState }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const getHelpContent = () => {
    const helpSections = {
      overview: {
        title: '🌌 Meteor Madness - Defend Earth',
        content: (
          <div className="help-content">
            <h3>Welcome to the Asteroid Impact Simulation</h3>
            <p>This interactive tool helps you understand asteroid threats and explore mitigation strategies using real NASA and USGS data.</p>
            
            <h4>🎯 Your Mission</h4>
            <ul>
              <li><strong>Study:</strong> Analyze asteroid parameters and orbital mechanics</li>
              <li><strong>Simulate:</strong> Model impact scenarios and consequences</li>
              <li><strong>Defend:</strong> Test deflection strategies</li>
              <li><strong>Protect:</strong> Plan civil defense measures</li>
            </ul>

            <h4>🔬 Scientific Accuracy</h4>
            <p>This simulation uses real data from:</p>
            <ul>
              <li>NASA Near-Earth Object API</li>
              <li>USGS Seismic and Tsunami Data</li>
              <li>NOAA Climate and Ocean Data</li>
              <li>Population and Economic Datasets</li>
            </ul>
          </div>
        )
      },
      simulator: {
        title: '🌌 Orbital Simulator',
        content: (
          <div className="help-content">
            <h3>Understanding Orbital Mechanics</h3>
            <p>Use the simulator to study asteroid trajectories and understand how orbital elements affect impact probability.</p>
            
            <h4>🎛️ Controls</h4>
            <ul>
              <li><strong>Size Slider:</strong> Adjust asteroid diameter (10m - 1000m)</li>
              <li><strong>Velocity Slider:</strong> Set approach speed (5-50 km/s)</li>
              <li><strong>Density:</strong> Choose composition (stony, metallic, icy)</li>
              <li><strong>Impact Angle:</strong> Set approach angle (0-90°)</li>
            </ul>

            <h4>📊 Visualizations</h4>
            <ul>
              <li><strong>3D Globe:</strong> Interactive Earth with orbital paths</li>
              <li><strong>Trajectory Lines:</strong> Asteroid path visualization</li>
              <li><strong>Impact Zones:</strong> Potential collision areas</li>
              <li><strong>Energy Display:</strong> Kinetic energy calculations</li>
            </ul>

            <h4>🔬 Physics Concepts</h4>
            <ul>
              <li><strong>Keplerian Elements:</strong> Orbital parameters (a, e, i, Ω, ω, M)</li>
              <li><strong>Kinetic Energy:</strong> E = ½mv² (mass × velocity²)</li>
              <li><strong>Impact Probability:</strong> Based on orbital uncertainty</li>
              <li><strong>Deflection Requirements:</strong> Δv needed to avoid collision</li>
            </ul>
          </div>
        )
      },
      impact_map: {
        title: '💥 Impact Analysis',
        content: (
          <div className="help-content">
            <h3>Impact Effects Visualization</h3>
            <p>Explore the consequences of asteroid impacts using scientific models and real environmental data.</p>
            
            <h4>🗺️ Map Layers</h4>
            <ul>
              <li><strong>Direct Effects:</strong> Blast, thermal, seismic zones</li>
              <li><strong>Tsunami Zones:</strong> Ocean impact flooding areas</li>
              <li><strong>Indirect Effects:</strong> Economic, environmental, health impacts</li>
              <li><strong>Population Density:</strong> Casualty estimation overlays</li>
            </ul>

            <h4>📊 Impact Calculations</h4>
            <ul>
              <li><strong>Crater Size:</strong> Using Schmidt-Holsapple scaling</li>
              <li><strong>Blast Radius:</strong> Overpressure damage zones</li>
              <li><strong>Seismic Magnitude:</strong> Equivalent earthquake strength</li>
              <li><strong>Tsunami Height:</strong> Wave generation and propagation</li>
            </ul>

            <h4>🌍 Environmental Effects</h4>
            <ul>
              <li><strong>Atmospheric:</strong> Dust injection, climate cooling</li>
              <li><strong>Firestorms:</strong> Thermal radiation ignition</li>
              <li><strong>Biodiversity:</strong> Habitat destruction assessment</li>
              <li><strong>Economic:</strong> Infrastructure and GDP losses</li>
            </ul>
          </div>
        )
      },
      deflection: {
        title: '🚀 Deflection Mission',
        content: (
          <div className="help-content">
            <h3>Defending Earth from Asteroid Threats</h3>
            <p>Test different deflection strategies to prevent asteroid impacts using real NASA mission parameters.</p>
            
            <h4>🛠️ Deflection Methods</h4>
            <ul>
              <li><strong>Kinetic Impactor:</strong> High-speed collision to change velocity</li>
              <li><strong>Gravity Tractor:</strong> Gravitational pull over time</li>
              <li><strong>Nuclear Option:</strong> Explosive deflection (last resort)</li>
              <li><strong>Laser Ablation:</strong> Vaporize surface material</li>
            </ul>

            <h4>⚙️ Mission Parameters</h4>
            <ul>
              <li><strong>Lead Time:</strong> Years before impact</li>
              <li><strong>Deflection Force:</strong> Impulse required</li>
              <li><strong>Success Probability:</strong> Based on uncertainty</li>
              <li><strong>Cost Analysis:</strong> Mission budget requirements</li>
            </ul>

            <h4>🎯 Success Factors</h4>
            <ul>
              <li><strong>Early Detection:</strong> More time = better success</li>
              <li><strong>Size Matters:</strong> Larger asteroids need more force</li>
              <li><strong>Orbital Uncertainty:</strong> Affects targeting precision</li>
              <li><strong>International Cooperation:</strong> Global coordination needed</li>
            </ul>
          </div>
        )
      },
      civil_protection: {
        title: '🛡️ Civil Protection',
        content: (
          <div className="help-content">
            <h3>Preparing for Impact</h3>
            <p>Even if deflection fails, proper preparation can save lives and reduce damage.</p>
            
            <h4>🏗️ Infrastructure Hardening</h4>
            <ul>
              <li><strong>Buildings:</strong> Earthquake-resistant construction</li>
              <li><strong>Bridges:</strong> Seismic retrofit programs</li>
              <li><strong>Power Grid:</strong> Redundant systems and backup</li>
              <li><strong>Communication:</strong> Emergency broadcast systems</li>
            </ul>

            <h4>🚨 Emergency Response</h4>
            <ul>
              <li><strong>Evacuation Plans:</strong> Coordinated mass evacuation</li>
              <li><strong>Shelter Systems:</strong> Underground protection</li>
              <li><strong>Medical Surge:</strong> Hospital capacity expansion</li>
              <li><strong>Supply Chains:</strong> Emergency resource stockpiling</li>
            </ul>

            <h4>🌍 Global Coordination</h4>
            <ul>
              <li><strong>International Cooperation:</strong> Cross-border response</li>
              <li><strong>Resource Sharing:</strong> Aid and assistance networks</li>
              <li><strong>Information Systems:</strong> Real-time coordination</li>
              <li><strong>Recovery Planning:</strong> Post-impact reconstruction</li>
            </ul>
          </div>
        )
      }
    };

    return helpSections[currentState as keyof typeof helpSections] || helpSections.overview;
  };

  const helpContent = getHelpContent();

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-header">
          <h2>{helpContent.title}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="help-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'controls' ? 'active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            Controls
          </button>
          <button 
            className={`tab-button ${activeTab === 'science' ? 'active' : ''}`}
            onClick={() => setActiveTab('science')}
          >
            Science
          </button>
        </div>

        <div className="help-body">
          {activeTab === 'overview' && helpContent.content}
          {activeTab === 'controls' && (
            <div className="help-content">
              <h3>🎮 Navigation Controls</h3>
              <ul>
                <li><strong>Mouse:</strong> Click and drag to rotate 3D views</li>
                <li><strong>Scroll:</strong> Zoom in/out on maps and globes</li>
                <li><strong>Keyboard:</strong> Use arrow keys for fine adjustments</li>
                <li><strong>Touch:</strong> Pinch to zoom, drag to pan on mobile</li>
              </ul>
              
              <h3>⌨️ Keyboard Shortcuts</h3>
              <ul>
                <li><strong>H:</strong> Toggle this help modal</li>
                <li><strong>Space:</strong> Pause/resume animations</li>
                <li><strong>R:</strong> Reset to default view</li>
                <li><strong>F:</strong> Fullscreen mode</li>
              </ul>
            </div>
          )}
          {activeTab === 'science' && (
            <div className="help-content">
              <h3>🔬 Scientific Background</h3>
              <p>This simulation is based on real scientific research and uses established models for asteroid impact effects.</p>
              
              <h4>📚 Key References</h4>
              <ul>
                <li>NASA Near-Earth Object Program</li>
                <li>USGS Earthquake and Tsunami Research</li>
                <li>Schmidt-Holsapple Crater Scaling Laws</li>
                <li>Nuclear Blast Effect Models</li>
                <li>Orbital Mechanics (Kepler, Newton)</li>
              </ul>

              <h4>⚠️ Limitations</h4>
              <p>This is an educational tool. Real asteroid impact modeling requires:</p>
              <ul>
                <li>High-precision orbital calculations</li>
                <li>Complex atmospheric entry modeling</li>
                <li>Detailed geological and geographical data</li>
                <li>Advanced computational resources</li>
              </ul>
            </div>
          )}
        </div>

        <div className="help-footer">
          <button className="help-button" onClick={onClose}>
            Got it! Let's continue
          </button>
        </div>
      </div>
    </div>
  );
}
