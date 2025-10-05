import React, { useMemo, useState } from 'react';
import { ImpactData, Mode, MitigationStrategy } from '../types/impact';
import Tooltip from './Tooltip';
import ImpactCatastropheChart from './ImpactCatastropheChart';
import './ImpactControls.css';

interface ImpactControlsProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  neoList: ImpactData[];
  selected?: ImpactData | null;
  working?: ImpactData | null;
  onSelect?: (id: string) => void;
  onApplyMitigation?: (neoId: string, strategyId: string, params: any) => void;
  loading?: boolean;
  error?: string | null;
}

const mitigationStrategies: MitigationStrategy[] = [
  {
    id: 'kinetic',
    name: 'Kinetic Impactor',
    type: 'kinetic',
    effectiveness: 0.8,
    leadTimeRequired: 180,
    cost: 'medium',
    description: 'Direct spacecraft impact to change asteroid velocity',
    pros: ['High effectiveness', 'Proven technology (DART)', 'Fast implementation'],
    cons: ['Requires precise targeting', 'Limited deflection amount']
  },
  {
    id: 'gravity',
    name: 'Gravity Tractor',
    type: 'gravity',
    effectiveness: 0.6,
    leadTimeRequired: 365,
    cost: 'high',
    description: 'Use spacecraft gravity to slowly pull asteroid off course',
    pros: ['Very gentle', 'No debris', 'Works on any size'],
    cons: ['Very slow', 'Requires long lead time', 'High fuel consumption']
  },
  {
    id: 'nuclear',
    name: 'Nuclear Deflection',
    type: 'nuclear',
    effectiveness: 1.0,
    leadTimeRequired: 90,
    cost: 'low',
    description: 'Nuclear explosive device to deflect asteroid',
    pros: ['Highest effectiveness', 'Works on large objects', 'Quick results'],
    cons: ['Political concerns', 'Debris creation', 'Environmental impact']
  }
];

const IMPACT_REGIONS = [
  { id: 'north_america', label: 'North America', lat: 40.7128, lng: -74.0060 },
  { id: 'europe', label: 'Europe', lat: 48.8566, lng: 2.3522 },
  { id: 'asia', label: 'Asia', lat: 35.6762, lng: 139.6503 },
  { id: 'africa', label: 'Africa', lat: -1.2921, lng: 36.8219 },
  { id: 'south_america', label: 'South America', lat: -23.5505, lng: -46.6333 },
  { id: 'oceania', label: 'Oceania', lat: -33.8688, lng: 151.2093 },
  { id: 'pacific_ocean', label: 'Pacific Ocean', lat: 0.0, lng: -160.0 },
  { id: 'atlantic_ocean', label: 'Atlantic Ocean', lat: 20.0, lng: -30.0 },
];

