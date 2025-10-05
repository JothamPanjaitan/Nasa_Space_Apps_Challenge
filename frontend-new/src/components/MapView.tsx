import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ImpactData, Mode } from '../types/impact';
import Tooltip from './Tooltip';
import './MapView.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface MapViewProps {
  neoList: ImpactData[];
  selected?: ImpactData | null;
  mode: Mode;
  onSelect?: (id: string) => void;
}

// Component to handle map events and initialization
function MapEventHandler({ mapRef, selected }: { mapRef: React.MutableRefObject<any>, selected?: ImpactData | null }) {
  const map = useMapEvents({
    // Map is ready when this component mounts
  });

  useEffect(() => {
    if (map) {
      mapRef.current = map;
    }
  }, [map, mapRef]);

  useEffect(() => {
    if (!map) return;
    
    const s = selected as any;
    const lat = s?.lat ?? s?.impactLocation?.lat;
    const lng = s?.lng ?? s?.impactLocation?.lng;
    
    if (lat == null || lng == null) return;
    
    // Add a delay to ensure map DOM is fully ready
    const timer = setTimeout(() => {
      try {
        // Check if map is ready before flying
        const container = map.getContainer && map.getContainer();
        if (map && container && (container as any)._leaflet_pos) {
          map.flyTo([lat, lng], 6, { duration: 1.2 });
        } else {
          // Fallback: just set view without animation
          map.setView([lat, lng], 6);
        }
      } catch (error) {
        console.warn('Map flyTo error:', error);
        // Try simple setView as fallback
        try {
          map.setView([lat, lng], 6);
        } catch (e) {
          console.warn('Map setView also failed:', e);
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selected, map]);

  return null;
}

export default function MapView({ neoList, selected, mode, onSelect }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const center: [number, number] = [20, 0];

  const makeTsunamiFan = (lat: number, lng: number, radiusKm: number) => {
    const coords: [number, number][] = [];
    const segs = 64;
    const rdeg = radiusKm / 111; // crude deg→km conversion
    
    for (let s = 0; s <= segs; s++) {
      const ang = (2 * Math.PI * s) / segs;
      const a = lat + rdeg * Math.cos(ang);
      const b = lng + (rdeg * Math.sin(ang)) / Math.cos((lat * Math.PI) / 180);
      coords.push([a, b]);
    }
    return coords;
  };

  const ringColor = (psi: number) => 
    psi >= 5 ? '#d7191c' : psi >= 3 ? '#fdae61' : '#abd9e9';

  const getNEOIcon = (neo: ImpactData) => {
    const isHazardous = neo.raw?.is_potentially_hazardous_asteroid;
    const isSelected = selected?.id === neo.id;
    const size = isSelected ? 40 : 30;
    const color = isHazardous ? '#ff4757' : '#3742fa';
    
    return L.divIcon({
      className: 'neo-marker',
      html: `
        <div class="neo-pin ${isSelected ? 'selected' : ''}" style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.4}px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ">
          🚀
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  return (
    <div className="map-view-container">
      <MapContainer
        center={center}
        zoom={3}
        style={{ height: '100vh' }}
        className="impact-map-leaflet"
      >
        <MapEventHandler mapRef={mapRef} selected={selected} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LayerGroup>
          {neoList.map(neo => {
            const lat = neo.lat || neo.impactLocation?.lat || 0;
            const lng = neo.lng || neo.impactLocation?.lng || 0;
            
            if (lat === 0 && lng === 0) return null;
            
            return (
              <Marker
                key={neo.id}
                position={[lat, lng]}
                icon={getNEOIcon(neo)}
                eventHandlers={{
                  click: () => onSelect && onSelect(neo.id)
                }}
              >
                <Popup>
                  <div className="neo-popup">
                    <h3>🚀 {neo.name}</h3>
                    <div className="neo-details">
                      <p><strong>Velocity:</strong> {neo.velocityKms?.toFixed(2)} km/s</p>
                      <p><strong>Diameter:</strong> {(neo.diameterM ?? 0).toFixed(1)} m</p>
                      {neo.tntEquivalentTons && (
                        <p><strong>TNT Equivalent:</strong> {(neo.tntEquivalentTons / 1e6).toFixed(2)} MT</p>
                      )}
                      {neo.seismicMagnitude && (
                        <p><strong>Seismic:</strong> M{neo.seismicMagnitude.toFixed(1)}</p>
                      )}
                      {neo.craterDiameterKm && (
                        <p><strong>Crater:</strong> {neo.craterDiameterKm.toFixed(2)} km</p>
                      )}
                      {neo.raw?.is_potentially_hazardous_asteroid && (
                        <p className="hazardous-warning">⚠️ Potentially Hazardous</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </LayerGroup>

        {(() => {
          const s = selected as any;
          const lat = s?.lat ?? s?.impactLocation?.lat;
          const lng = s?.lng ?? s?.impactLocation?.lng;
          return lat != null && lng != null;
        })() && (
          <>
            {/* Blast rings: 1/3/5 psi using proper TNT scaling */}
            {[1, 3, 5].map((psi) => {
              const tntTons = (selected as any)?.tntEquivalentTons ?? 0;
              // TNT scaling: radius (m) = k * W^(1/3), where W is TNT in tons
              // 1 PSI: k=280, 3 PSI: k=120, 5 PSI: k=80
              const k = psi === 1 ? 280 : psi === 3 ? 120 : 80;
              const radiusMeters = k * Math.pow(tntTons, 1/3);
              const radiusKm = radiusMeters / 1000;
              
              return (
                <Circle
                  key={psi}
                  center={[(selected as any)?.lat ?? (selected as any)?.impactLocation?.lat, (selected as any)?.lng ?? (selected as any)?.impactLocation?.lng]}
                  radius={radiusMeters} // Leaflet uses meters
                  pathOptions={{
                    color: ringColor(psi),
                    weight: 2,
                    fillOpacity: 0.05,
                    dashArray: psi === 1 ? '5, 5' : '10, 5'
                  }}
                >
                  <Popup>
                    <div className="blast-popup">
                      <h4>💥 {psi} PSI Overpressure</h4>
                      <p>Radius: {radiusKm.toFixed(1)} km</p>
                      <div className="damage-description">
                        {psi >= 5 && <p>• Complete destruction</p>}
                        {psi >= 3 && <p>• Heavy damage to structures</p>}
                        {psi >= 1 && <p>• Moderate damage, broken windows</p>}
                      </div>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            {/* Seismic & Tsunami effects */}
            {(selected as any)?.indirectImpacts?.map((ii: any, idx: number) => (
              ii.type === 'seismic' ? (
                <Circle
                  key={`seis-${idx}`}
                  center={[(selected as any)?.lat ?? (selected as any)?.impactLocation?.lat, (selected as any)?.lng ?? (selected as any)?.impactLocation?.lng]}
                  radius={ii.radiusKm * 1000}
                  pathOptions={{
                    color: '#ff4500',
                    weight: 1.5,
                    fillOpacity: 0.06,
                    dashArray: '15, 10'
                  }}
                >
                  <Popup>
                    <div className="seismic-popup">
                      <h4>🌍 Seismic Effects</h4>
                      <p><strong>Magnitude:</strong> M{ii.intensity?.toFixed?.(2)}</p>
                      <p><strong>Radius:</strong> {ii.radiusKm} km</p>
                      <p>Earthquake-like ground shaking</p>
                    </div>
                  </Popup>
                </Circle>
              ) : ii.type === 'tsunami' ? (
                <Polygon
                  key={`tsu-${idx}`}
                  positions={makeTsunamiFan((selected as any)?.lat ?? (selected as any)?.impactLocation?.lat, (selected as any)?.lng ?? (selected as any)?.impactLocation?.lng, ii.radiusKm)}
                  pathOptions={{
                    color: '#0077be',
                    weight: 1,
                    fillOpacity: 0.08,
                    dashArray: '8, 8'
                  }}
                >
                  <Popup>
                    <div className="tsunami-popup">
                      <h4>🌊 Tsunami Effects</h4>
                      <p><strong>Wave Height:</strong> {ii.intensity?.toFixed?.(1)} m</p>
                      <p><strong>Radius:</strong> {ii.radiusKm} km</p>
                      <p>Coastal flooding and destruction</p>
                      {ii.populationAtRisk && (
                        <p><strong>Population at Risk:</strong> {ii.populationAtRisk.toLocaleString()}</p>
                      )}
                    </div>
                  </Popup>
                </Polygon>
              ) : ii.type === 'wildfire' ? (
                <Circle
                  key={`fire-${idx}`}
                  center={[(selected as any)?.lat ?? (selected as any)?.impactLocation?.lat, (selected as any)?.lng ?? (selected as any)?.impactLocation?.lng]}
                  radius={ii.radiusKm * 1000}
                  pathOptions={{
                    color: '#ff6b35',
                    weight: 2,
                    fillOpacity: 0.1,
                    dashArray: '20, 10'
                  }}
                >
                  <Popup>
                    <div className="wildfire-popup">
                      <h4>🔥 Wildfire Zone</h4>
                      <p><strong>Radius:</strong> {ii.radiusKm} km</p>
                      <p>Thermal radiation igniting fires</p>
                    </div>
                  </Popup>
                </Circle>
              ) : ii.type === 'landslide' ? (
                <Circle
                  key={`atmo-${idx}`}
                  center={[(selected as any)?.lat ?? (selected as any)?.impactLocation?.lat, (selected as any)?.lng ?? (selected as any)?.impactLocation?.lng]}
                  radius={ii.radiusKm * 1000}
                  pathOptions={{
                    color: '#8b4513',
                    weight: 1,
                    fillOpacity: 0.05,
                    dashArray: '30, 15'
                  }}
                >
                  <Popup>
                    <div className="atmospheric-popup">
                      <h4>🌫️ Atmospheric Effects</h4>
                      <p><strong>Aerosol Radius:</strong> {ii.radiusKm} km</p>
                      <p><strong>Temperature Drop:</strong> {ii.intensity?.toFixed?.(1)}°C</p>
                      <p>{ii.description}</p>
                      <p>Dust and aerosols blocking sunlight</p>
                    </div>
                  </Popup>
                </Circle>
              ) : null
            ))}
          </>
        )}
      </MapContainer>
      
      {/* HUD Stats Card */}
      {selected && (
        <div className="hud-stats-card">
          <h4>📊 Impact Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Energy</span>
              <span className="stat-value">
                {selected.kineticEnergyJ ? (selected.kineticEnergyJ / 1e15).toFixed(2) : '0.00'} PJ
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">TNT</span>
              <span className="stat-value">
                {selected.tntEquivalentTons ? (selected.tntEquivalentTons / 1e6).toFixed(2) : '0.00'} MT
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Crater</span>
              <span className="stat-value">
                {selected.craterDiameterKm ? selected.craterDiameterKm.toFixed(2) : '0.00'} km
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Seismic</span>
              <span className="stat-value">
                {selected.seismicMagnitude ? `M${selected.seismicMagnitude.toFixed(1)}` : 'N/A'}
              </span>
            </div>
            {selected.populationAtRisk && selected.populationAtRisk > 0 && (
              <div className="stat-item">
                <span className="stat-label">Population</span>
                <span className="stat-value danger">
                  {selected.populationAtRisk.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
