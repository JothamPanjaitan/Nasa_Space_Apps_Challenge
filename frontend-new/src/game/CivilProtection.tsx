import React, { useState } from 'react';
import './CivilProtection.css';

interface CivilProtectionProps {
  impactData: any;
  asteroidParams: any;
  onComplete: (score: any) => void;
}

interface MitigationScore {
  livesSaved: number;
  economicImpactReduced: number;
  infrastructureDamageReduced: number;
  evacuationEfficiency: number;
  responseCoordination: number;
}

export default function CivilProtection({ impactData, asteroidParams, onComplete }: CivilProtectionProps) {
  const [evacuationPercent, setEvacuationPercent] = useState(20);
  const [shelterCapacity, setShelterCapacity] = useState(30);
  const [infrastructureHardening, setInfrastructureHardening] = useState(15);
  const [warningSystem, setWarningSystem] = useState(80);
  const [medicalSurgeCapacity, setMedicalSurgeCapacity] = useState(25);

  // Calculate mitigation effectiveness
  const calculateMitigationScore = (): MitigationScore => {
    const baseCasualties = Math.max(10000, Math.round(
      (impactData?.blastRadius || 10) * (asteroidParams?.size || 50) * 500
    ));
    
    // Evacuation effectiveness
    const evacuationFactor = evacuationPercent / 100;
    const livesSavedFromEvacuation = Math.round(baseCasualties * evacuationFactor * 0.8);
    
    // Shelter effectiveness
    const shelterFactor = shelterCapacity / 100;
    const livesSavedFromShelters = Math.round(baseCasualties * (1 - evacuationFactor) * shelterFactor * 0.6);
    
    // Infrastructure hardening
    const hardeningFactor = infrastructureHardening / 100;
    const infrastructureDamageReduced = Math.round(baseCasualties * 0.3 * hardeningFactor);
    
    // Warning system effectiveness
    const warningFactor = warningSystem / 100;
    const livesSavedFromWarning = Math.round(baseCasualties * warningFactor * 0.2);
    
    // Medical surge capacity
    const medicalFactor = medicalSurgeCapacity / 100;
    const livesSavedFromMedical = Math.round((baseCasualties - livesSavedFromEvacuation - livesSavedFromShelters) * medicalFactor * 0.4);
    
    const totalLivesSaved = livesSavedFromEvacuation + livesSavedFromShelters + livesSavedFromWarning + livesSavedFromMedical;
    
    // Economic impact (simplified)
    const baseEconomicLoss = baseCasualties * 1000000; // $1M per casualty average
    const economicImpactReduced = Math.round(baseEconomicLoss * (evacuationFactor + hardeningFactor) * 0.3);
    
    return {
      livesSaved: totalLivesSaved,
      economicImpactReduced: economicImpactReduced,
      infrastructureDamageReduced: infrastructureDamageReduced,
      evacuationEfficiency: Math.round(evacuationFactor * 100),
      responseCoordination: Math.round((warningFactor + (shelterCapacity + medicalSurgeCapacity) / 2) * 0.5 * 100)
    };
  };

  const applyMitigation = () => {
    const score = calculateMitigationScore();
    onComplete(score);
  };

  const score = calculateMitigationScore();

  return (
    <div className="civil-protection">
      <div className="space-background">
        <div className="stars">
          {Array.from({ length: 200 }, (_, i) => (
            <div key={i} className={`star star-${i % 3}`}></div>
          ))}
        </div>
        
        {/* Earth with impact indicators */}
        <div className="earth-with-impact">
          <div className="earth-glow">
            <div className="earth-surface"></div>
          </div>
          <div className="impact-effects">
            <div className="blast-ring"></div>
            <div className="thermal-ring"></div>
            <div className="seismic-ring"></div>
          </div>
        </div>
      </div>

      <div className="civil-protection-content">
        <div className="header-section">
          <h1>🛡️ Civil Protection & Mitigation</h1>
          <div className="impact-summary">
            <h3>Asteroid Impact Forecast</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Size:</span>
                <span className="value">{asteroidParams?.size?.toFixed(0)}m radius</span>
              </div>
              <div className="summary-item">
                <span className="label">Velocity:</span>
                <span className="value">{asteroidParams?.velocity?.toFixed(0)} km/s</span>
              </div>
              <div className="summary-item">
                <span className="label">Blast Radius:</span>
                <span className="value">{impactData?.blastRadius?.toFixed(0)} km</span>
              </div>
              <div className="summary-item">
                <span className="label">Impact Energy:</span>
                <span className="value">{(impactData?.energy / 1e15).toFixed(2)} PJ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mitigation-interface">
          <div className="control-panels">
            
            {/* Evacuation Control */}
            <div className="control-panel evacuation-panel">
              <h3>🚨 Evacuation Planning</h3>
              <div className="control-group">
                <label htmlFor="evacuation-slider">
                  Population Evacuation: {evacuationPercent}%
                </label>
                <input
                  id="evacuation-slider"
                  type="range"
                  min="0"
                  max="90"
                  value={evacuationPercent}
                  onChange={(e) => setEvacuationPercent(parseInt(e.target.value))}
                  className="slider evacuation-slider"
                />
                <div className="slider-info">
                  <span>No Evacuation</span>
                  <span>Maximum Evacuation</span>
                </div>
              </div>
              <div className="effectiveness-bar">
                <div className="effectiveness-label">Evacuation Effectiveness</div>
                <div className="effectiveness-meter">
                  <div 
                    className="effectiveness-fill evacuation-fill"
                    style={{ width: `${evacuationPercent}%` }}
                  ></div>
                </div>
                <span className="metrics">{Math.round(score.livesSaved * (evacuationPercent / 100))} lives saved</span>
              </div>
            </div>

            {/* Shelter & Healthcare */}
            <div className="control-panel shelter-panel">
              <h3>🏥 Emergency Shelters & Healthcare</h3>
              
              <div className="sub-control-group">
                <label>Emergency Shelter Capacity: {shelterCapacity}%</label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={shelterCapacity}
                  onChange={(e) => setShelterCapacity(parseInt(e.target.value))}
                  className="slider shelter-slider"
                />
                
                <label>Medical Surge Capacity: {medicalSurgeCapacity}%</label>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={medicalSurgeCapacity}
                  onChange={(e) => setMedicalSurgeCapacity(parseInt(e.target.value))}
                  className="slider medical-slider"
                />
              </div>
              
              <div className="effectiveness-bar">
                <span className="metrics">
                  Shelter Factor: {shelterCapacity}% | Medical Factor: {medicalSurgeCapacity}%
                </span>
              </div>
            </div>

            {/* Infrastructure Hardening */}
            <div className="control-panel infrastructure-panel">
              <h3>🏗️ Infrastructure Hardening</h3>
              <div className="control-group">
                <label htmlFor="infrastructure-slider">
                  Infrastructure Protection: {infrastructureHardening}%
                </label>
                <input
                  id="infrastructure-slider"
                  type="range"
                  min="5"
                  max="60"
                  value={infrastructureHardening}
                  onChange={(e) => setInfrastructureHardening(parseInt(e.target.value))}
                  className="slider infrastructure-slider"
                />
                <div className="hardening-types">
                  <div className="hardening-item earthquake">
                    Earthquake Resistance: {Math.round(infrastructureHardening * 0.8)}%
                  </div>
                  <div className="hardening-item blast">
                    Blast Resistance: {Math.round(infrastructureHardening * 0.6)}%
                  </div>
                  <div className="hardening-item thermal">
                    Fire Resistance: {Math.round(infrastructureHardening * 0.7)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Systems */}
            <div className="control-panel warning-panel">
              <h3>📡 Early Warning Systems</h3>
              <div className="control-group">
                <label htmlFor="warning-slider">
                  Warning Effectiveness: {warningSystem}%
                </label>
                <input
                  id="warning-slider"
                  type="range"
                  min="60"
                  max="95"
                  value={warningSystem}
                  onChange={(e) => setWarningSystem(parseInt(e.target.value))}
                  className="slider warning-slider"
                />
                <div className="warning-components">
                  <div className="warning-item">
                    Alert Broadcasting: {warningSystem}%
                  </div>
                  <div className="warning-item">
                    Public Education: {Math.round(warningSystem * 0.9)}%
                  </div>
                  <div className="warning-item">
                    Response Coordination: {Math.round(warningSystem * 0.7)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Score */}
          <div className="score-dashboard">
            <h3>📊 Mitigation Impact Dashboard</h3>
            <div className="score-grid">
              <div className="score-item lives">
                <div className="score-icon">🫀</div>
                <div className="score-details">
                  <span className="score-label">Lives Saved</span>
                  <span className="score-value">{score.livesSaved.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="score-item economic">
                <div className="score-icon">💰</div>
                <div className="score-details">
                  <span className="score-label">Economic Loss Prevented</span>
                  <span className="score-value">${(score.economicImpactReduced / 1e9).toFixed(1)}B</span>
                </div>
              </div>
              
              <div className="score-item infrastructure">
                <div className="score-icon">🏗️</div>
                <div className="score-details">
                  <span className="score-label">Infrastructure Damage Reduced</span>
                  <span className="score-value">{score.infrastructureDamageReduced.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="score-item coordination">
                <div className="score-icon">🤝</div>
                <div className="score-details">
                  <span className="score-label">Response Coordination</span>
                  <span className="score-value">{score.responseCoordination}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="apply-mitigation-btn"
              onClick={applyMitigation}
            >
              🛡️ Apply Mitigation Measures
            </button>
            
            <div className="mitigation-tips">
              <h4>💡 Mitigation Strategies</h4>
              <ul>
                <li><strong>Early Evacuation:</strong> Getting people out early saves the most lives</li>
                <li><strong>Shelter Networks:</strong> Underground shelters protect against blast waves</li>
                <li><strong>Infrastructure Hardening:</strong> Earthquake codes prevent structural collapse</li>
                <li><strong>Warning Systems:</strong> Public alerts enable faster response times</li>
                <li><strong>Medical Surge:</strong> Extra hospital capacity treats more survivors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
