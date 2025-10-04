import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Simplified 2D orbital visualization component
function OrbitalVisualization({ asteroid, isDeflected = false, onTrajectoryUpdate }) {
  const [trajectory, setTrajectory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (asteroid && asteroid.orbital_elements) {
      simulateOrbit(asteroid.orbital_elements);
    }
  }, [asteroid]);

  const simulateOrbit = async (orbitalElements) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/orbit/simulate', {
        orbital_elements: orbitalElements,
        time_steps: 50,
        time_span: 365 * 24 * 3600 // 1 year
      });
      
      const trajectoryData = response.data.trajectory;
      
      // Scale trajectory for 2D visualization
      const scaledTrajectory = trajectoryData.map(point => ({
        x: (point.position.x / 1.496e8) * 200 + 250, // Convert km to pixels
        y: (point.position.y / 1.496e8) * 200 + 250,
        z: point.position.z / 1.496e8
      }));
      
      setTrajectory(scaledTrajectory);
      
      if (onTrajectoryUpdate) {
        onTrajectoryUpdate(scaledTrajectory);
      }
    } catch (error) {
      console.error('Error simulating orbit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '500px', 
      border: '1px solid #333',
      background: 'linear-gradient(to bottom, #000011, #000033)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Sun */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '20px',
        height: '20px',
        background: '#ffff00',
        borderRadius: '50%',
        boxShadow: '0 0 20px #ffff00',
        zIndex: 3
      }} />
      
      {/* Earth */}
      <div style={{
        position: 'absolute',
        left: 'calc(50% + 100px)',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '15px',
        height: '15px',
        background: '#4A90E2',
        borderRadius: '50%',
        zIndex: 3
      }} />
      
      {/* Asteroid */}
      {asteroid && (
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 150px)',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '8px',
          height: '8px',
          background: isDeflected ? '#ff6b6b' : '#ffa500',
          borderRadius: '50%',
          boxShadow: `0 0 10px ${isDeflected ? '#ff6b6b' : '#ffa500'}`,
          zIndex: 3,
          animation: 'pulse 2s infinite'
        }} />
      )}
      
      {/* Trajectory Path */}
      {trajectory.length > 0 && (
        <svg 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            zIndex: 1
          }}
        >
          <path
            d={`M ${trajectory[0].x} ${trajectory[0].y} ${trajectory.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')}`}
            stroke={isDeflected ? "#ff6b6b" : "#ffffff"}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </svg>
      )}
      
      {/* Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        zIndex: 0
      }} />
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px',
          background: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '10px'
        }}>
          Calculating orbital trajectory...
        </div>
      )}
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 4
      }}>
        <div>🟡 Sun (center)</div>
        <div>🌍 Earth (1.5 AU)</div>
        <div>☄️ Asteroid trajectory</div>
        {isDeflected && <div>🟢 Deflected path</div>}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default OrbitalVisualization;
