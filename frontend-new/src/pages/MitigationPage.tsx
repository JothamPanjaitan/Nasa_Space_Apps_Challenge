import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SimulationEngine, type ImpactData } from '../services/simulationEngine';
import './MitigationPage.css';

interface MitigationStrategy {
  id: string;
  name: string;
  description: string;
  effectiveness: number; // 0-1
  cost: number; // USD
  timeRequired: number; // days
  risk: 'low' | 'medium' | 'high';
  icon: string;
}

const MITIGATION_STRATEGIES: MitigationStrategy[] = [
  {
    id: 'kinetic_impactor',
    name: 'Kinetic Impactor',
    description: 'High-speed spacecraft collision to alter asteroid trajectory',
    effectiveness: 0.8,
    cost: 500000000, // $500M
    timeRequired: 365,
    risk: 'medium',
    icon: '🚀'
  },
  {
    id: 'gravity_tractor',
    name: 'Gravity Tractor',
    description: 'Long-term gravitational influence to gradually deflect asteroid',
    effectiveness: 0.6,
    cost: 200000000, // $200M
    timeRequired: 1095, // 3 years
    risk: 'low',
    icon: '🛰️'
  },
  {
    id: 'nuclear_deflection',
    name: 'Nuclear Deflection',
    description: 'Nuclear explosion near asteroid to change its course',
    effectiveness: 0.9,
    cost: 1000000000, // $1B
    timeRequired: 180,
    risk: 'high',
    icon: '☢️'
  },
  {
    id: 'laser_ablation',
    name: 'Laser Ablation',
    description: 'Focused laser to vaporize surface material and create thrust',
    effectiveness: 0.4,
    cost: 100000000, // $100M
    timeRequired: 730,
    risk: 'low',
    icon: '🔴'
  },
  {
    id: 'solar_sail',
    name: 'Solar Sail',
    description: 'Large reflective sail to harness solar radiation pressure',
    effectiveness: 0.3,
    cost: 50000000, // $50M
    timeRequired: 1460, // 4 years
    risk: 'low',
    icon: '⛵'
  }
];

