import React, { useState, useEffect } from 'react';
import './ControlPanel.css';

export interface ControlPanelSettings {
  asteroidSize: number;
  asteroidVelocity: number;
  asteroidDensity: number;
  impactAngle: number;
  targetRegion: string;
  showBlastZone: boolean;
  showThermalZone: boolean;
  showSeismicZone: boolean;
  showTsunamiZone: boolean;
  showEconomicZone: boolean;
  showEnvironmentalZone: boolean;
  animationSpeed: number;
  visualQuality: 'low' | 'medium' | 'high';
}

interface ControlPanelProps {
  settings: ControlPanelSettings;
  onSettingsChange: (settings: ControlPanelSettings) => void;
  onSimulate?: () => void;
  onReset?: () => void;
  compact?: boolean;
  disabled?: boolean;
}

interface TooltipInfo {
  title: string;
  description: string;
  example?: string;
}

const TOOLTIPS: Record<string, TooltipInfo> = {
  asteroidSize: {
    title: 'Asteroid Size',
    description: 'The radius of the asteroid in meters. Larger asteroids cause more devastating impacts.',
    example: 'Tunguska event: ~50m, Chicxulub (dinosaur extinction): ~10km'
  },
  asteroidVelocity: {
    title: 'Impact Velocity',
    description: 'The speed at which the asteroid enters Earth\'s atmosphere in km/s. Typical range: 11-72 km/s.',
    example: 'Average asteroid velocity: 17-20 km/s'
  },
  asteroidDensity: {
    title: 'Asteroid Density',
    description: 'Material density in kg/m³. Affects mass and impact energy.',
    example: 'Rocky: 2600 kg/m³, Metallic: 7800 kg/m³, Icy: 1000 kg/m³'
  },
  impactAngle: {
    title: 'Impact Angle',
    description: 'Angle of entry relative to the surface. 90° is vertical, 0° is horizontal.',
    example: 'Most impacts occur at 30-60° angles'
  },
  animationSpeed: {
    title: 'Animation Speed',
    description: 'Controls the playback speed of the simulation visualization.',
    example: '1x = real-time, 2x = double speed'
  },
  visualQuality: {
    title: 'Visual Quality',
    description: 'Graphics quality setting. Higher quality provides better visuals but requires more processing power.',
    example: 'Low: Basic rendering, High: Full effects'
  }
};

