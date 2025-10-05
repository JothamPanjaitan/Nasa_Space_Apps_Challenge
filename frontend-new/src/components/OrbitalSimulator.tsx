import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OrbitRenderer from './OrbitRenderer';
import CesiumGlobe from './CesiumGlobe';
import { neoDataToOrbitalElements, formatOrbitalElements } from '../lib/orbitPhysics';
import { getWorkerManager } from '../lib/workerManager';
import type { NEOData, OrbitalElements } from '../types/impact';
import Tooltip from './Tooltip';
import './OrbitalSimulator.css';

interface OrbitalSimulatorProps {
  onNavigateToImpact?: (asteroid: any) => void;
}

export default function OrbitalSimulator({ onNavigateToImpact }: OrbitalSimulatorProps) {
  const API_BASE_URL = (process.env.REACT_APP_API_URL as string) || 'http://localhost:4000';
  const [neoList, setNeoList] = useState<NEOData[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<NEOData | null>(null);
  const [orbitalElements, setOrbitalElements] = useState<OrbitalElements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const workerManager = useMemo(() => getWorkerManager(), []);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNEOData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/neo/browse`);
        if (!response.ok) {
          throw new Error(`Failed to fetch NEO data: ${response.status}`);
        }
        
        const data = await response.json();
        const neos = data?.near_earth_objects ?? [];
        
        if (neos.length === 0) {
          throw new Error('No NEO data received');
        }
        
        setNeoList(neos);
        
        // Select first asteroid by default
        if (neos.length > 0) {
          setSelectedAsteroid(neos[0]);
        }
      } catch (err) {
        console.error('Error loading NEO data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load asteroid data');
        
        // Fallback to mock data
        const mockNeos: NEOData[] = [
          {
            id: 'mock-1',
            name: 'Mock Asteroid 2025-IMPCTOR',
            estimated_diameter: {
              meters: {
                estimated_diameter_min: 100,
                estimated_diameter_max: 200
              }
            },
            close_approach_data: [{
              close_approach_date: '2025-10-15',
              close_approach_date_full: '2025-Oct-15 12:00',
              relative_velocity: {
                kilometers_per_second: '20.0'
              },
              miss_distance: {
                kilometers: '384400'
              },
              orbiting_body: 'Earth'
            }],
            orbital_data: {
              orbit_id: '1',
              orbit_determination_date: '2025-01-01',
              first_observation_date: '2024-01-01',
              last_observation_date: '2025-01-01',
              data_arc_in_days: 365,
              observations_used: 100,
              orbit_uncertainty: '0',
              minimum_orbit_intersection: '0.05',
              jupiter_tisserand_invariant: '3.2',
              epoch_osculation: '2025-01-01',
              eccentricity: '0.3',
              semi_major_axis: '1.2',
              inclination: '5.0',
              ascending_node_longitude: '45.0',
              orbital_period: '365.25',
              perihelion_distance: '0.84',
              perihelion_argument: '90.0',
              aphelion_distance: '1.56',
              perihelion_time: '2025-01-01',
              mean_anomaly: '0.0',
              mean_motion: '0.9856',
              equinox: 'J2000',
              orbit_class: {
                orbit_class_type: 'AMO',
                orbit_class_description: 'Amor-class asteroid',
                orbit_class_range: '1.017 < a < 1.3 AU'
              }
            },
            is_potentially_hazardous_asteroid: true,
            is_sentry_object: false
          }
        ];
        
        setNeoList(mockNeos);
        setSelectedAsteroid(mockNeos[0]);
      } finally {
        setLoading(false);
      }
    };

    loadNEOData();
  }, []);

  useEffect(() => {
    if (selectedAsteroid?.orbital_data) {
      const elements = neoDataToOrbitalElements(selectedAsteroid);
      setOrbitalElements(elements);
    } else {
      setOrbitalElements(null);
    }
  }, [selectedAsteroid]);

  const handleAsteroidSelect = (asteroid: NEOData | null) => {
    setSelectedAsteroid(asteroid);
  };

  const handleNavigateToImpact = () => {
    if (selectedAsteroid && onNavigateToImpact) {
      onNavigateToImpact(selectedAsteroid);
    } else {
      navigate('/impact', { 
        state: { 
          asteroid: selectedAsteroid,
          from: 'simulator'
        } 
      });
    }
  };

  const handleNavigateToGame = () => {
    navigate('/game', { 
      state: { 
        asteroid: selectedAsteroid,
        from: 'simulator'
      } 
    });
  };

  const orbitalInfo = useMemo(() => {
    if (!orbitalElements) return null;
    return formatOrbitalElements(orbitalElements);
  }, [orbitalElements]);

  if (loading) {
    return (
      <div className="orbital-simulator">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Asteroid Data...</h2>
          <p>Fetching real-time NEO data from NASA</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orbital-simulator">
      <div className="simulator-header">
        <h1>🛰️ Asteroid Live Data</h1>
        <p>Real-time NASA Near-Earth Object data with 3D orbital visualization</p>
      </div>

      <div className="simulator-content">
        <div className="controls-panel">
          <div className="asteroid-selector">
            <h3>
              Select Near-Earth Object{' '}
              <Tooltip content="Choose from real NASA NEO data. Potentially hazardous asteroids are marked with ⚠️">
                <span style={{ cursor: 'help', fontSize: '0.8em' }}>ℹ️</span>
              </Tooltip>
            </h3>
            {error && (
              <div className="error-message">
                ⚠️ "{error}"
              </div>
            )}
            <select
              value={selectedAsteroid?.id || ''}
              onChange={(e) => {
                const asteroid = neoList.find(n => n.id === e.target.value);
                handleAsteroidSelect(asteroid ?? null);
              }}
              className="asteroid-select"
            >
              <option value="">Select an asteroid...</option>
              {neoList.map(neo => (
                <option key={neo.id} value={neo.id}>
                  {neo.name} 
                  {neo.is_potentially_hazardous_asteroid && ' ⚠️'}
                </option>
              ))}
            </select>
          </div>

          {selectedAsteroid && (
            <>
              <div className="asteroid-info">
                <h3>📊 Asteroid Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedAsteroid.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Diameter:</span>
                    <span className="value">
                      {selectedAsteroid.estimated_diameter?.meters?.estimated_diameter_max 
                        ? `${(selectedAsteroid.estimated_diameter.meters.estimated_diameter_max / 1000).toFixed(2)} km`
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Velocity:</span>
                    <span className="value">
                      {selectedAsteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second 
                        ? `${parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(1)} km/s`
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Miss Distance:</span>
                    <span className="value">
                      {selectedAsteroid.close_approach_data?.[0]?.miss_distance?.kilometers
                        ? `${(parseFloat(selectedAsteroid.close_approach_data[0].miss_distance.kilometers) / 384400).toFixed(2)} LD`
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Approach Date:</span>
                    <span className="value">
                      {selectedAsteroid.close_approach_data?.[0]?.close_approach_date_full || 'Unknown'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Hazardous:</span>
                    <span className={`value ${selectedAsteroid.is_potentially_hazardous_asteroid ? 'hazardous' : 'safe'}`}>
                      {selectedAsteroid.is_potentially_hazardous_asteroid ? '⚠️ Yes' : '✅ No'}
                    </span>
                  </div>
                </div>
              </div>

              {orbitalInfo && (
                <div className="orbital-data">
                  <h3>🛸 Orbital Elements</h3>
                  <div className="orbital-grid">
                    {Object.entries(orbitalInfo).map(([key, value]) => (
                      <div key={key} className="orbital-item">
                        <span className="orbital-label">{key}:</span>
                        <span className="orbital-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="simulator-info">
            <h3>ℹ️ About This Simulator</h3>
            <div className="info-content">
              <p>
                This 3D orbital simulator uses real NASA Near-Earth Object data to visualize 
                asteroid orbits around the Sun. The visualization shows:
              </p>
              <ul>
                <li>🟡 Earth and its atmosphere</li>
                <li>🟠 Selected asteroid with orbital path</li>
                <li>⭐ Stellar background</li>
                <li>📊 Real-time orbital elements</li>
              </ul>
              <p>
                <strong>Note:</strong> Orbital paths are simplified for visualization. 
                For operational predictions, consult NASA's JPL Horizons system.
              </p>
            </div>
          </div>
        </div>

        <div className="visualization-container">
          <CesiumGlobe 
            selectedAsteroid={selectedAsteroid}
            orbitalElements={orbitalElements}
          />
          
          {!selectedAsteroid && (
            <div className="no-selection-overlay" style={{ pointerEvents: 'none' }}>
              <div className="overlay-content" style={{ pointerEvents: 'auto' }}>
                <h2>🌍 Interactive Globe</h2>
                <p>Select an asteroid to view its trajectory and potential impact zones</p>
                <div className="features-list">
                  <div className="feature">🛰️ Real NASA Data</div>
                  <div className="feature">🌍 Zoomable Globe</div>
                  <div className="feature">🗺️ Country Labels</div>
                  <div className="feature">⚠️ Impact Zones</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
