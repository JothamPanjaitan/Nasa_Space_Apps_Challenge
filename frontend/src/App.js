import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import OrbitalVisualization from './OrbitalVisualization';
import StorySystem from './StorySystem';
import './App.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom asteroid icon
const asteroidIcon = new L.DivIcon({
  className: 'asteroid-marker',
  html: '☄️',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Custom impact zone icon
const impactZoneIcon = new L.DivIcon({
  className: 'impact-zone',
  html: '💥',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

function App() {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [asteroid, setAsteroid] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [deflectionData, setDeflectionData] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [show3D, setShow3D] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [liveAsteroids, setLiveAsteroids] = useState([]);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlOptimization, setMlOptimization] = useState(null);
  
  // Deflection parameters
  const [deltaV, setDeltaV] = useState(0.1);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [impactLocation, setImpactLocation] = useState({ lat: 25.7617, lng: -80.1918 });

  // Load initial scenario
  useEffect(() => {
    loadScenario('scenario_1');
  }, []);

  const loadScenario = async (scenarioId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://localhost:5001/api/story/next?scenario_id=${scenarioId}`);
      const scenario = response.data;
      setCurrentScenario(scenario);
      
      // Load asteroid data
      const asteroidResponse = await axios.get(`http://localhost:5001/api/neo/${scenario.asteroid_id}`);
      setAsteroid(asteroidResponse.data);
      
      // Set initial impact location to first target city
      if (scenario.target_cities.length > 0) {
        const city = scenario.target_cities[0];
        setImpactLocation({ lat: city.lat, lng: city.lon });
      }
      
      setTimeRemaining(scenario.time_to_impact);
    } catch (err) {
      setError('Failed to load scenario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateImpact = async () => {
    if (!asteroid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5001/api/simulate', {
        diameter: asteroid.diameter,
        velocity: asteroid.velocity,
        density: asteroid.density,
        impact_lat: impactLocation.lat,
        impact_lon: impactLocation.lng
      });
      
      setImpactData(response.data);
    } catch (err) {
      setError('Failed to simulate impact: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deflectAsteroid = async () => {
    if (!asteroid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5001/api/deflect', {
        delta_v: deltaV,
        time_before_impact: timeRemaining,
        original_lat: impactLocation.lat,
        original_lon: impactLocation.lng,
        velocity: asteroid.velocity
      });
      
      setDeflectionData(response.data);
      
      // Calculate score
      const scoreResponse = await axios.post('http://localhost:5001/api/score', {
        population_saved: currentScenario?.population_at_risk || 0,
        time_remaining: timeRemaining,
        deflection_distance: response.data.deflection.distance_shifted
      });
      
      setScore(scoreResponse.data.score);
    } catch (err) {
      setError('Failed to deflect asteroid: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextScenario = () => {
    const scenarios = ['scenario_1', 'scenario_2'];
    const currentIndex = scenarios.indexOf(currentScenario?.id);
    const nextIndex = (currentIndex + 1) % scenarios.length;
    loadScenario(scenarios[nextIndex]);
    setDeflectionData(null);
    setImpactData(null);
    setScore(0);
  };

  const loadLiveAsteroids = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/neo/live?limit=5');
      setLiveAsteroids(response.data);
    } catch (err) {
      console.error('Failed to load live asteroids:', err);
    }
  };

  const getMlPrediction = async () => {
    if (!asteroid) return;
    
    try {
      const response = await axios.post('http://localhost:5001/api/ml/predict-impact', {
        diameter: asteroid.diameter,
        velocity: asteroid.velocity,
        density: asteroid.density,
        impact_angle: 45
      });
      setMlPrediction(response.data);
    } catch (err) {
      console.error('ML prediction failed:', err);
    }
  };

  const getMlOptimization = async () => {
    if (!asteroid) return;
    
    try {
      const response = await axios.post('http://localhost:5001/api/ml/optimize-deflection', {
        diameter: asteroid.diameter,
        velocity: asteroid.velocity,
        time_remaining: timeRemaining,
        impact_distance: 1000
      });
      setMlOptimization(response.data);
    } catch (err) {
      console.error('ML optimization failed:', err);
    }
  };

  const handleDiscovery = (discovery) => {
    console.log('New discovery:', discovery);
    // Handle story discovery
  };

  const handleTimeLoop = (loopNumber) => {
    console.log(`Time loop ${loopNumber} started`);
    // Handle time loop mechanics
  };

  const handleStoryProgress = (progress) => {
    console.log(`Story progress: ${progress}%`);
    // Handle story progression
  };

  if (loading) {
    return <div className="loading">Loading scenario...</div>;
  }

  return (
    <div className="App">
      <h1>🚀 NASA Asteroid Deflection Game - Outer Wilds Edition</h1>
      
      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={!show3D && !showStory ? 'active' : ''} 
          onClick={() => { setShow3D(false); setShowStory(false); }}
        >
          🎮 Game
        </button>
        <button 
          className={show3D ? 'active' : ''} 
          onClick={() => { setShow3D(true); setShowStory(false); }}
        >
          🌌 3D Orbit
        </button>
        <button 
          className={showStory ? 'active' : ''} 
          onClick={() => { setShow3D(false); setShowStory(true); }}
        >
          📖 Story
        </button>
        <button onClick={loadLiveAsteroids}>
          🛰️ Live Data
        </button>
      </div>

      {/* Story System */}
      {showStory && (
        <div className="story-container">
          <StorySystem 
            onDiscovery={handleDiscovery}
            onTimeLoop={handleTimeLoop}
            onStoryProgress={handleStoryProgress}
          />
        </div>
      )}

      {/* 3D Visualization */}
      {show3D && (
        <div className="visualization-container">
          <OrbitalVisualization 
            asteroid={asteroid}
            isDeflected={deflectionData?.deflection.success}
          />
        </div>
      )}

      {/* Main Game Interface */}
      {!show3D && !showStory && (
        <>
          {/* Story Panel */}
          {currentScenario && (
            <div className="story-panel">
              <h2>{currentScenario.title}</h2>
              <p>{currentScenario.description}</p>
              <div className="score-display">
                Score: {score.toLocaleString()}
              </div>
              {error && <div className="error">{error}</div>}
            </div>
          )}

      {/* Game Panel */}
      {asteroid && (
        <div className="game-panel">
          <h3>Asteroid Data</h3>
          <p><strong>Name:</strong> {asteroid.name}</p>
          <p><strong>Diameter:</strong> {asteroid.diameter}m</p>
          <p><strong>Velocity:</strong> {asteroid.velocity.toLocaleString()} m/s</p>
          <p><strong>Density:</strong> {asteroid.density} kg/m³</p>
          
          {impactData && (
            <div className="impact-results">
              <h4>Impact Effects</h4>
              <p><strong>Energy:</strong> {(impactData.impact.kinetic_energy / 1e15).toFixed(2)} PJ</p>
              <p><strong>TNT Equivalent:</strong> {(impactData.impact.tnt_equivalent / 1e6).toFixed(2)} MT</p>
              <p><strong>Crater Diameter:</strong> {(impactData.impact.crater_diameter / 1000).toFixed(2)} km</p>
              <p><strong>Earthquake:</strong> {impactData.impact.earthquake_magnitude.toFixed(1)} Mw</p>
            </div>
          )}
          
          {deflectionData && (
            <div className="deflection-results">
              <h4>Deflection Results</h4>
              <p><strong>Distance Shifted:</strong> {deflectionData.deflection.distance_shifted.toFixed(2)} km</p>
              <p><strong>Success:</strong> {deflectionData.deflection.success ? '✅ Yes' : '❌ No'}</p>
            </div>
          )}

          {/* ML Predictions */}
          <div className="ml-panel">
            <h4>🤖 AI Predictions</h4>
            <button onClick={getMlPrediction} disabled={loading}>
              Predict Impact Effects
            </button>
            <button onClick={getMlOptimization} disabled={loading}>
              Optimize Deflection
            </button>
            
            {mlPrediction && (
              <div className="ml-prediction">
                <h5>ML Impact Prediction</h5>
                <p><strong>Crater Diameter:</strong> {(mlPrediction.prediction.crater_diameter / 1000).toFixed(2)} km</p>
                <p><strong>Earthquake Magnitude:</strong> {mlPrediction.prediction.earthquake_magnitude.toFixed(1)} Mw</p>
                <p><strong>TNT Equivalent:</strong> {(mlPrediction.prediction.tnt_equivalent / 1e6).toFixed(2)} MT</p>
                <p><strong>Confidence:</strong> {(mlPrediction.confidence * 100).toFixed(0)}%</p>
              </div>
            )}

            {mlOptimization && (
              <div className="ml-optimization">
                <h5>ML Deflection Optimization</h5>
                <p><strong>Optimal Delta-V:</strong> {mlOptimization.optimization.optimal_delta_v.toFixed(3)} m/s</p>
                <p><strong>Expected Deflection:</strong> {mlOptimization.optimization.expected_deflection_distance.toFixed(2)} km</p>
                <p><strong>Success Probability:</strong> {(mlOptimization.optimization.success_probability * 100).toFixed(0)}%</p>
                <p><strong>Confidence:</strong> {(mlOptimization.confidence * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>

          {/* Live Asteroids */}
          {liveAsteroids.length > 0 && (
            <div className="live-asteroids">
              <h4>🛰️ Live NASA Data</h4>
              {liveAsteroids.map((liveAsteroid, index) => (
                <div key={index} className="live-asteroid-item">
                  <strong>{liveAsteroid.name}</strong>
                  <p>Diameter: {liveAsteroid.diameter.toFixed(0)}m | Velocity: {liveAsteroid.velocity.toLocaleString()} m/s</p>
                  <p>Hazardous: {liveAsteroid.hazardous ? '⚠️ Yes' : '✅ No'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div style={{ height: '100vh', width: '100%' }}>
        <MapContainer
          center={[impactLocation.lat, impactLocation.lng]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Target Cities */}
          {currentScenario?.target_cities.map((city, index) => (
            <Marker key={index} position={[city.lat, city.lon]}>
              <Popup>
                <strong>{city.name}</strong><br />
                Population: {city.population.toLocaleString()}
              </Popup>
            </Marker>
          ))}
          
          {/* Original Impact Location */}
          <Marker position={[impactLocation.lat, impactLocation.lng]} icon={asteroidIcon}>
            <Popup>
              <strong>Original Impact Point</strong><br />
              {impactData && (
                <>
                  Energy: {(impactData.impact.kinetic_energy / 1e15).toFixed(2)} PJ<br />
                  TNT: {(impactData.impact.tnt_equivalent / 1e6).toFixed(2)} MT
                </>
              )}
            </Popup>
          </Marker>
          
          {/* Deflected Impact Location */}
          {deflectionData && (
            <Marker position={[deflectionData.new_impact_location.latitude, deflectionData.new_impact_location.longitude]} icon={impactZoneIcon}>
              <Popup>
                <strong>Deflected Impact Point</strong><br />
                Shifted: {deflectionData.deflection.distance_shifted.toFixed(2)} km
              </Popup>
            </Marker>
          )}
          
          {/* Impact Zones */}
          {impactData && (
            <>
              <Circle
                center={[impactLocation.lat, impactLocation.lng]}
                radius={impactData.effects.blast_radius * 1000}
                pathOptions={{ color: '#ff4757', fillColor: '#ff4757', fillOpacity: 0.2 }}
              />
              <Circle
                center={[impactLocation.lat, impactLocation.lng]}
                radius={impactData.effects.thermal_radius * 1000}
                pathOptions={{ color: '#ff6b6b', fillColor: '#ff6b6b', fillOpacity: 0.1 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <button onClick={simulateImpact} disabled={loading}>
          Simulate Impact
        </button>
        
        <div>
          <label>Delta-V (m/s):</label>
          <input
            type="number"
            value={deltaV}
            onChange={(e) => setDeltaV(parseFloat(e.target.value))}
            step="0.01"
            min="0"
            max="10"
          />
        </div>
        
        <div>
          <label>Time (days):</label>
          <input
            type="number"
            value={timeRemaining}
            onChange={(e) => setTimeRemaining(parseInt(e.target.value))}
            min="1"
            max="365"
          />
        </div>
        
        <button onClick={deflectAsteroid} disabled={loading || !impactData}>
          Deflect Asteroid
        </button>
        
        <button onClick={nextScenario}>
          Next Scenario
        </button>
      </div>
        </>
      )}
    </div>
  );
}

export default App;
