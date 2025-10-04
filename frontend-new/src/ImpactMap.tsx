import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { UsgsApiService } from './services/usgsApi';
import {  
  type ImpactData as SimImpactData 
} from './services/simulationEngine';
import { SimulationEngine } from './services/simulationEngine';
import './ImpactMap.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to force map refresh
function MapRefresher() {
  const map = useMap();

  useEffect(() => {
    // Force map to invalidate size on mount and when window resizes
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

interface AsteroidParams {
  size: number;
  velocity: number;
  region: string;
}

// Use the simulation engine ImpactData type
type ImpactData = SimImpactData;

interface ImpactMapProps {
  asteroidParams?: AsteroidParams;
  impactData?: ImpactData;
  onBack?: () => void;
  onDefend?: () => void;
  onMitigation?: () => void;
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

// Custom icons
const impactIcon = new L.DivIcon({
  className: 'impact-marker',
  html: '💥',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const tsunamiIcon = new L.DivIcon({
  className: 'tsunami-marker',
  html: '🌊',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const WORLD_BOUNDS = L.latLngBounds([-85, -180], [85, 180]);

const DEFAULT_ASTEROID: AsteroidParams = {
  size: 50,
  velocity: 17,
  region: REGIONS[0].id
};

const DEFAULT_IMPACT: ImpactData = {
  // Core impact parameters
  energy: 1e15,
  tntEquivalent: 1e6,
  impactLocation: { lat: 0, lng: 0 },
  collisionPredicted: true,

  // Physical effects
  craterDiameter: 1000,
  craterDepth: 200,

  // Effect radii (km)
  blastRadius: 20,
  heavyDamageRadius: 15,
  moderateDamageRadius: 30,
  thermalRadius: 10,
  seismicRadius: 40,

  // Seismic properties
  seismicMagnitude: 6.5,
  seismicIntensity: "5",           // string

  // Other physical effects
  ejectaVolume: 100000,
  fireballRadius: 5,

  // Tsunami data (optional)
  tsunamiRisk: 0,
  tsunamiRadius: 0,
  tsunamiHeight: 0,
  tsunamiArrivalTimes: [],

  // New required fields
  populationAtRisk: 0,              // placeholder
  infrastructureAtRisk: [],          // placeholder
  earlyWarningTime: 0,              // placeholder (minutes)
  recommendedActions: []            // placeholder empty array
};

export default function ImpactMap({
  asteroidParams,
  impactData,
  onBack,
  onDefend,
  onMitigation
}: ImpactMapProps) {
  const location = useLocation();
  const state: any = location.state ?? {};
  const passedParams = state.params ?? asteroidParams;
  const passedImpactData = state.impactData ?? impactData;
  
  const [regionId, setRegionId] = useState<string>(
    (typeof passedParams?.region === 'string' ? passedParams.region : (passedParams?.region as any)?.id) || DEFAULT_ASTEROID.region
  );
  const [showDirect, setShowDirect] = useState(false);
  const [showIndirect, setShowIndirect] = useState(false);
  const [showTsunami, setShowTsunami] = useState(false);
  const [showEconomic, setShowEconomic] = useState(false);
  const [showEnvironmental, setShowEnvironmental] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showGovernance, setShowGovernance] = useState(false);

  // Map loading/error state
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  
  // USGS data state
  const [seismicData, setSeismicData] = useState<any>(null);
  const [tsunamiData, setTsunamiData] = useState<any>(null);
  const [elevationData, setElevationData] = useState<any>(null);

  // Load USGS data on component mount
  useEffect(() => {
    const loadUsgsData = async () => {
      try {
        // Load seismic activity data
        const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endTime = new Date().toISOString().split('T')[0];
        const seismic = await UsgsApiService.getSeismicActivity(startTime, endTime);
        setSeismicData(seismic);

        // Load tsunami hazard data for the selected region
        const tsunami = await UsgsApiService.getTsunamiHazardData(regionId);
        setTsunamiData(tsunami);

        // Load elevation data for impact location
        const selectedRegion = REGIONS.find(r => r.id === regionId) || REGIONS[0];
        const elevation = await UsgsApiService.getElevationData(selectedRegion.lat, selectedRegion.lng);
        setElevationData(elevation);
      } catch (error) {
        console.error('Error loading USGS data:', error);
      }
    };

    loadUsgsData();
  }, [regionId]);

  // Handle region change - update impact location and recalculate
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionId(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapError && mapLoading) {
        const mapContainer = document.querySelector('.leaflet-container');
        if (!mapContainer || mapContainer.children.length === 0) {
          setMapError('Map failed to load - check internet connection');
          setMapLoading(false);
        }
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [mapError, mapLoading]);

  // Find selected region
  const selectedRegion = REGIONS.find(r => r.id === regionId) || REGIONS[0];
  const impactLocation = [selectedRegion.lat, selectedRegion.lng];

  // Use provided or default asteroid/impact data
  const params = passedParams ?? DEFAULT_ASTEROID;
  const impact = passedImpactData ?? DEFAULT_IMPACT;

  // Calculate enhanced impact data using simulation engine
  const enhancedImpact = useMemo(() => {
    if (passedImpactData) return passedImpactData;

    if (!params) return impact;

    const region = REGIONS.find(r => r.id === regionId) ?? REGIONS[0];
    const impactLocation = { lat: region.lat, lng: region.lng };

    return SimulationEngine.computeImpactEffects(
    params.size || DEFAULT_ASTEROID.size,
    params.density || 2600,
    params.velocity || DEFAULT_ASTEROID.velocity,
    impactLocation
  );
  }, [passedImpactData, params, regionId]);

  // Calculate indirect effect radii (enhanced)
  const economicRadius = enhancedImpact.blastRadius * 3;
  const environmentalRadius = enhancedImpact.blastRadius * 5;
  const healthRadius = enhancedImpact.blastRadius * 2;
  const governanceRadius = enhancedImpact.blastRadius * 4;

  // Memoized impact zones
  const impactZones = useMemo(() => (
    <>
      {showDirect && (
        <>
          <Circle
            center={impactLocation as [number, number]}
            radius={enhancedImpact.blastRadius * 1000}
            pathOptions={{
              color: '#ff4757',
              fillColor: '#ff4757',
              fillOpacity: 0.3,
              weight: 2
            }}
          />
          <Circle
            center={impactLocation as [number, number]}
            radius={enhancedImpact.thermalRadius * 1000}
            pathOptions={{
              color: '#ff6b6b',
              fillColor: '#ff6b6b',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
          <Circle
            center={impactLocation as [number, number]}
            radius={enhancedImpact.seismicRadius * 1000}
            pathOptions={{
              color: '#ffa500',
              fillColor: '#ffa500',
              fillOpacity: 0.1,
              weight: 2
            }}
          />
        </>
      )}
      {showTsunami && enhancedImpact.tsunamiRadius && enhancedImpact.tsunamiRadius > 0 && (
        <>
          <Circle
            center={impactLocation as [number, number]}
            radius={enhancedImpact.tsunamiRadius * 1000}
            pathOptions={{
              color: '#20b2ff',
              fillColor: '#20b2ff',
              fillOpacity: 0.15,
              weight: 2
            }}
          />
          <Marker position={impactLocation as [number, number]} icon={tsunamiIcon}>
            <Popup>
              <div className="tsunami-popup">
                <h3>🌊 Tsunami Effects</h3>
                <p><strong>Wave Height:</strong> {enhancedImpact.tsunamiHeight?.toFixed(1) || '0.0'} m</p>
                <p><strong>Affected Radius:</strong> {enhancedImpact.tsunamiRadius.toFixed(0)} km</p>
                <p><strong>Coastal Impact:</strong> Severe flooding and destruction</p>
                {tsunamiData && (
                  <p><strong>USGS Risk Level:</strong> {tsunamiData.risk_level}</p>
                )}
              </div>
            </Popup>
          </Marker>
        </>
      )}
      {showIndirect && (
        <>
          {showEconomic && (
            <Circle
              center={impactLocation as [number, number]}
              radius={economicRadius * 1000}
              pathOptions={{
                color: '#ffd700',
                fillColor: '#ffd700',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '10, 5'
              }}
            />
          )}
          {showEnvironmental && (
            <Circle
              center={impactLocation as [number, number]}
              radius={environmentalRadius * 1000}
              pathOptions={{
                color: '#32cd32',
                fillColor: '#32cd32',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '10, 5'
              }}
            />
          )}
          {showHealth && (
            <Circle
              center={impactLocation as [number, number]}
              radius={healthRadius * 1000}
              pathOptions={{
                color: '#ff69b4',
                fillColor: '#ff69b4',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '10, 5'
              }}
            />
          )}
          {showGovernance && (
            <Circle
              center={impactLocation as [number, number]}
              radius={governanceRadius * 1000}
              pathOptions={{
                color: '#9370db',
                fillColor: '#9370db',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '10, 5'
              }}
            />
          )}
        </>
      )}
    </>
  ), [
    showDirect, showTsunami, showIndirect,
    showEconomic, showEnvironmental, showHealth, showGovernance,
    impact, impactLocation, economicRadius, environmentalRadius, healthRadius, governanceRadius
  ]);

  return (
    <div className="impact-map">
      <div className="map-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Orbital Simulator
        </button>
        <h2>🌍 Impact Analysis - {selectedRegion.label}</h2>
        <div className="impact-info">
          <div className="info-item">
            <span className="label">Asteroid Size:</span>
            <span className="value">{params.size}m radius</span>
          </div>
          <div className="info-item">
            <span className="label">Velocity:</span>
            <span className="value">{params.velocity} km/s</span>
          </div>
          <div className="info-item">
            <span className="label">Energy:</span>
            <span className="value">{(enhancedImpact.energy / 1e15).toFixed(2)} PJ</span>
          </div>
          <div className="info-item">
            <span className="label">TNT Equivalent:</span>
            <span className="value">{(enhancedImpact.tntEquivalent / 1e6).toFixed(2)} MT</span>
          </div>
          {enhancedImpact.seismicMagnitude && (
            <div className="info-item">
              <span className="label">Seismic Magnitude:</span>
              <span className="value">{enhancedImpact.seismicMagnitude.toFixed(1)} Mw</span>
            </div>
          )}
          {enhancedImpact.tsunamiHeight && enhancedImpact.tsunamiHeight > 0 && (
            <div className="info-item">
              <span className="label">Tsunami Height:</span>
              <span className="value">{enhancedImpact.tsunamiHeight.toFixed(1)} m</span>
            </div>
          )}
        </div>
        <div className="region-selector">
          <label htmlFor="region-select">Impact Region:</label>
          <select
            id="region-select"
            value={regionId}
            onChange={handleRegionChange}
            className="region-select"
          >
            {REGIONS.map(region => (
              <option key={region.id} value={region.id}>
                {region.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="defend-button" onClick={onDefend} style={{ marginRight: 8 }}>
            🚀 Defend Earth
          </button>
          <button className="mitigation-button" onClick={onMitigation}>
            🛡️ Mitigation Strategies
          </button>
        </div>
      </div>

      <div className="map-content">
        <div className="map-container" style={{ height: '70vh', minHeight: '420px' }}>
          {mapLoading && !mapError && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
              <div>Loading Map...</div>
            </div>
          )}
          <MapContainer
            key={`map-${regionId}`}
            center={impactLocation as [number, number]}
            zoom={2}
            minZoom={2}
            maxZoom={18}
            style={{ height: '100%', width: '100%' }}
            className="impact-map-leaflet"
            preferCanvas={false}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            dragging={true}
            maxBounds={WORLD_BOUNDS}
            maxBoundsViscosity={1.0}
            whenReady={() => {
              setMapError(null);
              setMapLoading(false);
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={18}
              minZoom={2}
              bounds={WORLD_BOUNDS}
            />
            <MapRefresher />
            {/* Impact Point */}
            <Marker position={impactLocation as [number, number]} icon={impactIcon}>
              <Popup>
                <div className="impact-popup">
                  <h3>💥 Impact Point</h3>
                  <p><strong>Location:</strong> {selectedRegion.label}</p>
                  <p><strong>Crater Diameter:</strong> {(impact.craterDiameter / 1000).toFixed(2)} km</p>
                  <p><strong>Blast Radius:</strong> {impact.blastRadius.toFixed(0)} km</p>
                </div>
              </Popup>
            </Marker>
            {/* Impact Zones */}
            {impactZones}
          </MapContainer>
          {mapError && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <h3>🗺️ Map Loading Issue</h3>
              <p>Map failed to load. This might be due to:</p>
              <ul style={{ textAlign: 'left', margin: '10px 0' }}>
                <li>Internet connection issues</li>
                <li>Browser compatibility</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#4A90E2',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          )}
        </div>
        <div className="control-panel">
          <div className="effect-controls">
            <h3>Impact Effects</h3>
            <div className="control-group">
              <h4>Direct Effects</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showDirect}
                  onChange={(e) => setShowDirect(e.target.checked)}
                />
                <span className="checkmark"></span>
                Blast, Thermal & Seismic Zones
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showTsunami}
                  onChange={(e) => setShowTsunami(e.target.checked)}
                />
                <span className="checkmark"></span>
                Tsunami Effects
              </label>
            </div>
            <div className="control-group">
              <h4>Indirect Effects</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showIndirect}
                  onChange={(e) => setShowIndirect(e.target.checked)}
                />
                <span className="checkmark"></span>
                Show Indirect Zones
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showEconomic}
                  onChange={(e) => setShowEconomic(e.target.checked)}
                  disabled={!showIndirect}
                />
                <span className="checkmark"></span>
                Economic Disruptions
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showEnvironmental}
                  onChange={(e) => setShowEnvironmental(e.target.checked)}
                  disabled={!showIndirect}
                />
                <span className="checkmark"></span>
                Environmental Chain Reactions
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showHealth}
                  onChange={(e) => setShowHealth(e.target.checked)}
                  disabled={!showIndirect}
                />
                <span className="checkmark"></span>
                Public Health & Society
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showGovernance}
                  onChange={(e) => setShowGovernance(e.target.checked)}
                  disabled={!showIndirect}
                />
                <span className="checkmark"></span>
                Governance & Information Systems
              </label>
            </div>
          </div>
          <div className="impact-analysis">
            <h3>Impact Analysis</h3>
            <div className="analysis-section">
              <h4>Direct Effects</h4>
              <ul>
                <li><strong>Blast Overpressure:</strong> Complete destruction within {enhancedImpact.blastRadius.toFixed(0)} km</li>
                <li><strong>Thermal Radiation:</strong> Fires and burns within {enhancedImpact.thermalRadius.toFixed(0)} km</li>
                <li><strong>Seismic Shaking:</strong> Earthquake-like effects within {enhancedImpact.seismicRadius.toFixed(0)} km</li>
                <li><strong>Crater Formation:</strong> {(enhancedImpact.craterDiameter / 1000).toFixed(2)} km diameter crater</li>
                {enhancedImpact.tsunamiRadius && enhancedImpact.tsunamiRadius > 0 && (
                  <li><strong>Tsunami:</strong> Coastal flooding within {enhancedImpact.tsunamiRadius.toFixed(0)} km</li>
                )}
                {enhancedImpact.seismicMagnitude && (
                  <li><strong>Seismic Magnitude:</strong> Equivalent to M{enhancedImpact.seismicMagnitude.toFixed(1)} earthquake</li>
                )}
              </ul>
            </div>
            <div className="analysis-section">
              <h4>Indirect Effects</h4>
              <ul>
                <li><strong>Economic:</strong> Market shocks, supply chain breakdown, insurance collapse</li>
                <li><strong>Environmental:</strong> Long-term wildfires, climate effects, biodiversity loss</li>
                <li><strong>Health:</strong> Displacement, disease spread, mental health trauma</li>
                <li><strong>Governance:</strong> Emergency coordination failures, misinformation spread</li>
              </ul>
            </div>
            <div className="analysis-section">
              <h4>Mitigation Strategies</h4>
              <ul>
                <li><strong>Economic:</strong> Resilience funds, insurance pools, supply chain diversification</li>
                <li><strong>Environmental:</strong> Reforestation, habitat restoration, climate monitoring</li>
                <li><strong>Health:</strong> Surge capacity, mobile hospitals, mental health support</li>
                <li><strong>Governance:</strong> Disaster diplomacy, cross-border response frameworks</li>
              </ul>
            </div>
            {seismicData && (
              <div className="analysis-section">
                <h4>USGS Seismic Data</h4>
                <ul>
                  <li><strong>Recent Earthquakes:</strong> {seismicData.features?.length || 0} events in last 30 days</li>
                  <li><strong>Seismic Risk:</strong> Enhanced by impact magnitude</li>
                  <li><strong>Ground Shaking:</strong> Amplified in seismic zones</li>
                </ul>
              </div>
            )}
            {tsunamiData && (
              <div className="analysis-section">
                <h4>USGS Tsunami Hazard</h4>
                <ul>
                  <li><strong>Risk Level:</strong> {tsunamiData.risk_level}</li>
                  <li><strong>Affected Coastlines:</strong> {tsunamiData.affected_coastlines?.join(', ')}</li>
                  <li><strong>Inundation Distance:</strong> {tsunamiData.inundation_distance} m</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}