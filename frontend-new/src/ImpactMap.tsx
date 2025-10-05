import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MapView from './components/MapView';
import ImpactControls from './components/ImpactControls';
import { ImpactData, Mode, NEOData } from './types/impact';
import { computeImpactEstimates } from './lib/impactCalc';
import { simulateTsunami, isOceanicImpact } from './services/tsunamiSimulation';
import { getWorkerManager } from './lib/workerManager';
import './ImpactMap.css';

export default function ImpactMap() {
  const API_BASE_URL = (process.env.REACT_APP_API_URL as string) || 'http://localhost:4000';
  const [mode, setMode] = useState<Mode>('simulator');
  const [neoList, setNeoList] = useState<ImpactData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [working, setWorking] = useState<Record<string, ImpactData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromSimulator, setFromSimulator] = useState(false);

  const workerManager = useMemo(() => getWorkerManager(), []);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if coming from simulator with asteroid data
  useEffect(() => {
    const state = location.state as any;
    if (state?.asteroid && state?.from === 'simulator') {
      setFromSimulator(true);
      // Convert NEO data to ImpactData format
      const neo = state.asteroid;
      const impactData: ImpactData = {
        id: neo.id,
        name: neo.name,
        raw: neo,
        diameterM: neo.estimated_diameter?.meters?.estimated_diameter_max ?? 100,
        velocityKms: parseFloat(neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second ?? '20'),
        densityKgM3: 3000,
        impactLocation: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      };
      
      // Compute impact estimates
      let enhancedImpact = computeImpactEstimates(impactData);
      
      // Add tsunami simulation if oceanic
      const impactLoc = impactData.impactLocation || { lat: 0, lng: 0 };
      if (isOceanicImpact(impactLoc.lat, impactLoc.lng)) {
        const tsunamiData = simulateTsunami({
          impactLocation: impactLoc,
          energyJoules: enhancedImpact.kineticEnergyJ || 0,
          craterDiameterM: (enhancedImpact.craterDiameterKm || 0) * 1000,
          waterDepthM: 4000,
          impactAngleDeg: 45
        });
        
        enhancedImpact = {
          ...enhancedImpact,
          tsunamiData,
          tsunamiRadius: tsunamiData.affectedCoastlines.length > 0 ? 
            Math.max(...tsunamiData.affectedCoastlines.map(c => c.distance_km)) : 0
        };
      }
      
      setNeoList([enhancedImpact]);
      setSelectedId(enhancedImpact.id);
    }
  }, [location.state]);

  useEffect(() => {
    // Skip loading if we already have data from simulator
    if (fromSimulator) {
      setLoading(false);
      return;
    }

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
        
        // Convert NEO data to ImpactData format
        const items: ImpactData[] = await Promise.all(
          neos.map(async (raw: any) => {
            const diam = raw.estimated_diameter?.meters?.estimated_diameter_max ?? 
                       raw.estimated_diameter?.meters?.estimated_diameter_min ?? 0;
            const vel = parseFloat(raw.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second ?? '0');
            const closeApproach = raw.close_approach_data?.[0];
            
            const obj: ImpactData = {
              id: raw.id,
              name: raw.name,
              raw,
              epochMs: closeApproach ? 
                Date.parse(closeApproach.close_approach_date_full || closeApproach.close_approach_date) : 
                Date.now(),
              diameterM: diam,
              velocityKms: vel,
              densityKgM3: 3000,
              impactLocation: { lat: 0, lng: 0 }, // Will be set when user selects region
            };
            
            // Compute impact estimates using worker
            let result;
            try {
              result = await workerManager.recalculateImpact(obj);
            } catch (workerError) {
              console.warn('Worker failed, using main thread:', workerError);
              result = computeImpactEstimates(obj);
            }
            
            // Add tsunami simulation if oceanic
            const impactLoc = obj.impactLocation || { lat: 0, lng: 0 };
            if (isOceanicImpact(impactLoc.lat, impactLoc.lng)) {
              const tsunamiData = simulateTsunami({
                impactLocation: impactLoc,
                energyJoules: result.kineticEnergyJ || 0,
                craterDiameterM: (result.craterDiameterKm || 0) * 1000,
                waterDepthM: 4000,
                impactAngleDeg: 45
              });
              
              result = {
                ...result,
                tsunamiData,
                tsunamiRadius: tsunamiData.affectedCoastlines.length > 0 ? 
                  Math.max(...tsunamiData.affectedCoastlines.map(c => c.distance_km)) : 0
              };
            }
            
            return result;
          })
        );
        
        setNeoList(items);
      } catch (err) {
        console.error('Error loading NEO data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load asteroid data');
        
        // Fallback to mock data
        const mockItems: ImpactData[] = [
          {
            id: 'mock-1',
            name: 'Mock Asteroid 2025-IMPCTOR',
            diameterM: 150,
            velocityKms: 20,
            densityKgM3: 3000,
            impactLocation: { lat: 40.7128, lng: -74.0060 },
            epochMs: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
          },
          {
            id: 'mock-2',
            name: 'Mock Asteroid 2025-THREAT',
            diameterM: 75,
            velocityKms: 15,
            densityKgM3: 2600,
            impactLocation: { lat: 51.5074, lng: -0.1278 },
            epochMs: Date.now() + 180 * 24 * 60 * 60 * 1000, // 6 months from now
          }
        ].map(item => computeImpactEstimates(item));
        
        setNeoList(mockItems);
      } finally {
        setLoading(false);
      }
    };

    loadNEOData();
  }, [workerManager, fromSimulator]);

  const selected = useMemo(() => 
    neoList.find(n => n.id === selectedId) ?? null, 
    [neoList, selectedId]
  );

  const handleApplyMitigation = async (
    neoId: string, 
    strategyId: string, 
    params: { dv: number; lead: number }
  ) => {
    const base = neoList.find(n => n.id === neoId);
    if (!base) return;

    try {
      const clone = JSON.parse(JSON.stringify(base)) as ImpactData;
      
      // Apply mitigation based on strategy
      switch (strategyId) {
        case 'kinetic':
          clone.velocityKms = Math.max(0, clone.velocityKms - params.dv / 1000);
          clone.mitigationApplied = [...(clone.mitigationApplied ?? []), `kinetic:${params.dv}`];
          break;
        case 'gravity':
          const gravityDv = params.dv * 0.2; // weaker effective dv
          clone.velocityKms = Math.max(0, clone.velocityKms - gravityDv / 1000);
          clone.mitigationApplied = [...(clone.mitigationApplied ?? []), `gravity:${gravityDv}`];
          break;
        case 'nuclear':
          const nuclearDv = params.dv * 2.0; // stronger effective dv
          clone.velocityKms = Math.max(0, clone.velocityKms - nuclearDv / 1000);
          clone.mitigationApplied = [...(clone.mitigationApplied ?? []), `nuclear:${nuclearDv}`];
          break;
        case 'reset':
          // Reset to original values
          setWorking(prev => {
            const newWorking = { ...prev };
            delete newWorking[neoId];
            return newWorking;
          });
          return;
        default:
          console.warn('Unknown mitigation strategy:', strategyId);
          return;
      }

      // Recalculate impact estimates with worker
      try {
        const updatedImpact = await workerManager.recalculateImpact(clone);
        setWorking(prev => ({ ...prev, [neoId]: updatedImpact }));
      } catch (workerError) {
        console.warn('Worker failed, using main thread:', workerError);
        const updatedImpact = computeImpactEstimates(clone);
        setWorking(prev => ({ ...prev, [neoId]: updatedImpact }));
      }
    } catch (error) {
      console.error('Error applying mitigation:', error);
    }
  };

  if (loading) {
    return (
      <div className="impact-map">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Asteroid Data...</h2>
          <p>Fetching real-time NEO data from NASA</p>
        </div>
      </div>
    );
  }

  if (error && neoList.length === 0) {
    return (
      <div className="impact-map">
        <div className="error-container">
          <h2>⚠️ Data Loading Error</h2>
          <p>{error}</p>
          <p>Using mock data for demonstration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="impact-map">
      <div className="impact-map-header">
        {fromSimulator && (
          <button 
            className="back-button"
            onClick={() => window.history.back()}
          >
            ← Back to 3D Simulator
          </button>
        )}
        <h1>🌍 Impact Analysis</h1>
        <p>Scientific asteroid impact simulator with real NASA data</p>
      </div>
      
      <div className="impact-map-grid">
        <ImpactControls
          mode={mode}
          setMode={setMode}
          neoList={neoList}
          selected={selected}
          working={working[selected?.id ?? '']}
          onSelect={setSelectedId}
          onApplyMitigation={handleApplyMitigation}
          loading={loading}
          error={error}
        />
        <MapView
          key={`map-${selectedId || 'default'}`}
          neoList={neoList}
          selected={working[selected?.id ?? ''] ?? selected}
          mode={mode}
          onSelect={setSelectedId}
        />
      </div>
      
      {error && (
        <div className="impact-map-warning">
          <p>⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}