export default function MitigationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state: any = location.state ?? {};
  const impactData: ImpactData | null = state.impactData ?? null;
  const params: any = state.params ?? null;

  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showEmergencyPlan, setShowEmergencyPlan] = useState(false);

  // Calculate deflection parameters for selected strategies
  const deflectionResults = useMemo(() => {
    if (!impactData || !params || selectedStrategies.length === 0) return [];

    const asteroidMass = (4/3) * Math.PI * Math.pow(params.size, 3) * (params.density || 2600);
    const timeToImpact = params.timeToImpact || 365;

    return selectedStrategies.map(strategyId => {
      const strategy = MITIGATION_STRATEGIES.find(s => s.id === strategyId);
      if (!strategy) return null;

      const deltaV = strategy.effectiveness * 0.1; // m/s
      const deflection = SimulationEngine.calculateDeflectionParameters(asteroidMass, deltaV, timeToImpact);

      return {
        strategy,
        deflection,
        success: deflection.deflectionDistance > 1000 // 1km minimum deflection
      };
    }).filter(Boolean);
  }, [impactData, params, selectedStrategies]);

  const environmentalEffects = useMemo(() => {
    if (!impactData) return null;
    return SimulationEngine.calculateEnvironmentalEffects(impactData.energy);
  }, [impactData]);

  const handleStrategyToggle = (strategyId: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId) 
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Simulate delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = {
      strategies: deflectionResults,
      environmental: environmentalEffects,
      totalCost: selectedStrategies.reduce((sum, id) => {
        const strategy = MITIGATION_STRATEGIES.find(s => s.id === id);
        return sum + (strategy?.cost || 0);
      }, 0),
      successProbability: selectedStrategies.length > 0 ? 0.85 : 0,
      timeToImplement: Math.max(...selectedStrategies.map(id => {
        const strategy = MITIGATION_STRATEGIES.find(s => s.id === id);
        return strategy?.timeRequired || 0;
      }))
    };
    
    setSimulationResults(results);
    setIsSimulating(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'var(--success)';
      case 'medium': return 'var(--warning)';
      case 'high': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(0)}M`;
    return `$${amount.toLocaleString()}`;
  };

  const handleCompareStrategies = () => {
    setShowComparison(!showComparison);
  };

  const handleImplementStrategies = () => {
    if (selectedStrategies.length === 0) {
      alert('Please select at least one strategy to implement.');
      return;
    }
    
    // Navigate to game mode with selected strategies
    navigate('/game', {
      state: {
        strategies: selectedStrategies,
        impactData,
        params
      }
    });
  };

  const handleEmergencyResponse = () => {
    setShowEmergencyPlan(!showEmergencyPlan);
  };

  return (
    <div className="page-container mitigation-page">
      <header className="page-header">
        <h1>🛡️ Mitigation & Response Strategies</h1>
        <p>Select and compare different asteroid deflection strategies to prevent impact.</p>
      </header>

      <div className="mitigation-content">
        {/* Impact Summary */}
        {impactData && (
          <section className="impact-summary">
            <h2>Impact Scenario</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Energy:</span>
                <span className="value">{(impactData.energy / 1e15).toFixed(2)} PJ</span>
              </div>
              <div className="summary-item">
                <span className="label">TNT Equivalent:</span>
                <span className="value">{(impactData.tntEquivalent / 1e6).toFixed(2)} MT</span>
              </div>
              <div className="summary-item">
                <span className="label">Blast Radius:</span>
                <span className="value">{impactData.blastRadius.toFixed(0)} km</span>
              </div>
              <div className="summary-item">
                <span className="label">Impact Location:</span>
                <span className="value">{impactData.impactLocation.lat.toFixed(1)}°, {impactData.impactLocation.lng.toFixed(1)}°</span>
              </div>
            </div>
          </section>
        )}

        <div className="mitigation-layout">
          {/* Strategy Selection */}
          <section className="strategy-selection">
            <h2>Deflection Strategies</h2>
            <div className="strategies-grid">
              {MITIGATION_STRATEGIES.map(strategy => (
                <div 
                  key={strategy.id}
                  className={`strategy-card ${selectedStrategies.includes(strategy.id) ? 'selected' : ''}`}
                  onClick={() => handleStrategyToggle(strategy.id)}
                >
                  <div className="strategy-header">
                    <span className="strategy-icon">{strategy.icon}</span>
                    <h3>{strategy.name}</h3>
                    <div className="strategy-risk" style={{ color: getRiskColor(strategy.risk) }}>
                      {strategy.risk.toUpperCase()} RISK
                    </div>
                  </div>
                  <p className="strategy-description">{strategy.description}</p>
                  <div className="strategy-stats">
                    <div className="stat">
                      <span className="stat-label">Effectiveness:</span>
                      <span className="stat-value">{(strategy.effectiveness * 100).toFixed(0)}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Cost:</span>
                      <span className="stat-value">{formatCurrency(strategy.cost)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Time:</span>
                      <span className="stat-value">{strategy.timeRequired} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Simulation Results */}
          <section className="simulation-results">
            <h2>Simulation Results</h2>
            
            {selectedStrategies.length > 0 && (
              <div className="selected-strategies">
                <h3>Selected Strategies ({selectedStrategies.length})</h3>
                <div className="selected-list">
                  {selectedStrategies.map(id => {
                    const strategy = MITIGATION_STRATEGIES.find(s => s.id === id);
                    return strategy ? (
                      <div key={id} className="selected-item">
                        <span>{strategy.icon} {strategy.name}</span>
                        <button 
                          onClick={() => handleStrategyToggle(id)}
                          className="remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="simulation-controls">
              <button 
                className="btn btn-primary"
                onClick={runSimulation}
                disabled={isSimulating || selectedStrategies.length === 0}
              >
                {isSimulating ? '🎬 Running Simulation...' : '🚀 Run Deflection Simulation'}
              </button>
            </div>

            {simulationResults && (
              <div className="results-display">
                <h3>Simulation Results</h3>
                <div className="results-grid">
                  <div className="result-item">
                    <span className="result-label">Success Probability:</span>
                    <span className="result-value success">
                      {(simulationResults.successProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Total Cost:</span>
                    <span className="result-value">
                      {formatCurrency(simulationResults.totalCost)}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Implementation Time:</span>
                    <span className="result-value">
                      {Math.ceil(simulationResults.timeToImplement / 365)} years
                    </span>
                  </div>
                </div>

                {environmentalEffects && (
                  <div className="environmental-effects">
                    <h4>Environmental Impact</h4>
                    <div className="effects-grid">
                      <div className="effect-item">
                        <span>Temperature Drop:</span>
                        <span>{environmentalEffects.temperatureDrop.toFixed(1)}°C</span>
                      </div>
                      <div className="effect-item">
                        <span>Sunlight Reduction:</span>
                        <span>{environmentalEffects.sunlightReduction.toFixed(1)}%</span>
                      </div>
                      <div className="effect-item">
                        <span>Climate Impact:</span>
                        <span className={`impact-${environmentalEffects.climateImpact}`}>
                          {environmentalEffects.climateImpact.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Strategy Comparison */}
        {showComparison && selectedStrategies.length > 0 && (
          <section className="strategy-comparison">
            <h2>📊 Strategy Comparison</h2>
            <div className="comparison-table">
              <div className="comparison-header">
                <div>Strategy</div>
                <div>Effectiveness</div>
                <div>Cost</div>
                <div>Time</div>
                <div>Risk</div>
              </div>
              {selectedStrategies.map(id => {
                const strategy = MITIGATION_STRATEGIES.find(s => s.id === id);
                return strategy ? (
                  <div key={id} className="comparison-row">
                    <div>{strategy.icon} {strategy.name}</div>
                    <div>{(strategy.effectiveness * 100).toFixed(0)}%</div>
                    <div>{formatCurrency(strategy.cost)}</div>
                    <div>{strategy.timeRequired} days</div>
                    <div className={`risk-${strategy.risk}`}>{strategy.risk}</div>
                  </div>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Emergency Response Plan */}
        {showEmergencyPlan && (
          <section className="emergency-plan">
            <h2>🆘 Emergency Response Plan</h2>
            <div className="emergency-content">
              <div className="emergency-phase">
                <h3>⚡ Immediate Response (0-24 hours)</h3>
                <ul>
                  <li>Activate global early warning systems</li>
                  <li>Issue public emergency broadcasts</li>
                  <li>Begin evacuation of high-risk areas</li>
                  <li>Mobilize international space agencies</li>
                </ul>
              </div>
              <div className="emergency-phase">
                <h3>🚀 Short-term Actions (1-30 days)</h3>
                <ul>
                  <li>Deploy emergency deflection missions</li>
                  <li>Establish refugee support centers</li>
                  <li>Coordinate international relief efforts</li>
                  <li>Prepare medical and rescue teams</li>
                </ul>
              </div>
              <div className="emergency-phase">
                <h3>🛡️ Long-term Recovery (30+ days)</h3>
                <ul>
                  <li>Assess and repair infrastructure damage</li>
                  <li>Provide ongoing humanitarian aid</li>
                  <li>Implement economic recovery programs</li>
                  <li>Review and improve planetary defense</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn btn-secondary"
            onClick={handleCompareStrategies}
            disabled={selectedStrategies.length === 0}
          >
            📊 {showComparison ? 'Hide' : 'Compare'} Strategies
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleImplementStrategies}
            disabled={selectedStrategies.length === 0}
          >
            🚀 Implement Selected Strategies
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleEmergencyResponse}
          >
            🆘 {showEmergencyPlan ? 'Hide' : 'Show'} Emergency Response Plan
          </button>
        </div>
      </div>
    </div>
  );
}
