import React, { useState, useEffect, useRef } from 'react';
import './DeflectionMission.css';

interface DeflectionMissionProps {
  asteroidParams: any;
  onSuccess: (success: boolean) => void;
}

interface AsteroidData {
  size: number; // radius in meters
  velocity: number; // km/s
  density?: number; // kg/m³
  mass?: number; // kg
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
  const [selectedMethod, setSelectedMethod] = useState<'kinetic' | 'gravity' | 'nuclear'>('kinetic');

  // Calculate mission parameters
  const missionTypes = [
    { id: 'kinetic', name: 'Kinetic Impactor', effort: 'Medium', effectiveness: 0.85, leadTimeRequired: 180 },
    { id: 'gravity', name: 'Gravity Tractor', effort: 'High', effectiveness: 0.70, leadTimeRequired: 365 },
    { id: 'nuclear', name: 'Nuclear Deflection', effort: 'Low', effectiveness: 0.95, leadTimeRequired: 90 }
  ];

  const selectedType = missionTypes.find(m => m.id === selectedMethod) || missionTypes[0];
  
  // Calculate asteroid mass if not provided
  const asteroidMass = asteroidParams?.mass || (() => {
    const radius = asteroidParams?.size || 75; // meters
    const density = asteroidParams?.density || 2600; // kg/m³
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    return volume * density;
  })();
  
  const asteroidVelocity = asteroidParams?.velocity || 17.2; // km/s

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

  // Calculate required deltaV for 1 Earth radius deflection
  const calculateRequiredDeltaV = (): number => {
    // Required deltaV = (mass * velocity) / (lead time in seconds)
    const leadTimeSeconds = timeBeforeImpact * 86400; // days to seconds
    const velocityMS = asteroidVelocity * 1000; // km/s to m/s
    return (asteroidMass * velocityMS) / leadTimeSeconds / 1e9; // Scaled for reasonable values
  };
  
  // Calculate success probability dynamically
  const calculateSuccessProbability = (): number => {
    const requiredDeltaV = calculateRequiredDeltaV();
    
    // Lead time factor (more time = higher success)
    const leadTimeFactor = Math.min(1, timeBeforeImpact / selectedType.leadTimeRequired);
    
    // DeltaV factor (adequate deltaV = higher success)
    const deltaVFactor = Math.min(1, deltaV / requiredDeltaV);
    
    // Combined probability
    const probability = selectedType.effectiveness * leadTimeFactor * deltaVFactor;
    
    return Math.max(0, Math.min(1, probability));
  };
  
  // Calculate deflection distance
  const calculateDeflectionDistance = (): number => {
    // Deflection distance = (deltaV / velocity) * lead time * velocity
    const velocityMS = asteroidVelocity * 1000; // m/s
    const leadTimeSeconds = timeBeforeImpact * 86400;
    return (deltaV / velocityMS) * leadTimeSeconds / 1000; // km
  };
  
  const successProbability = calculateSuccessProbability();
  const deflectionDistance = calculateDeflectionDistance();
  const requiredDeltaV = calculateRequiredDeltaV();

  const calculateDeflectionResult = (): DeflectionResult => {
    const success = successProbability > 0.7;
    
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
              <p>Success Probability: {(successProbability * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {missionStage === 'planning' && (
          <div className="mission-controls">
            <h3>Mission Parameters</h3>
            
            <div className="mission-setup">
              <h4>Method Selection</h4>
              <div className="mission-methods">
                {missionTypes.map((method) => (
                  <div 
                    key={method.id}
                    className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(method.id as any)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h5>{method.name}</h5>
                    <p>{method.id === 'kinetic' ? 'Direct spacecraft impact' : method.id === 'gravity' ? 'Gravitational attraction' : 'Mounted explosive device'}</p>
                    <span className={`effort-badge ${method.effort.toLowerCase()}`}>{method.effort} Effort</span>
                    <div className="method-stats">
                      <small>Effectiveness: {(method.effectiveness * 100).toFixed(0)}%</small>
                      <small>Lead Time: {method.leadTimeRequired} days</small>
                    </div>
                  </div>
                ))}
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
                  <strong>Target:</strong> Asteroid 2025-IMPCTOR ({(asteroidParams?.size || 75).toFixed(0)}m radius)
                </div>
                <div className="plan-item">
                  <strong>Mass:</strong> {(asteroidMass / 1e9).toFixed(2)} billion kg
                </div>
                <div className="plan-item">
                  <strong>Approach Velocity:</strong> {asteroidVelocity.toFixed(1)} km/s
                </div>
                <div className="plan-item">
                  <strong>Required ΔV:</strong> {requiredDeltaV.toFixed(2)} m/s
                </div>
                <div className="plan-item">
                  <strong>Estimated Deflection:</strong> {deflectionDistance.toFixed(1)} km
                </div>
                <div className="plan-item">
                  <strong>Risk Assessment:</strong> {successProbability > 0.8 ? 'Low' : successProbability > 0.5 ? 'Medium' : 'High'}
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
