import React, { useState, useEffect, useRef, useMemo, WheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SimulationEngine,
  type OrbitalElements as SimOrbitalElements,
  type ImpactData
} from '../services/simulationEngine';
import './OrbitalTrajectorySimulator.css';

interface OrbitalElements {
  semiMajorAxis: number; // AU
  eccentricity: number; // unitless
  inclination: number; // degrees
  argumentOfPeriapsis: number; // degrees
}

interface AsteroidSimulatorProps {
  onSimulate?: (params: any, impactData: any) => void;
}

const AU_IN_KM = 149597870.7; // kilometers in 1 AU

const REGIONS = [
  { id: 'north_america', label: 'North America', lat: 45.0, lng: -100.0 },
  { id: 'europe', label: 'Europe', lat: 54.0, lng: 15.0 },
  { id: 'asia', label: 'Asia', lat: 35.0, lng: 100.0 },
  { id: 'africa', label: 'Africa', lat: 0.0, lng: 20.0 },
  { id: 'oceania', label: 'Oceania', lat: -25.0, lng: 140.0 },
  { id: 'south_america', label: 'South America', lat: -15.0, lng: -60.0 },
  { id: 'ocean_pacific', label: 'Pacific Ocean', lat: 0.0, lng: -150.0 },
  { id: 'ocean_atlantic', label: 'Atlantic Ocean', lat: 20.0, lng: -30.0 },
];

// Prevent browser zoom on wheel+ctrl inside canvas
function preventWheel(e: WheelEvent) {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}

