import React, { useState, useEffect, useRef } from 'react';
import './OrbitalTrajectorySimulator.css';

interface OrbitalElements {
  semiMajorAxis: number; // AU
  eccentricity: number; // unitless
  inclination: number; // degrees
  argumentOfPeriapsis: number; // degrees
}

interface AsteroidSimulatorProps {
  onSimulate: (params: any, impactData: any) => void;
}

interface ImpactData {
  energy: number;
  tntEquivalent: number;
  craterDiameter: number;
  blastRadius: number;
  thermalRadius: number;
  seismicRadius: number;
  tsunamiRadius?: number;
  impactLocation: { lat: number; lng: number };
  collisionPredicted: boolean;
}

export default function OrbitalTrajectorySimulator({ onSimulate }: AsteroidSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [timeToImpact, setTimeToImpact] = useState(365);
  const [isAnimating, setIsAnimating] = useState(true);

  // Orbital parameters - Keplerian elements
  const [orbitalElements, setOrbitalElements] = useState<OrbitalElements>({
    semiMajorAxis: 1.2, // AU - just beyond Earth's orbit
    eccentricity: 0.8, // highly elliptical
    inclination: 15, // degrees
    argumentOfPeriapsis: 90 // degrees
  });

  // Asteroid physical properties
  const [asteroidSize, setAsteroidSize] = useState(75); // radius in meters
  const [asteroidDensity, setAsteroidDensity] = useState(2600); // kg/m³
  const [impactRegion, setImpactRegion] = useState('north_america');

  // Impact prediction results
  const [collisionPredicted, setCollisionPredicted] = useState(false);
  const [impactPoint, setImpactPoint] = useState<{lat: number, lng: number} | null>(null);

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

  // Calculate orbital position using Kepler's equations
  const calculateOrbitalPosition = (time: number, elements: OrbitalElements): {x: number, y: number} => {
    const { semiMajorAxis, eccentricity, inclination, argumentOfPeriapsis } = elements;
    
    // Convert to radians
    const i = inclination * Math.PI / 180;
    const omega = argumentOfPeriapsis * Math.PI / 180;
    
    // Simplified mean anomaly progression over time
    const meanAnomaly = (2 * Math.PI * time) / 100; // Simple time progression
    
    // Solve for eccentric anomaly using Newton's method
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < 5; i++) {
      eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
    }
    
    // Position in orbital plane
    const cosE = Math.cos(eccentricAnomaly);
    const sinE = Math.sin(eccentricAnomaly);
    
    const r = semiMajorAxis * (1 - eccentricity * cosE);
    const x_orbital = r * (cosE - eccentricity);
    const y_orbital = r * Math.sin(eccentricAnomaly) * Math.sqrt(1 - eccentricity * eccentricity);
    
    // Apply inclination and argument of periapsis
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const cosI = Math.cos(i);
    const sinI = Math.sin(i);
    
    return {
      x: x_orbital * cosOmega - y_orbital * sinOmega * cosI,
      y: x_orbital * sinOmega + y_orbital * cosOmega * cosI
    };
  };

  // Check for collision with Earth
  const checkCollisionWithEarth = (elements: OrbitalElements): {collision: boolean, impactLat?: number, impactLng?: number} => {
    const { semiMajorAxis, eccentricity } = elements;
    
    // Calculate closest approach distance (simplified)
    const periapsis = semiMajorAxis * (1 - eccentricity);
    const apoapsis = semiMajorAxis * (1 + eccentricity);
    
    // Earth's orbital radius ~1 AU
    const earthRadius = 1.0;
    const earthRadiusKm = 6371; // Earth radius in km
    const earthRadiusAU = earthRadiusKm / (150 * 1e6); // Convert to AU
    
    // Check if orbit intersects Earth's orbit within tolerance
    if (periapsis <= earthRadius + earthRadiusAU && apoapsis >= earthRadius - earthRadiusAU) {
      // Estimate impact point (simplified)
      const selectedRegion = REGIONS.find(r => r.id === impactRegion);
      return {
        collision: true,
        impactLat: selectedRegion?.lat || 40.0,
        impactLng: selectedRegion?.lng || -100.0
      };
    }
    
    return { collision: false };
  };

  // Calculate impact effects
  const calculateImpactEffects = (): ImpactData => {
    const radius = asteroidSize; // meters
    const density = asteroidDensity; // kg/m³
    const velocity = 17200; // m/s (average impact velocity)
    
    // Mass calculation
    const mass = (4/3) * Math.PI * Math.pow(radius, 3) * density;
    
    // Kinetic energy
    const energy = 0.5 * mass * Math.pow(velocity, 2);
    
    // TNT equivalent (1 ton TNT = 4.184 × 10^9 J)
    const tntEquivalent = energy / (4.184e9);
    
    // Crater diameter using pi-scaling law
    const craterDiameter = radius * 1.61 * Math.pow(density/2700, 1/3) * Math.pow(velocity/1000, 2/3);
    
    // Effect radii (in km)
    const blastRadius = Math.min(craterDiameter * 10 / 1000, 1000);
    const thermalRadius = Math.min(craterDiameter * 5 / 1000, 500);
    const seismicRadius = Math.min(craterDiameter * 20 / 1000, 2000);
    
    // Tsunami radius (if ocean impact)
    const selectedRegion = REGIONS.find(r => r.id === impactRegion);
    const tsunamiRadius = selectedRegion?.id.includes('ocean') 
      ? Math.min(craterDiameter * 15 / 1000, 800) 
      : undefined;
    
    const collisionData = checkCollisionWithEarth(orbitalElements);
    
    return {
      energy,
      tntEquivalent,
      craterDiameter,
      blastRadius,
      thermalRadius,
      seismicRadius,
      tsunamiRadius,
      impactLocation: collisionData.collision ? 
        { lat: collisionData.impactLat || 40.0, lng: collisionData.impactLng || -100.0 } :
        { lat: selectedRegion?.lat || 40.0, lng: selectedRegion?.lng || -100.0 },
      collisionPredicted: collisionData.collision
    };
  };

  // Update collision prediction when parameters change
  useEffect(() => {
    const collisionData = checkCollisionWithEarth(orbitalElements);
    setCollisionPredicted(collisionData.collision);
    setImpactPoint(collisionData.collision ? 
      { lat: collisionData.impactLat || 40.0, lng: collisionData.impactLng || -100.0 } : 
      null
    );
  }, [orbitalElements, impactRegion]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      // Clear canvas
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starfield
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw Sun (center)
      const sunX = canvas.width / 2;
      const sunY = canvas.height / 2;
      
      // Sun glow
      const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
      sunGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
      sunGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Sun core
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Draw Earth orbit
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Earth
      const earthX = sunX + 120;
      const earthY = sunY;
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(earthX, earthY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Calculate asteroid position
      const asteroidPos = calculateOrbitalPosition(time, orbitalElements);
      const asteroidX = sunX + asteroidPos.x * 100;
      const asteroidY = sunY + asteroidPos.y * 100;

      // Draw asteroid trajectory
      const steps = 100;
      ctx.strokeStyle = collisionPredicted ? 'rgba(255, 100, 100, 0.6)' : 'rgba(255, 165, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(asteroidX, asteroidY);
      
      for (let i = 1; i <= steps; i++) {
        const futurePos = calculateOrbitalPosition(time + i, orbitalElements);
        const futureX = sunX + futurePos.x * 100;
        const futureY = sunY + futurePos.y * 100;
        ctx.lineTo(futureX, futureY);
      }
      ctx.stroke();

      // Draw asteroid
      const asteroidDrawSize = Math.max(8, asteroidSize / 10);
      
      // Asteroid glow
      const asteroidGradient = ctx.createRadialGradient(asteroidX, asteroidY, 0, asteroidX, asteroidY, asteroidDrawSize * 2);
      asteroidGradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)');
      asteroidGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
      ctx.fillStyle = asteroidGradient;
      ctx.beginPath();
      ctx.arc(asteroidX, asteroidY, asteroidDrawSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Asteroid body
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.arc(asteroidX, asteroidY, asteroidDrawSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw collision warning
     if (collisionPredicted) {
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ COLLISION PREDICTED ⚠️', canvas.width / 2, 50);
      }

      // Draw orbital parameters
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      
      ctx.fillText(`Semi-Major Axis: ${orbitalElements.semiMajorAxis.toFixed(2)} AU`, 20, 70);
      ctx.fillText(`Eccentricity: ${orbitalElements.eccentricity.toFixed(2)}`, 20, 90);
      ctx.fillText(`Inclination: ${orbitalElements.inclination.toFixed(1)}°`, 20, 110);
      ctx.fillText(`Arg. of Periapsis: ${orbitalElements.argumentOfPeriapsis.toFixed(1)}°`, 20, 130);
      ctx.fillText(`Asteroid Size: ${asteroidSize}m radius`, 20, 150);
      ctx.fillText(`Target Region: ${REGIONS.find(r => r.id === impactRegion)?.label}`, 20, 170);
      
      if (collisionPredicted && impactPoint) {
        ctx.fillStyle = '#ff4757';
        ctx.fillText(`Impact Location: ${impactPoint.lat.toFixed(1)}°N, ${impactPoint.lng.toFixed(1)}°E`, 20, 190);
      }

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate(0);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [orbitalElements, asteroidSize, collisionPredicted, isAnimating, impactRegion]);

  const handleSimulate = () => {
    const impactData = calculateImpactEffects();
    const asteroidParams = {
      size: asteroidSize,
      velocity: 17.2, // km/s
      density: asteroidDensity,
      region: REGIONS.find(r => r.id === impactRegion),
      orbitalElements: orbitalElements,
      collisionPredicted: collisionPredicted,
      timeToImpact: timeToImpact
    };
    
    onSimulate(asteroidParams, impactData);
  };

  return (
    <div className="orbital-simulator">
      <div className="simulator-header">
        <h2>🌌 Orbital Trajectory Simulator</h2>
        <p>Configure asteroid orbital elements and predict collision trajectory with Earth</p>
      </div>

      <div className="simulator-content">
        {/* Main visualization */}
        <div className="visualization-container">
          <canvas
            ref={canvasRef}
            width={1000}
            height={600}
            className="orbital-canvas"
          />
          
          {/* Status panel */}
          <div className="status-panel">
            <div className={`collision-status ${collisionPredicted ? 'danger' : 'safe'}`}>
              {collisionPredicted ? '🚨 COLLISION PREDICTED' : '✅ SAFE TRAJECTORY'}
            </div>
            <div className="time-display">
              Time to Impact: {timeToImpact} days
            </div>
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

            <h4>Physical Properties</h4>
            
            <div className="control-group">
              <label htmlFor="size-slider">
                Asteroid Radius: {asteroidSize}m
              </label>
              <input
                id="size-slider"
                type="range"
                min="10"
                max="500"
                step="5"
                value={asteroidSize}
                onChange={(e) => setAsteroidSize(parseInt(e.target.value))}
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
              <label htmlFor="region-select">Impact Region</label>
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
          </div>

          {/* Impact Prediction */}
          <div className="impact-preview">
            <h3>Impact Prediction</h3>
            {(() => {
              const impact = calculateImpactEffects();
              return (
                <div className="impact-stats">
                  <div className="collision-status">
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
          >
            🚀 Simulate Impact Scenario
          </button>
        </div>
      </div>
    </div>
  );
}