const REGIONS = [
  { id: 'north_america', label: 'North America', icon: '🗽' },
  { id: 'europe', label: 'Europe', icon: '🏰' },
  { id: 'asia', label: 'Asia', icon: '🏯' },
  { id: 'africa', label: 'Africa', icon: '🦁' },
  { id: 'oceania', label: 'Oceania', icon: '🦘' },
  { id: 'south_america', label: 'South America', icon: '🌴' },
  { id: 'ocean_pacific', label: 'Pacific Ocean', icon: '🌊' },
  { id: 'ocean_atlantic', label: 'Atlantic Ocean', icon: '🌊' }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  onSimulate,
  onReset,
  compact = false,
  disabled = false
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['asteroid', 'effects'])
  );

  const handleSliderChange = (key: keyof ControlPanelSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleToggle = (key: keyof ControlPanelSettings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  const handleSelectChange = (key: keyof ControlPanelSettings, value: string) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const showTooltip = (key: string) => {
    setActiveTooltip(key);
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const renderTooltip = (key: string) => {
    if (activeTooltip !== key) return null;
    const tooltip = TOOLTIPS[key];
    if (!tooltip) return null;

    return (
      <div className="tooltip-popup">
        <div className="tooltip-header">
          <h4>{tooltip.title}</h4>
        </div>
        <div className="tooltip-body">
          <p>{tooltip.description}</p>
          {tooltip.example && (
            <div className="tooltip-example">
              <strong>Example:</strong> {tooltip.example}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSlider = (
    key: keyof ControlPanelSettings,
    label: string,
    min: number,
    max: number,
    step: number,
    unit: string,
    tooltipKey?: string
  ) => {
    const value = settings[key] as number;
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="control-item">
        <div className="control-label-row">
          <label className="control-label">
            {label}
            {tooltipKey && (
              <button
                className="tooltip-trigger"
                onMouseEnter={() => showTooltip(tooltipKey)}
                onMouseLeave={hideTooltip}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTooltip(activeTooltip === tooltipKey ? null : tooltipKey);
                }}
              >
                ℹ️
              </button>
            )}
          </label>
          <span className="control-value">
            {value.toFixed(step < 1 ? 1 : 0)} {unit}
          </span>
        </div>
        <div className="slider-container">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
            disabled={disabled}
            className="control-slider"
            style={{
              background: `linear-gradient(to right, #4A90E2 0%, #4A90E2 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
        </div>
        {tooltipKey && renderTooltip(tooltipKey)}
      </div>
    );
  };

  const renderToggle = (
    key: keyof ControlPanelSettings,
    label: string,
    icon: string
  ) => {
    const value = settings[key] as boolean;

    return (
      <label className="toggle-item">
        <input
          type="checkbox"
          checked={value}
          onChange={() => handleToggle(key)}
          disabled={disabled}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">
          <span className="toggle-icon">{icon}</span>
          {label}
        </span>
      </label>
    );
  };

  if (compact) {
    return (
      <div className="control-panel compact">
        <div className="compact-controls">
          {renderSlider('asteroidSize', 'Size', 10, 1000, 10, 'm', 'asteroidSize')}
          {renderSlider('asteroidVelocity', 'Velocity', 11, 72, 1, 'km/s', 'asteroidVelocity')}
          
          <div className="compact-actions">
            {onSimulate && (
              <button
                className="btn-simulate"
                onClick={onSimulate}
                disabled={disabled}
              >
                🚀 Simulate
              </button>
            )}
            {onReset && (
              <button
                className="btn-reset"
                onClick={onReset}
                disabled={disabled}
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h3>🎛️ Control Panel</h3>
        <div className="panel-actions">
          {onSimulate && (
            <button
              className="btn-simulate"
              onClick={onSimulate}
              disabled={disabled}
            >
              🚀 Run Simulation
            </button>
          )}
          {onReset && (
            <button
              className="btn-reset"
              onClick={onReset}
              disabled={disabled}
            >
              🔄 Reset
            </button>
          )}
        </div>
      </div>

      {/* Asteroid Parameters Section */}
      <div className="panel-section">
        <button
          className="section-header"
          onClick={() => toggleSection('asteroid')}
        >
          <span className="section-title">
            <span className="section-icon">☄️</span>
            Asteroid Parameters
          </span>
          <span className={`section-toggle ${expandedSections.has('asteroid') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('asteroid') && (
          <div className="section-content">
            {renderSlider('asteroidSize', 'Size (Radius)', 10, 1000, 10, 'm', 'asteroidSize')}
            {renderSlider('asteroidVelocity', 'Velocity', 11, 72, 1, 'km/s', 'asteroidVelocity')}
            {renderSlider('asteroidDensity', 'Density', 1000, 8000, 100, 'kg/m³', 'asteroidDensity')}
            {renderSlider('impactAngle', 'Impact Angle', 0, 90, 5, '°', 'impactAngle')}
            
            <div className="control-item">
              <label className="control-label">Target Region</label>
              <select
                className="control-select"
                value={settings.targetRegion}
                onChange={(e) => handleSelectChange('targetRegion', e.target.value)}
                disabled={disabled}
              >
                {REGIONS.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.icon} {region.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Effect Zones Section */}
      <div className="panel-section">
        <button
          className="section-header"
          onClick={() => toggleSection('effects')}
        >
          <span className="section-title">
            <span className="section-icon">💥</span>
            Effect Zones
          </span>
          <span className={`section-toggle ${expandedSections.has('effects') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('effects') && (
          <div className="section-content">
            <div className="toggle-grid">
              {renderToggle('showBlastZone', 'Blast Zone', '💥')}
              {renderToggle('showThermalZone', 'Thermal Zone', '🔥')}
              {renderToggle('showSeismicZone', 'Seismic Zone', '🌋')}
              {renderToggle('showTsunamiZone', 'Tsunami Zone', '🌊')}
              {renderToggle('showEconomicZone', 'Economic Impact', '💰')}
              {renderToggle('showEnvironmentalZone', 'Environmental', '🌿')}
            </div>
          </div>
        )}
      </div>

      {/* Visualization Settings Section */}
      <div className="panel-section">
        <button
          className="section-header"
          onClick={() => toggleSection('visualization')}
        >
          <span className="section-title">
            <span className="section-icon">🎨</span>
            Visualization
          </span>
          <span className={`section-toggle ${expandedSections.has('visualization') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('visualization') && (
          <div className="section-content">
            {renderSlider('animationSpeed', 'Animation Speed', 0.5, 5, 0.5, 'x', 'animationSpeed')}
            
            <div className="control-item">
              <div className="control-label-row">
                <label className="control-label">
                  Visual Quality
                  <button
                    className="tooltip-trigger"
                    onMouseEnter={() => showTooltip('visualQuality')}
                    onMouseLeave={hideTooltip}
                  >
                    ℹ️
                  </button>
                </label>
              </div>
              <div className="quality-buttons">
                {(['low', 'medium', 'high'] as const).map(quality => (
                  <button
                    key={quality}
                    className={`quality-btn ${settings.visualQuality === quality ? 'active' : ''}`}
                    onClick={() => handleSelectChange('visualQuality', quality)}
                    disabled={disabled}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </button>
                ))}
              </div>
              {renderTooltip('visualQuality')}
            </div>
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div className="panel-section">
        <button
          className="section-header"
          onClick={() => toggleSection('presets')}
        >
          <span className="section-title">
            <span className="section-icon">⚡</span>
            Quick Presets
          </span>
          <span className={`section-toggle ${expandedSections.has('presets') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('presets') && (
          <div className="section-content">
            <div className="preset-buttons">
              <button
                className="preset-btn"
                onClick={() => onSettingsChange({
                  ...settings,
                  asteroidSize: 50,
                  asteroidVelocity: 17,
                  asteroidDensity: 2600
                })}
                disabled={disabled}
              >
                <span className="preset-icon">🌠</span>
                <span className="preset-label">Tunguska Event</span>
                <span className="preset-desc">50m, 17 km/s</span>
              </button>
              
              <button
                className="preset-btn"
                onClick={() => onSettingsChange({
                  ...settings,
                  asteroidSize: 185,
                  asteroidVelocity: 12,
                  asteroidDensity: 2600
                })}
                disabled={disabled}
              >
                <span className="preset-icon">☄️</span>
                <span className="preset-label">Apophis-like</span>
                <span className="preset-desc">370m, 12 km/s</span>
              </button>
              
              <button
                className="preset-btn"
                onClick={() => onSettingsChange({
                  ...settings,
                  asteroidSize: 500,
                  asteroidVelocity: 20,
                  asteroidDensity: 3000
                })}
                disabled={disabled}
              >
                <span className="preset-icon">💀</span>
                <span className="preset-label">Extinction Level</span>
                <span className="preset-desc">1km, 20 km/s</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
