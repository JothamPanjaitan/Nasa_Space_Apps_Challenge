import React, { useState, useEffect, useRef } from 'react';
import './DeflectionMission.css';

interface DeflectionMissionProps {
  asteroidParams: any;
  onSuccess: (success: boolean) => void;
}

interface DeflectionResult {
  attempted: boolean;
  success: boolean;
  deflectionDistance: number;
  reason: string;
}

export default function DeflectionMission({ asteroidParams, onSuccess }: DeflectionMissionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [missionStage, setMissionStage] = useState<'planning' | 'launch' | 'impact' | 'success' | 'failure'>('planning');
  const [deltaV, setDeltaV] = useState<number>(0.5);
  const [timeBeforeImpact, setTimeBeforeImpact] = useState<number>(180); // days
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  // Calculate mission parameters
  const missionTypes = [
    { name: 'Kinetic Impactor', effort: 'Medium', effectiveness: 0.8 },
    { name: 'Gravity Tractor', effort: 'High', effectiveness: 0.6 },
    { name: 'Nuclear Deflection', effort: 'Low', effectiveness: 1.0 }
  ];

  const selectedType = missionTypes[Math.floor(timeBeforeImpact / 60) % missionTypes.length];

  // Animation loop for mission visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 0.5, 0.5);
      }

      // Draw Earth
      const earthX = canvas.width * 0.7;
      const earthY = canvas.height * 0.5;
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(earthX, earthY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw asteroid
      const asteroidX = canvas.width * 0.9 - (Date.now() * 0.02) % (canvas.width * 0.4);
      const asteroidY = earthY - 60 + Math.sin(Date.now() * 0.001) * 0;
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.arc(asteroidX, asteroidY - 60, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw spacecraft
      if (missionStage !== 'planning') {
        const craftX = asteroidX - 40;
        const craftY = asteroidY - 40;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(craftX, craftY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw trajectory line
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(craftX, craftY);
        ctx.lineTo(asteroidX, asteroidY - 60);
        ctx.stroke();
        ctx.setLineDash([]);
      }

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
  }, [missionStage, isAnimating]);

  const calculateDeflectionResult = (): DeflectionResult => {
    // Simplified deflection calculation
    const requiredDeltaV = 2.0; // m/s required for success
    const timeFactor = Math.max(0.1, timeBeforeImpact / 60);
    const deltaVFactor = deltaV / requiredDeltaV;
    
    const successProbability = deltaVFactor * timeFactor * selectedType.effectiveness;
    const success = successProbability > 0.7;
    
    const deflectionDistance = success ? 
      Math.random() * 10000 + 10000 : // 10,000-20,000 km
      Math.random() * 1000; // 0-1,000 km
    
    return {
      attempted: true,
      success: success,
      deflectionDistance: deflectionDistance,
      reason: success ? 'Sufficient velocity change applied!' : 'Insufficient deflection achieved'
    };
  };

  const launchMission = () => {
    setMissionStage('launch');
    setTimeout(() => {
      setMissionStage('impact');
      setTimeout(() => {
        const result = calculateDeflectionResult();
        setMissionStage(result.success ? 'success' : 'failure');
        setTimeout(() => {
          onSuccess(result.success);
        }, 3000);
      }, 2000);
    }, 2000);
  };

  if (missionStage === 'success') {
    return (
      <div className="mission-result mission-success">
        <div className="space-background-success">
          <div className="stars">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} className={`star star-${i % 3}`}></div>
            ))}
          </div>
        </div>
        
        <div className="result-content">
          <h1>🎉 Mission Success!</h1>
          <p>The deflection mission was successful!</p>
          <p>The asteroid has been deflected by {deltaV.toFixed(1)} m/s and will miss Earth completely.</p>
          <p>Humanity celebrates this triumph of international cooperation!</p>
        </div>
      </div>
    );
  }

  if (missionStage === 'failure') {
    return (
      <div className="mission-result mission-failure">
        <div className="space-background-failure">
          <div className="stars">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} className={`star star-${i % 3}`}></div>
            ))}
          </div>
        </div>
        
        <div className="result-content">
          <h1>⚠️ Mission Partial Success</h1>
          <p>The deflection attempt reduced the impact energy, but wasn't sufficient to prevent collision.</p>
          <p>Some deflection was achieved - impact location may have shifted.</p>
          <p>Civil protection measures remain critical.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deflection-mission">
      <div className="space-background">
        <div className="stars">
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className={`star star-${i % 3}`}></div>
          ))}
        </div>
        
        {/* Earth */}
        <div className="earth-distant">
          <div className="earth-glow"></div>
          <div className="earth-surface"></div>
        </div>
      </div>

      <div className="mission-content">
        <div className="visualization-section">
          <h2>🚀 Deflection Mission</h2>
          
          <div className="mission-visualization">
            <canvas ref={canvasRef} width={600} height={350} />
            
            <div className="mission-status">
              <h4>Mission Status: {missionStage.toUpperCase()}</h4>
              <p>Selected Method: {selectedType.name}</p>
              <p>Required Effort: {selectedType.effort}</p>
              <p>Success Probability: {(deltaV * 0.4 * timeBeforeImpact / 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {missionStage === 'planning' && (
          <div className="mission-controls">
            <h3>Mission Parameters</h3>
            
            <div className="mission-setup">
              <h4>Method Selection</h4>
              <div className="mission-methods">
                <div className="method-card">
                  <h5>Kinetic Impactor</h5>
                  <p>Direct spacecraft impact</p>
                  <span className="effort-badge medium">Medium Effort</span>
                </div>
                <div className="method-card">
                  <h5>Gravity Tractor</h5>
                  <p>Gravitational attraction</p>
                  <span className="effort-badge high">High Effort</span>
                </div>
                <div className="method-card">
                  <h5>Nuclear Deflection</h5>
                  <p>Mounted explosive device</p>
                  <span className="effort-badge low">Low Effort</span>
                </div>
              </div>
            </div>

            <div className="parameter-controls">
              <div className="control-group">
                <label>Delta-V (m/s)</label>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={deltaV}
                  onChange={(e) => setDeltaV(parseFloat(e.target.value))}
                />
                <span>{deltaV.toFixed(1)} m/s</span>
              </div>

              <div className="control-group">
                <label>Time Before Impact (days)</label>
                <input
                  type="range"
                  min="30"
                  max="365"
                  value={timeBeforeImpact}
                  onChange={(e) => setTimeBeforeImpact(parseInt(e.target.value))}
                />
                <span>{timeBeforeImpact} days</span>
              </div>
            </div>

            <div className="mission-plan">
              <h4>Mission Plan</h4>
              <div className="plan-details">
                <div className="plan-item">
                  <strong>Target:</strong> Asteroid 2025-IMPCTOR ({asteroidParams?.size.toFixed(0)}m radius)
                </div>
                <div className="plan-item">
                  <strong>Approach Velocity:</strong> {asteroidParams?.velocity.toFixed(0)} km/s
                </div>
                <div className="plan-item">
                  <strong>Estimated Deflection:</strong> {(deltaV * timeBeforeImpact * 0.01).toFixed(0)} km
                </div>
                <div className="plan-item">
                  <strong>Risk Assessment:</strong> {deltaV > 2.0 && timeBeforeImpact > 120 ? 'Low' : 'Medium'}
                </div>
              </div>
            </div>

            <button className="launch-button" onClick={launchMission}>
              🚀 Launch Deflection Mission
            </button>
          </div>
        )}

        {missionStage === 'launch' && (
          <div className="mission-ongoing">
            <h3>Mission in Progress...</h3>
            <div className="launch-animation">
              <div className="progress-bar">
                <div className="progress"></div>
              </div>
              <p>Deploying spacecraft...</p>
            </div>
          </div>
        )}

        {missionStage === 'impact' && (
          <div className="mission-impact">
            <h3>Deflection Impact Imminent!</h3>
            <div className="impact-animation">
              <div className="impact-flash"></div>
              <p>Applying delta-v to asteroid...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
