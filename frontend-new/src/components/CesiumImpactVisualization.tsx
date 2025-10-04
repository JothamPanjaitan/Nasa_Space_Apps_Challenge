// Advanced Cesium Impact Visualization Component
// Integrates NASA data, accurate physics, and 3D visualization

import React, { useEffect, useRef, useState } from 'react';
import { nasaNeowsService, ProcessedAsteroid } from '../services/nasaNeowsApi';
import { calculateOverpressureProfile, calculateThermalEffects } from '../services/overpressureCalculations';
import { simulateTsunami, isOceanicImpact, estimateWaterDepth } from '../services/tsunamiSimulation';
import { computeImpactEffects, ImpactData } from '../services/simulationEngine';
import './CesiumImpactVisualization.css';

interface CesiumImpactVisualizationProps {
  onReportGenerate?: (data: ImpactData) => void;
}

export const CesiumImpactVisualization: React.FC<CesiumImpactVisualizationProps> = ({
  onReportGenerate
}) => {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  
  // Default asteroids while NASA data loads
  const DEFAULT_ASTEROIDS: ProcessedAsteroid[] = [
    {
      id: 'impactor-2025',
      name: 'Impactor-2025',
      diameterKm: 0.1,
      velocityKmS: 20.0,
      densityKgM3: 3000,
      isHazardous: true,
      approachDate: '2025-10-15',
      missDistanceKm: 384400,
      absoluteMagnitude: 22.0,
      orbitalElements: {
        aAU: 1.2,
        e: 0.3,
        iDeg: 5.0,
        raanDeg: 45.0,
        argPeriDeg: 90.0,
        meanAnomalyDeg: 0.0
      }
    },
    {
      id: 'apophis',
      name: '99942 Apophis',
      diameterKm: 0.37,
      velocityKmS: 12.0,
      densityKgM3: 2600,
      isHazardous: true,
      approachDate: '2029-04-13',
      missDistanceKm: 31000,
      absoluteMagnitude: 19.7,
      orbitalElements: {
        aAU: 0.92,
        e: 0.19,
        iDeg: 3.3,
        raanDeg: 204.4,
        argPeriDeg: 126.4,
        meanAnomalyDeg: 0.0
      }
    },
    {
      id: 'bennu',
      name: '101955 Bennu',
      diameterKm: 0.5,
      velocityKmS: 10.0,
      densityKgM3: 1200,
      isHazardous: false,
      approachDate: '2135-09-25',
      missDistanceKm: 750000,
      absoluteMagnitude: 20.9,
      orbitalElements: {
        aAU: 1.13,
        e: 0.20,
        iDeg: 6.0,
        raanDeg: 2.1,
        argPeriDeg: 66.2,
        meanAnomalyDeg: 0.0
      }
    }
  ];

  const [asteroids, setAsteroids] = useState<ProcessedAsteroid[]>(DEFAULT_ASTEROIDS);
  const [selectedAsteroid, setSelectedAsteroid] = useState<ProcessedAsteroid | null>(DEFAULT_ASTEROIDS[0]);
  const [loading, setLoading] = useState(false);
  const [impactLocation, setImpactLocation] = useState({ lat: 25.7617, lng: -80.1918 });
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load Cesium dynamically
  useEffect(() => {
    const loadCesium = async () => {
      // Note: In production, install cesium package and configure properly
      // For now, we'll use CDN in the HTML
      if (!(window as any).Cesium) {
        console.error('Cesium not loaded. Please include Cesium in your HTML.');
        return;
      }

      const Cesium = (window as any).Cesium;
      
      if (cesiumContainerRef.current && !viewerRef.current) {
        try {
          // Disable Cesium Ion to prevent automatic terrain loading
          Cesium.Ion.defaultAccessToken = undefined;
          
          // Initialize Cesium viewer with basic ellipsoid terrain (no height queries)
          const waitForContainer = async () => {
            while (true) {
              const el = cesiumContainerRef.current;
              if (el && el.clientWidth > 0 && el.clientHeight > 0) return el;
              await new Promise(r => requestAnimationFrame(r));
            }
          };
          
          const containerEl = await waitForContainer();

          viewerRef.current = new Cesium.Viewer(containerEl, {
            animation: false,
            timeline: false,
            baseLayerPicker: false,
            geocoder: false,
            homeButton: true,
            sceneModePicker: true,
            navigationHelpButton: false,
            fullscreenButton: false,
            vrButton: false,
            infoBox: false,
            selectionIndicator: false,
            terrainProvider: new Cesium.EllipsoidTerrainProvider({
              ellipsoid: Cesium.Ellipsoid.WGS84
            }),
            requestRenderMode: true,
            maximumRenderTimeChange: Number.POSITIVE_INFINITY,
            imageryProvider: false
          });

          // Add a simple OpenStreetMap imagery layer (no terrain data)
          viewerRef.current.imageryLayers.addImageryProvider(
            new Cesium.OpenStreetMapImageryProvider({
              url: 'https://a.tile.openstreetmap.org/'
            })
          );

          // Aggressively disable all terrain features to prevent height extraction
          viewerRef.current.scene.globe.depthTestAgainstTerrain = false;
          viewerRef.current.scene.globe.tileCacheSize = 100;
          viewerRef.current.scene.globe.maximumScreenSpaceError = 2;
          
          // Ensure terrain provider stays as ellipsoid
          viewerRef.current.terrainProvider = new Cesium.EllipsoidTerrainProvider();
          
          // Enable lighting for beautiful Earth
          viewerRef.current.scene.globe.enableLighting = true;
        } catch (error) {
          console.error('Error initializing Cesium viewer:', error);
          return;
        }
        
        // Ensure viewer was successfully created
        if (!viewerRef.current) {
          console.error('Cesium viewer failed to initialize');
          return;
        }
        
        // Set initial camera position to see Earth from space
        viewerRef.current.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // 20,000 km altitude
          orientation: {
            heading: 0.0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0.0
          }
        });

        // Enable click to select impact location
        const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas);
        handler.setInputAction((click: any) => {
          try {
            const cartesian = viewerRef.current.camera.pickEllipsoid(
              click.position,
              viewerRef.current.scene.globe.ellipsoid
            );
            
            if (cartesian) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              const lat = Cesium.Math.toDegrees(cartographic.latitude);
              const lng = Cesium.Math.toDegrees(cartographic.longitude);
              setImpactLocation({ lat, lng });
            }
          } catch (error) {
            console.error('Error picking location:', error);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }
    };

    loadCesium().catch(err => console.error('Failed to load Cesium:', err));

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Load NASA asteroids
  useEffect(() => {
    const loadAsteroids = async () => {
      setLoading(true);
      try {
        const data = await nasaNeowsService.getProcessedAsteroids(20);
        setAsteroids(data);
        if (data.length > 0) {
          setSelectedAsteroid(data[0]);
        }
      } catch (error) {
        console.error('Failed to load asteroids:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAsteroids();
  }, []);

  // Visualize orbit and asteroid when selected
  useEffect(() => {
    if (!viewerRef.current || !selectedAsteroid) return;

    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    
    const viewer = viewerRef.current;

    if (!viewer?.scene?.canvas || viewer.scene.canvas.height === 0) {
      // Canvas not ready this tick; skip.
      return;
    }
    
    // Wait for viewer to be ready
    if (!viewer.scene || !viewer.scene.globe) {
      console.log('Viewer not ready yet');
      return;
    }

    // Add a small delay to ensure Cesium is fully initialized
    const timeoutId = setTimeout(() => {
      try {
      // Clear previous orbit and asteroid
      viewer.entities.values
        .filter((e: any) => e.id && (e.id.startsWith('orbit_') || e.id.startsWith('asteroid_')))
        .forEach((e: any) => viewer.entities.remove(e));

      // Enable lighting for better 3D effect
      viewer.scene.globe.enableLighting = true;

      // Draw orbital trajectory (simplified elliptical orbit)
      const { orbitalElements } = selectedAsteroid;
      const positions: any[] = [];
      
      // Sample orbit points
      const numSamples = 200;
      const AU_TO_M = 149597870700; // meters in 1 AU
      
      for (let i = 0; i <= numSamples; i++) {
        const meanAnomaly = (i / numSamples) * 2 * Math.PI;
        const r = orbitalElements.aAU * AU_TO_M * (1 - orbitalElements.e * orbitalElements.e) / 
                  (1 + orbitalElements.e * Math.cos(meanAnomaly));
        
        // Simple 2D orbit in ecliptic plane
        const x = r * Math.cos(meanAnomaly);
        const y = r * Math.sin(meanAnomaly);
        const z = r * Math.sin(orbitalElements.iDeg * Math.PI / 180) * Math.sin(meanAnomaly);
        
        positions.push(new Cesium.Cartesian3(x, y, z));
      }

      // Draw orbit path
      viewer.entities.add({
        id: 'orbit_path',
        polyline: {
          positions: positions,
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.YELLOW
          })
        }
      });

      // Add asteroid model (sphere) at current position
      const currentPos = positions[Math.floor(numSamples / 4)]; // 1/4 along orbit
      
      viewer.entities.add({
        id: 'asteroid_model',
        position: currentPos,
        ellipsoid: {
          radii: new Cesium.Cartesian3(
            selectedAsteroid.diameterKm * 500, // Scale up for visibility
            selectedAsteroid.diameterKm * 500,
            selectedAsteroid.diameterKm * 500
          ),
          material: Cesium.Color.GRAY.withAlpha(0.9),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: selectedAsteroid.name,
          font: '14pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -30),
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
          backgroundPadding: new Cesium.Cartesian2(8, 4)
        }
      });

      // Draw trajectory line from asteroid to Earth
      const earthCenter = new Cesium.Cartesian3(0, 0, 0);
      viewer.entities.add({
        id: 'asteroid_trajectory',
        polyline: {
          positions: [currentPos, earthCenter],
          width: 2,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.RED.withAlpha(0.7),
            dashLength: 16
          })
        }
      });

      // Fly camera to show orbit
      viewer.camera.flyTo({
        destination: new Cesium.Cartesian3(
          orbitalElements.aAU * AU_TO_M * 2,
          orbitalElements.aAU * AU_TO_M * 2,
          orbitalElements.aAU * AU_TO_M
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0
        },
        duration: 3
        });
      } catch (error) {
        console.error('Error visualizing asteroid orbit:', error);
      }
    }, 100); // 100ms delay

    return () => clearTimeout(timeoutId);
  }, [selectedAsteroid]);

  const runSimulation = async () => {
    if (!selectedAsteroid) return;

    setLoading(true);

    try {
      const Cesium = (window as any).Cesium;
      const viewer = viewerRef.current;
      if (!viewer?.scene?.canvas || viewer.scene.canvas.height === 0) {
        // Canvas not ready this tick; skip.
        return;
      }

      // Clear previous impact visualization
      viewer.entities.values
        .filter((e: any) => e.id && e.id.startsWith('impact_'))
        .forEach((e: any) => viewer.entities.remove(e));

      // Calculate impact effects
      const radiusM = (selectedAsteroid.diameterKm * 1000) / 2;
      const impactData = computeImpactEffects(
        radiusM,
        selectedAsteroid.densityKgM3,
        selectedAsteroid.velocityKmS,
        impactLocation
      );

      // Calculate overpressure profile
      const overpressure = calculateOverpressureProfile(impactData.energy);
      
      // Calculate thermal effects
      const thermal = calculateThermalEffects(impactData.energy);

      // Check for tsunami
      let tsunamiData = null;
      if (isOceanicImpact(impactLocation.lat, impactLocation.lng)) {
        const waterDepth = estimateWaterDepth(impactLocation.lat, impactLocation.lng);
        tsunamiData = simulateTsunami({
          impactLocation,
          energyJoules: impactData.energy,
          craterDiameterM: impactData.craterDiameter,
          waterDepthM: waterDepth,
          impactAngleDeg: 45
        });
      }

      // Visualize impact point
      viewer.entities.add({
        id: 'impact_point',
        position: Cesium.Cartesian3.fromDegrees(impactLocation.lng, impactLocation.lat, 0),
        point: {
          pixelSize: 15,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: 'IMPACT',
          font: '14pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        }
      });

      // Visualize crater
      viewer.entities.add({
        id: 'impact_crater',
        position: Cesium.Cartesian3.fromDegrees(impactLocation.lng, impactLocation.lat, 0),
        ellipse: {
          semiMajorAxis: impactData.craterDiameter / 2,
          semiMinorAxis: impactData.craterDiameter / 2,
          material: Cesium.Color.DARKRED.withAlpha(0.7),
          height: 0
        }
      });

      // Visualize overpressure zones
      const pressureZones = [
        { psi: 100, radius: overpressure.criticalRadii.R_100psi_m, color: Cesium.Color.RED, alpha: 0.5, label: '100 psi - Total Destruction' },
        { psi: 20, radius: overpressure.criticalRadii.R_20psi_m, color: Cesium.Color.ORANGE, alpha: 0.4, label: '20 psi - Severe Damage' },
        { psi: 5, radius: overpressure.criticalRadii.R_5psi_m, color: Cesium.Color.YELLOW, alpha: 0.3, label: '5 psi - Moderate Damage' },
        { psi: 1, radius: overpressure.criticalRadii.R_1psi_m, color: Cesium.Color.CYAN, alpha: 0.2, label: '1 psi - Light Damage' },
        { psi: 0.5, radius: overpressure.criticalRadii.R_0_5psi_m, color: Cesium.Color.BLUE, alpha: 0.15, label: '0.5 psi - Window Breakage' }
      ];

      pressureZones.forEach((zone, idx) => {
        viewer.entities.add({
          id: `impact_pressure_${zone.psi}psi`,
          position: Cesium.Cartesian3.fromDegrees(impactLocation.lng, impactLocation.lat, 0),
          ellipse: {
            semiMajorAxis: zone.radius,
            semiMinorAxis: zone.radius,
            material: zone.color.withAlpha(zone.alpha),
            height: 0,
            outline: true,
            outlineColor: zone.color.withAlpha(zone.alpha + 0.2),
            outlineWidth: 2
          },
          description: zone.label
        });
      });

      // Visualize thermal radiation zones
      viewer.entities.add({
        id: 'impact_fireball',
        position: Cesium.Cartesian3.fromDegrees(impactLocation.lng, impactLocation.lat, 0),
        ellipse: {
          semiMajorAxis: thermal.fireballRadiusM,
          semiMinorAxis: thermal.fireballRadiusM,
          material: Cesium.Color.ORANGE.withAlpha(0.6),
          height: 0
        }
      });

      viewer.entities.add({
        id: 'impact_thermal_3rd',
        position: Cesium.Cartesian3.fromDegrees(impactLocation.lng, impactLocation.lat, 0),
        ellipse: {
          semiMajorAxis: thermal.thirdDegreeBurnsRadiusM,
          semiMinorAxis: thermal.thirdDegreeBurnsRadiusM,
          material: Cesium.Color.RED.withAlpha(0.2),
          height: 0,
          outline: true,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 1
        }
      });

      // Visualize tsunami if oceanic
      if (tsunamiData) {
        tsunamiData.affectedCoastlines.forEach((coastline, idx) => {
          viewer.entities.add({
            id: `tsunami_affected_${idx}`,
            position: Cesium.Cartesian3.fromDegrees(coastline.lng, coastline.lat, 0),
            point: {
              pixelSize: 10,
              color: Cesium.Color.BLUE
            },
            label: {
              text: `${coastline.name}\n${coastline.maxWaveHeight_m.toFixed(1)}m wave\n${coastline.arrivalTime_minutes.toFixed(0)} min`,
              font: '10pt sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              pixelOffset: new Cesium.Cartesian2(0, -15)
            }
          });

          // Draw line from impact to coastline
          viewer.entities.add({
            id: `tsunami_line_${idx}`,
            polyline: {
              positions: [
                Cesium.Cartesian3.fromDegrees(impactLocation.lng, impactLocation.lat, 0),
                Cesium.Cartesian3.fromDegrees(coastline.lng, coastline.lat, 0)
              ],
              width: 2,
              material: Cesium.Color.BLUE.withAlpha(0.5)
            }
          });
        });
      }

      // Fly to impact location
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          impactLocation.lng,
          impactLocation.lat,
          Math.max(overpressure.criticalRadii.R_1psi_m * 3, 100000)
        ),
        duration: 2
      });

      // Store results
      setSimulationResults({
        impactData,
        overpressure,
        thermal,
        tsunami: tsunamiData
      });

      if (onReportGenerate) {
        onReportGenerate(impactData);
      }

    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cesium-impact-container">
      <div className="cesium-viewer-wrapper">
        <div ref={cesiumContainerRef} className="cesium-viewer" />
      </div>

      <div className="control-panel">
        <h2>🌍 Asteroid Impact Simulator</h2>
        
        <div className="section">
          <h3>Select Asteroid (Live NASA Data)</h3>
          {loading && <p>Loading asteroids...</p>}
          <select
            value={selectedAsteroid?.id || ''}
            onChange={(e) => {
              const asteroid = asteroids.find(a => a.id === e.target.value);
              setSelectedAsteroid(asteroid || null);
            }}
            disabled={loading}
          >
            <option value="">Select an asteroid...</option>
            {asteroids.map(asteroid => (
              <option key={asteroid.id} value={asteroid.id}>
                {asteroid.name} ({asteroid.diameterKm.toFixed(2)} km, {asteroid.velocityKmS.toFixed(1)} km/s)
                {asteroid.isHazardous && ' ⚠️ HAZARDOUS'}
              </option>
            ))}
          </select>
        </div>

        {selectedAsteroid && (
          <div className="section asteroid-info">
            <h3>Asteroid Details</h3>
            <p><strong>Name:</strong> {selectedAsteroid.name}</p>
            <p><strong>Diameter:</strong> {selectedAsteroid.diameterKm.toFixed(3)} km</p>
            <p><strong>Velocity:</strong> {selectedAsteroid.velocityKmS.toFixed(2)} km/s</p>
            <p><strong>Density:</strong> {selectedAsteroid.densityKgM3} kg/m³</p>
            <p><strong>Approach Date:</strong> {selectedAsteroid.approachDate}</p>
            <p><strong>Miss Distance:</strong> {(selectedAsteroid.missDistanceKm / 384400).toFixed(2)} LD</p>
          </div>
        )}

        <div className="section">
          <h3>Impact Location</h3>
          <p>Click on the globe to select impact location</p>
          <div className="location-display">
            <span>Lat: {impactLocation.lat.toFixed(4)}°</span>
            <span>Lng: {impactLocation.lng.toFixed(4)}°</span>
          </div>
          {isOceanicImpact(impactLocation.lat, impactLocation.lng) && (
            <p className="ocean-warning">⚠️ Oceanic impact - Tsunami simulation enabled</p>
          )}
        </div>

        <button
          className="simulate-btn"
          onClick={runSimulation}
          disabled={!selectedAsteroid || loading}
        >
          {loading ? 'Simulating...' : '🚀 Run Simulation'}
        </button>

        {simulationResults && (
          <div className="section results">
            <h3>Simulation Results</h3>
            <div className="result-item">
              <strong>Energy:</strong> {(simulationResults.impactData.tntEquivalent / 1e6).toFixed(2)} Megatons TNT
            </div>
            <div className="result-item">
              <strong>Crater:</strong> {(simulationResults.impactData.craterDiameter / 1000).toFixed(2)} km diameter
            </div>
            <div className="result-item">
              <strong>Seismic:</strong> Magnitude {simulationResults.impactData.seismicMagnitude.toFixed(1)}
            </div>
            
            <h4>Overpressure Zones</h4>
            <div className="pressure-zones">
              <div>100 psi: {(simulationResults.overpressure.criticalRadii.R_100psi_m / 1000).toFixed(1)} km</div>
              <div>20 psi: {(simulationResults.overpressure.criticalRadii.R_20psi_m / 1000).toFixed(1)} km</div>
              <div>5 psi: {(simulationResults.overpressure.criticalRadii.R_5psi_m / 1000).toFixed(1)} km</div>
              <div>1 psi: {(simulationResults.overpressure.criticalRadii.R_1psi_m / 1000).toFixed(1)} km</div>
            </div>

            {simulationResults.tsunami && (
              <>
                <h4>Tsunami Effects</h4>
                <div className="tsunami-info">
                  <div>Initial Wave: {simulationResults.tsunami.initialWaveHeight_m.toFixed(1)} m</div>
                  <div>Affected Coastlines: {simulationResults.tsunami.affectedCoastlines.length}</div>
                  <div>Population at Risk: {simulationResults.tsunami.affectedCoastlines.reduce((sum: number, c: any) => sum + c.populationAtRisk, 0).toLocaleString()}</div>
                </div>
              </>
            )}

            <button
              className="advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Data
            </button>

            {showAdvanced && (
              <div className="advanced-data">
                <pre>{JSON.stringify(simulationResults, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CesiumImpactVisualization;
