import React, { useState, useEffect, useRef } from 'react';
import './AsteroidSimulator.css';

interface AsteroidParams {
  size: number; // radius in meters
  velocity: number; // km/s
  region: string;
}

interface ImpactData {
  energy: number;
  tntEquivalent: number;
  craterDiameter: number;
  blastRadius: number;
  thermalRadius: number;
  seismicRadius: number;
  tsunamiRadius?: number;
}

interface AsteroidSimulatorProps {
  onSimulate: (params: AsteroidParams, impactData: ImpactData) => void;
}

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

export default function AsteroidSimulator({ onSimulate }: AsteroidSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [asteroidParams, setAsteroidParams] = useState<AsteroidParams>({
    size: 50, // 50m radius
    velocity: 17, // 17 km/s
    region: 'north_america'
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const [timeToImpact, setTimeToImpact] = useState(30); // days

  // Calculate impact effects
  const calculateImpactEffects = (size: number, velocity: number): ImpactData => {
    const radius = size; // meters
    const velocityMs = velocity * 1000; // convert to m/s
    const density = 2600; // kg/m³ (typical asteroid density)
    
    // Mass calculation
    const mass = (4/3) * Math.PI * Math.pow(radius, 3) * density;
    
    // Kinetic energy
    const energy = 0.5 * mass * Math.pow(velocityMs, 2);
    
    // TNT equivalent (1 ton TNT = 4.184 × 10^9 J)
    const tntEquivalent = energy / (4.184e9);
    
    // Crater diameter (simplified pi-scaling)
    const craterDiameter = radius * 1.61 * Math.pow(density/2700, 1/3) * Math.pow(velocityMs/1000, 2/3);
    
    // Effect radii
    const blastRadius = Math.min(craterDiameter * 10, 1000); // km
    const thermalRadius = Math.min(craterDiameter * 5, 500); // km
    const seismicRadius = Math.min(craterDiameter * 20, 2000); // km
    
    // Tsunami radius (if ocean impact)
    const selectedRegion = REGIONS.find(r => r.id === asteroidParams.region);
    const isOceanImpact = selectedRegion?.id.includes('ocean') || false;
    const tsunamiRadius = isOceanImpact ? Math.min(craterDiameter * 15, 800) : undefined;
    
    return {
      energy,
      tntEquivalent,
      craterDiameter,
      blastRadius,
      thermalRadius,
      seismicRadius,
      tsunamiRadius
    };
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw Sun (center)
      const sunX = canvas.width / 2;
      const sunY = canvas.height / 2;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun glow effect
      const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30);
      gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();

      // Draw Earth orbit
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Earth
      const earthX = sunX + 120;
      const earthY = sunY;
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(earthX, earthY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Draw asteroid approaching
      const asteroidSize = Math.max(3, asteroidParams.size / 20); // Scale asteroid size
      const asteroidX = earthX + 80 + Math.sin(Date.now() * 0.001) * 20;
      const asteroidY = earthY - 40 + Math.cos(Date.now() * 0.001) * 10;
      
      // Asteroid glow based on size
      const asteroidGlow = ctx.createRadialGradient(asteroidX, asteroidY, 0, asteroidX, asteroidY, asteroidSize * 3);
      asteroidGlow.addColorStop(0, 'rgba(255, 165, 0, 0.8)');
      asteroidGlow.addColorStop(1, 'rgba(255, 165, 0, 0)');
      ctx.fillStyle = asteroidGlow;
      ctx.beginPath();
      ctx.arc(asteroidX, asteroidY, asteroidSize * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Asteroid body
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.arc(asteroidX, asteroidY, asteroidSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw trajectory line
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(asteroidX - 100, asteroidY - 50);
      ctx.lineTo(earthX, earthY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw impact countdown
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`${timeToImpact} days to impact`, 20, 30);

      // Draw asteroid info
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(`Size: ${asteroidParams.size}m radius`, 20, 50);
      ctx.fillText(`Velocity: ${asteroidParams.velocity} km/s`, 20, 70);
      ctx.fillText(`Region: ${REGIONS.find(r => r.id === asteroidParams.region)?.label}`, 20, 90);

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [asteroidParams, isAnimating, timeToImpact]);

  const handleSimulate = () => {
    const impactData = calculateImpactEffects(asteroidParams.size, asteroidParams.velocity);
    onSimulate(asteroidParams, impactData);
  };

  return (
    <div className="asteroid-simulator">
      <div className="simulator-header">
        <h2>🚀 Asteroid Impact Simulator</h2>
        <p>Adjust asteroid parameters and simulate the impact</p>
      </div>

      <div className="simulator-content">
        {/* Main visualization */}
        <div className="visualization-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="simulator-canvas"
          />
          
          {/* Legend */}
          <div className="simulator-legend">
            <div>🟡 Sun (center)</div>
            <div>🌍 Earth (1.5 AU)</div>
            <div>☄️ Asteroid trajectory</div>
          </div>
        </div>

        {/* Control sidebar */}
        <div className="control-sidebar">
          <div className="control-section">
            <h3>Asteroid Parameters</h3>
            
            <div className="control-group">
              <label htmlFor="size-slider">
                Size: {asteroidParams.size}m radius
              </label>
              <input
                id="size-slider"
                type="range"
                min="10"
                max="500"
                value={asteroidParams.size}
                onChange={(e) => setAsteroidParams(prev => ({
                  ...prev,
                  size: parseInt(e.target.value)
                }))}
                className="slider"
              />
              <div className="slider-labels">
                <span>Small (10m)</span>
                <span>Large (500m)</span>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="velocity-slider">
                Velocity: {asteroidParams.velocity} km/s
              </label>
              <input
                id="velocity-slider"
                type="range"
                min="5"
                max="50"
                value={asteroidParams.velocity}
                onChange={(e) => setAsteroidParams(prev => ({
                  ...prev,
                  velocity: parseInt(e.target.value)
                }))}
                className="slider"
              />
              <div className="slider-labels">
                <span>Slow (5 km/s)</span>
                <span>Fast (50 km/s)</span>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="region-select">Impact Region</label>
              <select
                id="region-select"
                value={asteroidParams.region}
                onChange={(e) => setAsteroidParams(prev => ({
                  ...prev,
                  region: e.target.value
                }))}
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
                max="365"
                value={timeToImpact}
                onChange={(e) => setTimeToImpact(parseInt(e.target.value))}
                className="slider"
              />
              <div className="slider-labels">
                <span>1 day</span>
                <span>1 year</span>
              </div>
            </div>
          </div>

          {/* Impact Preview */}
          <div className="impact-preview">
            <h3>Impact Preview</h3>
            {(() => {
              const impact = calculateImpactEffects(asteroidParams.size, asteroidParams.velocity);
              return (
                <div className="impact-stats">
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
              );
            })()}
          </div>

          {/* Simulate Button */}
          <button 
            className="simulate-button"
            onClick={handleSimulate}
          >
            🚀 Simulate Impact
          </button>
        </div>
      </div>
    </div>
  );
}
