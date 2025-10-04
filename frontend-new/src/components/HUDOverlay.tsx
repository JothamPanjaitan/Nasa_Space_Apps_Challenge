import React, { useState, useEffect } from 'react';
import './HUDOverlay.css';

export interface HUDData {
  asteroidName?: string;
  asteroidSize?: number;
  asteroidVelocity?: number;
  asteroidDistance?: number;
  impactProbability?: number;
  timeToImpact?: number;
  targetLocation?: { lat: number; lng: number };
  impactEnergy?: number;
  threatLevel?: 'low' | 'moderate' | 'high' | 'critical';
  detectionTime?: Date;
  trackingStatus?: 'tracking' | 'locked' | 'lost';
  cameraPosition?: { lat: number; lng: number; altitude: number };
  simulationTime?: number;
  fps?: number;
}

interface HUDOverlayProps {
  data: HUDData;
  mode?: '3d' | 'map' | 'simulation';
  showMiniMap?: boolean;
  showStats?: boolean;
  showWarnings?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  data,
  mode = '3d',
  showMiniMap = true,
  showStats = true,
  showWarnings = true,
  compact = false,
  onClose
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [blinkWarning, setBlinkWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data.threatLevel === 'critical' || data.threatLevel === 'high') {
      const blinkTimer = setInterval(() => {
        setBlinkWarning(prev => !prev);
      }, 500);

      return () => clearInterval(blinkTimer);
    }
  }, [data.threatLevel]);

  const getThreatColor = (level?: string) => {
    switch (level) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF6B00';
      case 'moderate': return '#FFD700';
      case 'low': return '#00FF00';
      default: return '#4A90E2';
    }
  };

  const getThreatLabel = (level?: string) => {
    switch (level) {
      case 'critical': return 'CRITICAL THREAT';
      case 'high': return 'HIGH THREAT';
      case 'moderate': return 'MODERATE THREAT';
      case 'low': return 'LOW THREAT';
      default: return 'MONITORING';
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDistance = (km?: number) => {
    if (!km) return 'N/A';
    
    if (km > 1000000) {
      return `${(km / 1000000).toFixed(2)} M km`;
    } else if (km > 1000) {
      return `${(km / 1000).toFixed(1)} K km`;
    }
    return `${km.toFixed(0)} km`;
  };

  const formatEnergy = (joules?: number) => {
    if (!joules) return 'N/A';
    
    const megatons = joules / (4.184e15);
    if (megatons >= 1) {
      return `${megatons.toFixed(2)} MT`;
    }
    
    const kilotons = joules / (4.184e12);
    return `${kilotons.toFixed(2)} KT`;
  };

  if (compact) {
    return (
      <div className="hud-overlay compact">
        <div className="hud-compact-info">
          <div className="hud-item">
            <span className="hud-label">Target:</span>
            <span className="hud-value">{data.asteroidName || 'Unknown'}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Distance:</span>
            <span className="hud-value">{formatDistance(data.asteroidDistance)}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Threat:</span>
            <span 
              className="hud-value threat-indicator"
              style={{ color: getThreatColor(data.threatLevel) }}
            >
              {getThreatLabel(data.threatLevel)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hud-overlay ${mode}`}>
      {/* Top Left - Asteroid Info */}
      <div className="hud-panel top-left">
        <div className="hud-header">
          <span className="hud-icon">☄️</span>
          <span className="hud-title">TARGET TRACKING</span>
        </div>
        <div className="hud-content">
          <div className="hud-data-row">
            <span className="hud-label">Designation:</span>
            <span className="hud-value">{data.asteroidName || 'Unknown'}</span>
          </div>
          <div className="hud-data-row">
            <span className="hud-label">Size:</span>
            <span className="hud-value">{data.asteroidSize ? `${data.asteroidSize}m` : 'N/A'}</span>
          </div>
          <div className="hud-data-row">
            <span className="hud-label">Velocity:</span>
            <span className="hud-value">{data.asteroidVelocity ? `${data.asteroidVelocity} km/s` : 'N/A'}</span>
          </div>
          <div className="hud-data-row">
            <span className="hud-label">Distance:</span>
            <span className="hud-value">{formatDistance(data.asteroidDistance)}</span>
          </div>
          <div className="hud-data-row">
            <span className="hud-label">Status:</span>
            <span className={`hud-value status-${data.trackingStatus || 'tracking'}`}>
              {data.trackingStatus?.toUpperCase() || 'TRACKING'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Right - Threat Assessment */}
      <div className="hud-panel top-right">
        <div className="hud-header">
          <span className="hud-icon">⚠️</span>
          <span className="hud-title">THREAT ASSESSMENT</span>
        </div>
        <div className="hud-content">
          <div className="threat-level-display">
            <div 
              className={`threat-indicator ${data.threatLevel || 'low'} ${blinkWarning ? 'blink' : ''}`}
              style={{ borderColor: getThreatColor(data.threatLevel) }}
            >
              <span className="threat-label" style={{ color: getThreatColor(data.threatLevel) }}>
                {getThreatLabel(data.threatLevel)}
              </span>
            </div>
          </div>
          
          <div className="hud-data-row">
            <span className="hud-label">Impact Probability:</span>
            <span className="hud-value">
              {data.impactProbability !== undefined 
                ? `${(data.impactProbability * 100).toFixed(2)}%` 
                : 'N/A'}
            </span>
          </div>
          <div className="hud-data-row">
            <span className="hud-label">Time to Impact:</span>
            <span className="hud-value critical">
              {formatTime(data.timeToImpact)}
            </span>
          </div>
          <div className="hud-data-row">
            <span className="hud-label">Impact Energy:</span>
            <span className="hud-value">{formatEnergy(data.impactEnergy)}</span>
          </div>
          {data.targetLocation && (
            <div className="hud-data-row">
              <span className="hud-label">Target Coords:</span>
              <span className="hud-value coords">
                {data.targetLocation.lat.toFixed(2)}°, {data.targetLocation.lng.toFixed(2)}°
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left - System Stats */}
      {showStats && (
        <div className="hud-panel bottom-left">
          <div className="hud-header">
            <span className="hud-icon">📊</span>
            <span className="hud-title">SYSTEM STATUS</span>
          </div>
          <div className="hud-content">
            <div className="hud-data-row">
              <span className="hud-label">Local Time:</span>
              <span className="hud-value">{currentTime.toLocaleTimeString()}</span>
            </div>
            {data.detectionTime && (
              <div className="hud-data-row">
                <span className="hud-label">Detection:</span>
                <span className="hud-value">{data.detectionTime.toLocaleString()}</span>
              </div>
            )}
            {data.simulationTime !== undefined && (
              <div className="hud-data-row">
                <span className="hud-label">Sim Time:</span>
                <span className="hud-value">{formatTime(data.simulationTime)}</span>
              </div>
            )}
            {data.cameraPosition && (
              <>
                <div className="hud-data-row">
                  <span className="hud-label">Camera:</span>
                  <span className="hud-value coords">
                    {data.cameraPosition.lat.toFixed(2)}°, {data.cameraPosition.lng.toFixed(2)}°
                  </span>
                </div>
                <div className="hud-data-row">
                  <span className="hud-label">Altitude:</span>
                  <span className="hud-value">{formatDistance(data.cameraPosition.altitude)}</span>
                </div>
              </>
            )}
            {data.fps !== undefined && (
              <div className="hud-data-row">
                <span className="hud-label">FPS:</span>
                <span className={`hud-value ${data.fps < 30 ? 'warning' : ''}`}>
                  {data.fps.toFixed(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Right - Warnings */}
      {showWarnings && (data.threatLevel === 'critical' || data.threatLevel === 'high') && (
        <div className="hud-panel bottom-right warning-panel">
          <div className="hud-header warning">
            <span className="hud-icon">🚨</span>
            <span className="hud-title">ACTIVE WARNINGS</span>
          </div>
          <div className="hud-content">
            <div className="warning-item critical">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                {data.threatLevel === 'critical' 
                  ? 'IMMINENT IMPACT DETECTED' 
                  : 'HIGH PROBABILITY IMPACT'}
              </span>
            </div>
            {data.impactProbability && data.impactProbability > 0.5 && (
              <div className="warning-item high">
                <span className="warning-icon">📍</span>
                <span className="warning-text">
                  Impact probability exceeds 50%
                </span>
              </div>
            )}
            {data.timeToImpact && data.timeToImpact < 86400 && (
              <div className="warning-item critical">
                <span className="warning-icon">⏰</span>
                <span className="warning-text">
                  Less than 24 hours to impact
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center Crosshair (for 3D mode) */}
      {mode === '3d' && (
        <div className="hud-crosshair">
          <div className="crosshair-horizontal"></div>
          <div className="crosshair-vertical"></div>
          <div className="crosshair-center"></div>
        </div>
      )}

      {/* Mini Compass */}
      {showMiniMap && (
        <div className="hud-compass">
          <div className="compass-ring">
            <span className="compass-n">N</span>
            <span className="compass-e">E</span>
            <span className="compass-s">S</span>
            <span className="compass-w">W</span>
          </div>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button className="hud-close-btn" onClick={onClose}>
          ✕
        </button>
      )}

      {/* Scan Lines Effect */}
      <div className="hud-scanlines"></div>
    </div>
  );
};

export default HUDOverlay;
