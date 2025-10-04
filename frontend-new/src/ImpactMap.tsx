import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './ImpactMap.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface AsteroidParams {
  size: number;
  velocity: number;
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

interface ImpactMapProps {
  asteroidParams?: AsteroidParams;
  impactData?: ImpactData;
  onBack: () => void;
  onDefend: () => void;
  onMitigation: () => void;
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

// Default asteroid parameters if missing
const DEFAULT_ASTEROID: AsteroidParams = {
  size: 50,
  velocity: 17,
  region: REGIONS[0].id
};

// Default impact data if missing
const DEFAULT_IMPACT: ImpactData = {
  energy: 1e15,
  tntEquivalent: 1e6,
  craterDiameter: 1000,
  blastRadius: 20,
  thermalRadius: 10,
  seismicRadius: 40,
  tsunamiRadius: 0
};

export default function ImpactMap({
  asteroidParams,
  impactData,
  onBack,
  onDefend,
  onMitigation
}: ImpactMapProps) {
  // Use state for region selection, fallback to asteroidParams or default
  const [regionId, setRegionId] = useState(
    asteroidParams?.region || DEFAULT_ASTEROID.region
  );
  // Use state for effects toggles
  const [showDirect, setShowDirect] = useState(true);
  const [showIndirect, setShowIndirect] = useState(true);
  const [showTsunami, setShowTsunami] = useState(true);
  const [showEconomic, setShowEconomic] = useState(false);
  const [showEnvironmental, setShowEnvironmental] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showGovernance, setShowGovernance] = useState(false);

  // Find selected region
  const selectedRegion = REGIONS.find(r => r.id === regionId) || REGIONS[0];
  const impactLocation = [selectedRegion.lat, selectedRegion.lng];

  // Use provided or default asteroid/impact data
  const params = asteroidParams ?? DEFAULT_ASTEROID;
  const impact = impactData ?? DEFAULT_IMPACT;

  // Calculate indirect effect radii (simplified)
  const economicRadius = impact.blastRadius * 3;
  const environmentalRadius = impact.blastRadius * 5;
  const healthRadius = impact.blastRadius * 2;
  const governanceRadius = impact.blastRadius * 4;

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
            <span className="value">{(impact.energy / 1e15).toFixed(2)} PJ</span>
          </div>
          <div className="info-item">
            <span className="label">TNT Equivalent:</span>
            <span className="value">{(impact.tntEquivalent / 1e6).toFixed(2)} MT</span>
          </div>
        </div>
        {/* Region selector */}
        <div className="region-selector">
          <label htmlFor="region-select">Impact Region:</label>
          <select
            id="region-select"
            value={regionId}
            onChange={e => setRegionId(e.target.value)}
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
        <div className="map-container">
          <MapContainer
            center={impactLocation as [number, number]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            className="impact-map-leaflet"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

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

            {/* Direct Effects */}
            {showDirect && (
              <>
                {/* Blast Radius */}
                <Circle
                  center={impactLocation as [number, number]}
                  radius={impact.blastRadius * 1000}
                  pathOptions={{
                    color: '#ff4757',
                    fillColor: '#ff4757',
                    fillOpacity: 0.3,
                    weight: 2
                  }}
                />
                {/* Thermal Radius */}
                <Circle
                  center={impactLocation as [number, number]}
                  radius={impact.thermalRadius * 1000}
                  pathOptions={{
                    color: '#ff6b6b',
                    fillColor: '#ff6b6b',
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />
                {/* Seismic Radius */}
                <Circle
                  center={impactLocation as [number, number]}
                  radius={impact.seismicRadius * 1000}
                  pathOptions={{
                    color: '#ffa500',
                    fillColor: '#ffa500',
                    fillOpacity: 0.1,
                    weight: 2
                  }}
                />
              </>
            )}

            {/* Tsunami Effects */}
            {showTsunami && impact.tsunamiRadius && impact.tsunamiRadius > 0 && (
              <>
                <Circle
                  center={impactLocation as [number, number]}
                  radius={impact.tsunamiRadius * 1000}
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
                      <p><strong>Wave Radius:</strong> {impact.tsunamiRadius.toFixed(0)} km</p>
                      <p><strong>Coastal Impact:</strong> Severe flooding and destruction</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Indirect Effects */}
            {showIndirect && (
              <>
                {/* Economic Disruptions */}
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
                {/* Environmental Chain Reactions */}
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
                {/* Public Health & Society */}
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
                {/* Governance & Information Systems */}
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
          </MapContainer>
        </div>

        {/* Control Panel */}
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

          {/* Impact Analysis */}
          <div className="impact-analysis">
            <h3>Impact Analysis</h3>
            <div className="analysis-section">
              <h4>Direct Effects</h4>
              <ul>
                <li><strong>Blast Overpressure:</strong> Complete destruction within {impact.blastRadius.toFixed(0)} km</li>
                <li><strong>Thermal Radiation:</strong> Fires and burns within {impact.thermalRadius.toFixed(0)} km</li>
                <li><strong>Seismic Shaking:</strong> Earthquake-like effects within {impact.seismicRadius.toFixed(0)} km</li>
                <li><strong>Crater Formation:</strong> {(impact.craterDiameter / 1000).toFixed(2)} km diameter crater</li>
                {impact.tsunamiRadius && impact.tsunamiRadius > 0 && (
                  <li><strong>Tsunami:</strong> Coastal flooding within {impact.tsunamiRadius.toFixed(0)} km</li>
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
          </div>
        </div>
      </div>
    </div>
  );
}