export default function OrbitalTrajectorySimulator({ onSimulate }: AsteroidSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // UI state
  const [timeToImpact, setTimeToImpact] = useState<number>(365);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [mode, setMode] = useState<'observe' | 'defend'>('observe');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1); // 1 = default, >1 = zoom in, <1 = zoom out

  // Orbital elements (Keplerian)
  const [orbitalElements, setOrbitalElements] = useState<OrbitalElements>({
    semiMajorAxis: 1.2,
    eccentricity: 0.5,
    inclination: 15,
    argumentOfPeriapsis: 90,
  });

  // Physical properties (clear about units)
  const [asteroidRadiusM, setAsteroidRadiusM] = useState<number>(75); // meters (radius)
  const [asteroidDensity, setAsteroidDensity] = useState<number>(2600); // kg/m^3
  const [velocityKmS, setVelocityKmS] = useState<number>(17.2); // km/s user-adjustable
  const [impactRegion, setImpactRegion] = useState<string>('north_america');

  // derived
  const [collisionPredicted, setCollisionPredicted] = useState<boolean>(false);
  const [impactPoint, setImpactPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Precompute starfield for performance
  const stars = useMemo(() => {
    return new Array(300).fill(0).map(() => ({
      x: Math.random(),
      y: Math.random(),
      alpha: 0.1 + Math.random() * 0.9,
      size: Math.random() < 0.05 ? 2 : 1
    }));
  }, []);

  // Convert UI orbital elements to simulation engine format
  const simElements: SimOrbitalElements = useMemo(() => ({
    aAU: orbitalElements.semiMajorAxis,
    e: orbitalElements.eccentricity,
    iDeg: orbitalElements.inclination,
    raanDeg: 0, // Default RAAN
    argPeriDeg: orbitalElements.argumentOfPeriapsis,
    meanAnomalyDeg: 0, // Start at periapsis
    epochJD: 2450000.5
  }), [orbitalElements]);

  // Use SimulationEngine for trajectory sampling
  const trajectory = useMemo(() => {
    // Instead of time-based, sample a full orbit in true anomaly for a closed ellipse
    const points: { x: number; y: number; z: number }[] = [];
    const steps = 360;
    const a = orbitalElements.semiMajorAxis * AU_IN_KM;
    const e = orbitalElements.eccentricity;
    const inc = (orbitalElements.inclination * Math.PI) / 180;
    const omega = (orbitalElements.argumentOfPeriapsis * Math.PI) / 180;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      // Polar equation of ellipse
      const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
      // Perifocal coordinates
      let x = r * Math.cos(theta);
      let y = r * Math.sin(theta);
      // Rotate by argument of periapsis and inclination (simplified, no RAAN)
      const xRot = x * Math.cos(omega) - y * Math.sin(omega);
      const yRot = (x * Math.sin(omega) + y * Math.cos(omega)) * Math.cos(inc);
      points.push({ x: xRot, y: yRot, z: 0 });
    }
    return points;
  }, [orbitalElements]);

  const collisionResult = useMemo(() => {
    return SimulationEngine.checkEarthCollision(trajectory);
  }, [trajectory]);

  useEffect(() => {
    setCollisionPredicted(collisionResult.collision);
    if (collisionResult.collision && collisionResult.impactPoint) {
      const latLng = SimulationEngine.eciToLatLng(collisionResult.impactPoint);
      setImpactPoint(latLng);
    } else {
      const region = REGIONS.find(r => r.id === impactRegion) ?? REGIONS[0];
      setImpactPoint({ lat: region.lat, lng: region.lng });
    }
  }, [collisionResult, impactRegion]);

  const calculateImpactEffects = (): ImpactData => {
    const region = REGIONS.find(r => r.id === impactRegion) ?? REGIONS[0];
    const impactLoc = impactPoint ?? { lat: region.lat, lng: region.lng };

    return SimulationEngine.computeImpactEffects(asteroidRadiusM, asteroidDensity, velocityKmS, impactLoc);
  };

  // Canvas: resize & DPR handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Handle mouse wheel for zoom
  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    // Prevent browser zoom (especially on ctrl+wheel)
    e.preventDefault();
    setZoom(prev => {
      let next = prev - e.deltaY * 0.001;
      next = Math.max(0.2, Math.min(5, next));
      return next;
    });
  };

  // Animation loop (Sun-centered, Earth at 1 AU)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let impactAnimationProgress = 0;
    let simulatePhase: 'idle' | 'animating' | 'impact' = 'idle';
    let animationStartTime = 0;

    const draw = () => {
      frame++;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Clear
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, w, h);

      // Stars (precomputed)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const sx = Math.floor(s.x * w);
        const sy = Math.floor(s.y * h);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fillRect(sx, sy, s.size, s.size);
      }

      // Center of the canvas is the Sun
      const centerX = w / 2;
      const centerY = h / 2;
      // Zoom logic: scale and pan so Earth is centered and zoomed
      const baseScale = 110;
      const scale = baseScale * zoom;

      // Calculate Earth's position
      const earthX = centerX + scale * 1;
      const earthY = centerY;

      // If zoomed in, pan so Earth is at center
      let offsetX = 0;
      let offsetY = 0;
      if (zoom > 1) {
        offsetX = centerX - earthX;
        offsetY = centerY - earthY;
      }

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Draw Earth's orbit (1 AU)
      ctx.strokeStyle = 'rgba(100,150,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, scale * 1, 0, Math.PI * 2);
      ctx.stroke();

      // Draw asteroid trajectory (Sun-centered, closed ellipse)
      ctx.strokeStyle = collisionPredicted ? 'rgba(255,80,80,0.7)' : 'rgba(255,165,0,0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < trajectory.length; i++) {
        const p = trajectory[i];
        const px = centerX + (p.x / AU_IN_KM) * scale;
        const py = centerY + (p.y / AU_IN_KM) * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw Earth at 1 AU (x = 1 AU, y = 0)
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(centerX + scale * 1, centerY, 14 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Asteroid current position
      let currentIdx = Math.floor((frame / 4) % trajectory.length);
      if (simulatePhase === 'animating') {
        const elapsed = (performance.now() - animationStartTime) / 1000;
        const speedFactor = Math.max(1, velocityKmS / 6) * 30;
        const progress = Math.min(1, elapsed * speedFactor / trajectory.length);
        currentIdx = Math.floor(progress * trajectory.length);
        impactAnimationProgress = progress;
        
        if (progress >= 1 && collisionPredicted) {
          simulatePhase = 'impact';
          impactAnimationProgress = 1;
        }
      }

      // Draw asteroid at current position
      const ast = trajectory[Math.min(trajectory.length - 1, Math.max(0, currentIdx))];
      const asteroidX = centerX + (ast.x / AU_IN_KM) * scale;
      const asteroidY = centerY + (ast.y / AU_IN_KM) * scale;
      const drawSize = Math.max(2, Math.min(asteroidRadiusM / 12, 10)) * zoom;

      // Asteroid glow
      const ag = ctx.createRadialGradient(asteroidX, asteroidY, 0, asteroidX, asteroidY, drawSize * 2);
      ag.addColorStop(0, 'rgba(255,165,0,0.9)');
      ag.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(asteroidX, asteroidY, drawSize * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Asteroid body
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.arc(asteroidX, asteroidY, drawSize, 0, Math.PI * 2);
      ctx.fill();

      // Impact explosion animation (draw at Earth's position)
      if (simulatePhase === 'impact' && collisionPredicted) {
        const maxR = Math.min(Math.max(w, h) / 1.5, 600) * zoom;
        const ringR = impactAnimationProgress ? Math.min(maxR, impactAnimationProgress * maxR) : 0;
        ctx.strokeStyle = `rgba(255,90,50,${1 - impactAnimationProgress})`;
        ctx.lineWidth = 6 * (1 - impactAnimationProgress) + 1;
        ctx.beginPath();
        ctx.arc(centerX + scale * 1, centerY, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // Flash
        ctx.fillStyle = `rgba(255,200,120,${1 - impactAnimationProgress})`;
        ctx.beginPath();
        ctx.arc(centerX + scale * 1, centerY, Math.min(100, ringR / 2), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // HUD text (not zoomed)
      ctx.fillStyle = '#fff';
      ctx.font = '13px Inter, Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`a: ${orbitalElements.semiMajorAxis.toFixed(2)} AU`, 14, 44);
      ctx.fillText(`e: ${orbitalElements.eccentricity.toFixed(2)}`, 14, 62);
      ctx.fillText(`i: ${orbitalElements.inclination.toFixed(1)}°`, 14, 80);
      ctx.fillText(`radius: ${asteroidRadiusM} m`, 14, 98);
      ctx.fillText(`v: ${velocityKmS.toFixed(2)} km/s`, 14, 116);
      ctx.fillText(`Mode: ${mode === 'defend' ? 'Defend (Δv available)' : 'Observe'}`, 14, 134);

      if (collisionPredicted && impactPoint) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`⚠️ COLLISION POSSIBLE @ ${impactPoint.lat.toFixed(1)}°, ${impactPoint.lng.toFixed(1)}°`, w / 2, 40);
      }

      if (isAnimating || simulatePhase !== 'idle') {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [orbitalElements, asteroidRadiusM, velocityKmS, stars, collisionPredicted, impactPoint, timeToImpact, isAnimating, mode, trajectory, zoom]);

  // Simulate button handler
  const handleSimulate = async () => {
    setIsSimulating(true);
    
    const params = {
      size: asteroidRadiusM,
      velocity: velocityKmS,
      region: impactRegion,
      density: asteroidDensity,
      orbitalElements,
      mode,
      timeToImpact
    };

    const impactData = calculateImpactEffects();

    // Trigger impact animation
    const delayMs = impactData.collisionPredicted ? 2000 : 1000;
    
    // Allow parent to receive data
    if (onSimulate) {
      onSimulate(params, impactData);
    }

    // Navigate to impact analysis page
    setTimeout(() => {
      navigate('/impact', { state: { params, impactData } });
    }, delayMs);
  };

  return (
    <div className="orbital-simulator">
      <div className="simulator-header">
        <h2>🌌 Orbital Trajectory Simulator</h2>
        <p>Adjust asteroid hyperparameters and simulate impact scenarios. Click <strong>Simulate</strong> to proceed to regional impact analysis.</p>
      </div>

      <div className="simulator-content">
        {/* Main visualization */}
        <div className="visualization-container" style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            className="orbital-canvas"
            style={{ width: '100%', height: 400, background: 'transparent', display: 'block' }}
            width={800}
            height={400}
            tabIndex={0}
            onWheel={handleWheel}
            onMouseEnter={e => { e.currentTarget.addEventListener('wheel', preventWheel as any, { passive: false }); }}
            onMouseLeave={e => { e.currentTarget.removeEventListener('wheel', preventWheel as any); }}
          />
          <div style={{position: 'absolute', top: 10, right: 20, color: '#fff', zIndex: 2, background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '2px 10px', fontSize: 13}}>
            Zoom: {(zoom * 100).toFixed(0)}%
          </div>
          {/* Status panel */}
          <div className="status-panel">
            <div className={`collision-status ${collisionPredicted ? 'danger' : 'safe'}`}>
              {collisionPredicted ? '🚨 COLLISION PREDICTED' : '✅ SAFE TRAJECTORY'}
            </div>
            <div className="time-display">
              Time to Impact: {timeToImpact} days
            </div>
            {impactPoint && (
              <div className="impact-info">
                <div>Impact Point: {impactPoint.lat.toFixed(2)}°N, {impactPoint.lng.toFixed(2)}°E</div>
              </div>
            )}
          </div>
        </div>

        {/* Control sidebar */}
        <div className="control-sidebar">
          <div className="control-section">
            <h3>Keplerian Orbital Elements</h3>
            
            <div className="control-group">
              <label htmlFor="sma-slider">
                Semi-Major Axis: {orbitalElements.semiMajorAxis.toFixed(2)} AU
              </label>
              <input
                id="sma-slider"
                type="range"
                min="0.5"
                max="3.0"
                step="0.01"
                value={orbitalElements.semiMajorAxis}
                onChange={(e) => setOrbitalElements(prev => ({
                  ...prev,
                  semiMajorAxis: parseFloat(e.target.value)
                }))}
                className="slider"
              />
              <div className="slider-info">
                <span>Close (0.5 AU)</span>
                <span>Far (3.0 AU)</span>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="ecc-slider">
                Eccentricity: {orbitalElements.eccentricity.toFixed(2)}
              </label>
              <input
                id="ecc-slider"
                type="range"
                min="0.0"
                max="0.99"
                step="0.01"
                value={orbitalElements.eccentricity}
                onChange={(e) => setOrbitalElements(prev => ({
                  ...prev,
                  eccentricity: parseFloat(e.target.value)
                }))}
                className="slider"
              />
              <div className="slider-info">
                <span>Circular (0)</span>
                <span>Hyperbolic (0.99)</span>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="inc-slider">
                Inclination: {orbitalElements.inclination.toFixed(1)}°
              </label>
              <input
                id="inc-slider"
                type="range"
                min="0"
                max="180"
                step="1"
                value={orbitalElements.inclination}
                onChange={(e) => setOrbitalElements(prev => ({
                  ...prev,
                  inclination: parseFloat(e.target.value)
                }))}
                className="slider"
              />
              <div className="slider-info">
                <span>Prograde (0°)</span>
                <span>Retrograde (180°)</span>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="omega-slider">
                Argument of Periapsis: {orbitalElements.argumentOfPeriapsis.toFixed(1)}°
              </label>
              <input
                id="omega-slider"
                type="range"
                min="0"
                max="360"
                step="1"
                value={orbitalElements.argumentOfPeriapsis}
                onChange={(e) => setOrbitalElements(prev => ({
                  ...prev,
                  argumentOfPeriapsis: parseFloat(e.target.value)
                }))}
                className="slider"
              />
            </div>

            <h4>Asteroid Hyperparameters</h4>
            
            <div className="control-group">
              <label htmlFor="size-slider">
                Asteroid Radius: {asteroidRadiusM}m
              </label>
              <input
                id="size-slider"
                type="range"
                min="10"
                max="500"
                step="5"
                value={asteroidRadiusM}
                onChange={(e) => setAsteroidRadiusM(parseInt(e.target.value))}
                className="slider asteroid-slider"
              />
            </div>

            <div className="control-group">
              <label htmlFor="density-slider">
                Density: {asteroidDensity} kg/m³
              </label>
              <input
                id="density-slider"
                type="range"
                min="1000"
                max="8000"
                step="100"
                value={asteroidDensity}
                onChange={(e) => setAsteroidDensity(parseInt(e.target.value))}
                className="slider density-slider"
              />
            </div>

            <div className="control-group">
              <label htmlFor="velocity-slider">
                Velocity: {velocityKmS.toFixed(1)} km/s
              </label>
              <input
                id="velocity-slider"
                type="range"
                min="5"
                max="70"
                step="0.1"
                value={velocityKmS}
                onChange={(e) => setVelocityKmS(parseFloat(e.target.value))}
                className="slider velocity-slider"
              />
            </div>

            <div className="control-group">
              <label htmlFor="region-select">Target Region</label>
              <select
                id="region-select"
                value={impactRegion}
                onChange={(e) => setImpactRegion(e.target.value)}
                className="region-select"
              >
                {REGIONS.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="time-slider">
                Time to Impact: {timeToImpact} days
              </label>
              <input
                id="time-slider"
                type="range"
                min="1"
                max="730"
                value={timeToImpact}
                onChange={(e) => setTimeToImpact(parseInt(e.target.value))}
                className="slider time-slider"
              />
            </div>

            <div className="control-group">
              <label>Scenario Mode</label>
              <div className="mode-toggle">
                <label className="mode-option">
                  <input
                    type="radio"
                    name="mode"
                    value="observe"
                    checked={mode === 'observe'}
                    onChange={(e) => setMode(e.target.value as 'observe' | 'defend')}
                  />
                  <span>Observe Only</span>
                </label>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="mode"
                    value="defend"
                    checked={mode === 'defend'}
                    onChange={(e) => setMode(e.target.value as 'observe' | 'defend')}
                  />
                  <span>Defend Earth</span>
                </label>
              </div>
            </div>
          </div>

          {/* Impact Prediction */}
          <div className="impact-preview">
            <h3>Impact Prediction</h3>
            {(() => {
              const impact = calculateImpactEffects();
              return (
                <div className="impact-stats">
                  <div className={`collision-status ${impact.collisionPredicted ? 'danger' : 'safe'}`}>
                    <strong>{impact.collisionPredicted ? '🚨 COLLISION IMMINENT' : '✅ SAFE TRAJECTORY'}</strong>
                  </div>
                  {impact.collisionPredicted && (
                    <div className="impact-details">
                      <div className="stat-item">
                        <span className="stat-label">Energy:</span>
                        <span className="stat-value">{(impact.energy / 1e15).toFixed(2)} PJ</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">TNT Equivalent:</span>
                        <span className="stat-value">{(impact.tntEquivalent / 1e6).toFixed(2)} MT</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Crater Diameter:</span>
                        <span className="stat-value">{(impact.craterDiameter / 1000).toFixed(2)} km</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Blast Radius:</span>
                        <span className="stat-value">{impact.blastRadius.toFixed(0)} km</span>
                      </div>
                      {impact.tsunamiRadius && (
                        <div className="stat-item">
                          <span className="stat-label">Tsunami Radius:</span>
                          <span className="stat-value">{impact.tsunamiRadius.toFixed(0)} km</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Simulate Button */}
          <button 
            className="simulate-button"
            onClick={handleSimulate}
            disabled={isSimulating}
          >
            {isSimulating ? '🎬 Simulating...' : '🚀 Simulate Impact Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
}