export default function ImpactControls({
  mode,
  setMode,
  neoList,
  selected,
  working,
  onSelect,
  onApplyMitigation,
  loading,
  error
}: ImpactControlsProps) {
  const [strategy, setStrategy] = useState<'kinetic' | 'gravity' | 'nuclear'>('kinetic');
  const [dv, setDv] = useState(0.5); // m/s
  const [lead, setLead] = useState(365); // days
  const [impactRegion, setImpactRegion] = useState('north_america');

  const current = working ?? selected ?? null;
  const selectedStrategy = mitigationStrategies.find(s => s.id === strategy);

  const stats = useMemo(() => {
    if (!current) return [];
    
    return [
      { k: 'Energy (PJ)', v: current.kineticEnergyJ ? (current.kineticEnergyJ / 1e15).toFixed(2) : '0.00' },
      { k: 'TNT (MT)', v: current.tntEquivalentTons ? (current.tntEquivalentTons / 1e6).toFixed(2) : '0.00' },
      { k: 'Crater (km)', v: current.craterDiameterKm ? current.craterDiameterKm.toFixed(2) : '0.00' },
      { k: 'Seismic Mw', v: current.seismicMagnitude ? current.seismicMagnitude.toFixed(2) : 'N/A' },
    ];
  }, [current]);

  const mitigationDelta = useMemo(() => {
    if (!selected || !working) return null;
    
    const energyReduction = selected.kineticEnergyJ && working.kineticEnergyJ ? 
      ((selected.kineticEnergyJ - working.kineticEnergyJ) / selected.kineticEnergyJ) * 100 : 0;
    
    const tntReduction = selected.tntEquivalentTons && working.tntEquivalentTons ? 
      ((selected.tntEquivalentTons - working.tntEquivalentTons) / selected.tntEquivalentTons) * 100 : 0;
    
    return {
      energyReduction: energyReduction.toFixed(1),
      tntReduction: tntReduction.toFixed(1),
      velocityChange: ((selected.velocityKms - working.velocityKms) / selected.velocityKms * 100).toFixed(1)
    };
  }, [selected, working]);

  const handleApplyMitigation = () => {
    if (!selected || !onApplyMitigation) return;
    
    onApplyMitigation(selected.id, strategy, { dv, lead });
  };

  const handleReset = () => {
    if (!selected || !onApplyMitigation) return;
    
    onApplyMitigation(selected.id, 'reset', {});
    setDv(0.5);
    setLead(365);
  };

  return (
    <aside className="impact-controls">
      <div className="controls-header">
        <h2>🎯 Impact Analysis</h2>
        <div className="mode-selector">
          <label>
            Mode:
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value as Mode)}
              className="mode-select"
            >
              <option value="simulator">🔬 Simulator</option>
              <option value="game">🎮 Game Mode</option>
            </select>
          </label>
        </div>
      </div>

      <div className="neo-selector">
        <label>
          <strong>Near-Earth Object:</strong>
          <select 
            value={selected?.id ?? ''} 
            onChange={e => onSelect && onSelect(e.target.value)}
            className="neo-select"
            disabled={loading}
          >
            <option value="">— Select NEO —</option>
            {neoList.map(neo => (
              <option key={neo.id} value={neo.id}>
                {neo.name} ({neo.velocityKms?.toFixed(1)} km/s)
              </option>
            ))}
          </select>
        </label>
        
        {loading && (
          <div className="loading-indicator">
            <span>🔄 Loading NASA data...</span>
          </div>
        )}
        
        {error && (
          <div className="error-indicator">
            <span>⚠️ {error}</span>
          </div>
        )}
      </div>

      {/* Impact Region Selector */}
      <div className="region-selector">
        <label>
          <strong>Impact Region:</strong>
          <select 
            value={impactRegion} 
            onChange={e => setImpactRegion(e.target.value)}
            className="region-select"
          >
            {IMPACT_REGIONS.map(region => (
              <option key={region.id} value={region.id}>
                {region.label}
              </option>
            ))}
          </select>
        </label>
        <p className="region-info">
          📍 {IMPACT_REGIONS.find(r => r.id === impactRegion)?.lat.toFixed(2)}°, {IMPACT_REGIONS.find(r => r.id === impactRegion)?.lng.toFixed(2)}°
        </p>
      </div>

      {mode === 'game' && (
        <div className="mitigation-section">
          <h3>🚀 Deflection Mission</h3>
          
          <div className="strategy-selection">
            <h4>Mitigation Strategy</h4>
            <div className="strategy-options">
              {mitigationStrategies.map(strat => (
                <div 
                  key={strat.id}
                  className={`strategy-card ${strategy === strat.id ? 'selected' : ''}`}
                  onClick={() => setStrategy(strat.id as any)}
                >
                  <div className="strategy-header">
                    <h5>{strat.name}</h5>
                    <span className={`effectiveness-badge ${strat.type}`}>
                      {(strat.effectiveness * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="strategy-description">{strat.description}</p>
                  <div className="strategy-meta">
                    <span className="lead-time">⏱️ {strat.leadTimeRequired} days</span>
                    <span className={`cost ${strat.cost}`}>💰 {strat.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="parameter-controls">
            <div className="control-group">
              <label>
                <strong>Delta-V (m/s):</strong>
                <span className="value-display">{dv.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={50}
                step={0.1}
                value={dv}
                onChange={e => setDv(parseFloat(e.target.value))}
                className="parameter-slider"
              />
              <div className="slider-labels">
                <span>0</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            <div className="control-group">
              <label>
                <strong>Lead Time (days):</strong>
                <span className="value-display">{lead}</span>
              </label>
              <input
                type="range"
                min={1}
                max={3650}
                step={1}
                value={lead}
                onChange={e => setLead(parseInt(e.target.value))}
                className="parameter-slider"
              />
              <div className="slider-labels">
                <span>1 day</span>
                <span>1 year</span>
                <span>10 years</span>
              </div>
            </div>
          </div>

          <div className="mission-actions">
            <Tooltip 
              content="Apply the selected mitigation strategy to modify the asteroid's trajectory and reduce impact energy. This will recalculate all impact effects with the new parameters."
              position="top"
              delay={300}
            >
              <button 
                className="apply-button primary"
                onClick={handleApplyMitigation}
                disabled={!selected}
              >
                🚀 Apply Selected Strategies
              </button>
            </Tooltip>
            
            {working && (
              <Tooltip 
                content="Reset the asteroid back to its original parameters, removing all applied mitigation strategies."
                position="top"
                delay={300}
              >
                <button 
                  className="reset-button secondary"
                  onClick={handleReset}
                >
                  🔄 Reset
                </button>
              </Tooltip>
            )}
          </div>

          {selectedStrategy && (
            <div className="strategy-details">
              <h4>Strategy Analysis</h4>
              <div className="analysis-grid">
                <div className="pros">
                  <h5>✅ Advantages</h5>
                  <ul>
                    {selectedStrategy.pros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="cons">
                  <h5>❌ Challenges</h5>
                  <ul>
                    {selectedStrategy.cons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="impact-stats">
        <h4>📊 Impact Statistics</h4>
        <div className="stats-grid">
          {stats.map(stat => (
            <div key={stat.k} className="stat-item">
              <span className="stat-label">{stat.k}</span>
              <span className="stat-value">{stat.v}</span>
            </div>
          ))}
        </div>

        {mitigationDelta && (
          <div className="mitigation-delta">
            <h5>🎯 Mitigation Results</h5>
            <div className="delta-grid">
              <div className="delta-item positive">
                <span className="delta-label">Energy Reduction</span>
                <span className="delta-value">-{mitigationDelta.energyReduction}%</span>
              </div>
              <div className="delta-item positive">
                <span className="delta-label">TNT Reduction</span>
                <span className="delta-value">-{mitigationDelta.tntReduction}%</span>
              </div>
              <div className="delta-item positive">
                <span className="delta-label">Velocity Change</span>
                <span className="delta-value">-{mitigationDelta.velocityChange}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {current?.mitigationApplied && current.mitigationApplied.length > 0 && (
        <div className="applied-mitigations">
          <h4>✅ Applied Mitigations</h4>
          <ul>
            {current.mitigationApplied.map((mit, i) => (
              <li key={i} className="applied-mitigation">
                {mit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impact Catastrophe Chart */}
      <ImpactCatastropheChart impactData={current} />

      <div className="physics-info">
        <h4>🔬 Physics Formulas</h4>
        <div className="formula-list">
          <Tooltip 
            content="Kinetic energy is calculated using the classical physics formula where E is energy in Joules, m is mass in kilograms, and v is velocity in meters per second."
            position="top"
          >
            <div className="formula-item">
              <code>E = ½mv²</code>
              <span>Kinetic Energy</span>
            </div>
          </Tooltip>
          <Tooltip 
            content="TNT equivalent converts energy to the equivalent mass of TNT explosive. 4.184×10⁹ Joules equals 1 ton of TNT."
            position="top"
          >
            <div className="formula-item">
              <code>TNT = E / 4.184×10⁹</code>
              <span>TNT Equivalent</span>
            </div>
          </Tooltip>
          <Tooltip 
            content="Crater diameter uses Schmidt-Holsapple scaling law where k is an empirical constant, m is mass, and v is velocity. This is an approximate model for educational purposes."
            position="top"
          >
            <div className="formula-item">
              <code>D = k × ∛(m) × v^0.44</code>
              <span>Crater Diameter</span>
            </div>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
