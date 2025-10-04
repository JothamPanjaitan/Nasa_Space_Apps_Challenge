// Tsunami Simulation Workflow Integration
// Provides interface to ComMIT/MOST tsunami modeling and precomputed inundation data
// Based on NOAA's tsunami modeling frameworks

export interface TsunamiParameters {
  impactLocation: { lat: number; lng: number };
  energyJoules: number;
  craterDiameterM: number;
  waterDepthM: number;
  impactAngleDeg: number;
}

export interface TsunamiWaveProfile {
  distance_km: number;
  arrivalTime_minutes: number;
  waveHeight_m: number;
  runup_m: number;
  inundationDistance_m: number;
}

export interface TsunamiSimulationResult {
  impactLocation: { lat: number; lng: number };
  initialWaveHeight_m: number;
  initialWaveSpeed_ms: number;
  energyTransferEfficiency: number;
  waveProfiles: TsunamiWaveProfile[];
  affectedCoastlines: Array<{
    name: string;
    lat: number;
    lng: number;
    distance_km: number;
    arrivalTime_minutes: number;
    maxWaveHeight_m: number;
    maxRunup_m: number;
    populationAtRisk: number;
  }>;
  inundationMaps?: Array<{
    location: string;
    url: string;
    description: string;
  }>;
  commitJobScript?: string;
}

/**
 * Calculate initial tsunami wave parameters
 * Based on Ward & Asphaug (2000) and Gisler et al. (2011)
 */
function calculateInitialWave(params: TsunamiParameters): {
  waveHeight_m: number;
  waveSpeed_ms: number;
  wavelength_km: number;
} {
  const { energyJoules, craterDiameterM, waterDepthM, impactAngleDeg } = params;
  
  // Energy coupling efficiency (depends on impact angle and water depth)
  const angleRad = impactAngleDeg * Math.PI / 180;
  const depthFactor = Math.min(1.0, waterDepthM / craterDiameterM);
  const angleFactor = Math.sin(angleRad);
  const couplingEfficiency = 0.01 * depthFactor * angleFactor; // ~1% for typical impacts
  
  // Tsunami energy
  const tsunamiEnergy = energyJoules * couplingEfficiency;
  
  // Initial wave height (empirical scaling)
  // H ≈ (E_tsunami / (ρ * g * A))^0.5
  const rho = 1025; // seawater density kg/m³
  const g = 9.81;
  const impactArea = Math.PI * Math.pow(craterDiameterM / 2, 2);
  const waveHeight_m = Math.sqrt(tsunamiEnergy / (rho * g * impactArea));
  
  // Wave speed (shallow water approximation)
  // c = sqrt(g * h) for h << wavelength
  const waveSpeed_ms = Math.sqrt(g * waterDepthM);
  
  // Wavelength (proportional to crater size)
  const wavelength_km = craterDiameterM * 3 / 1000; // Empirical factor
  
  return {
    waveHeight_m: Math.min(waveHeight_m, 1000), // Cap at 1km
    waveSpeed_ms,
    wavelength_km
  };
}

/**
 * Propagate tsunami wave to distance
 * Simplified shallow water wave equation
 */
function propagateWave(
  initialHeight_m: number,
  distance_km: number,
  waterDepth_m: number,
  wavelength_km: number
): { height_m: number; arrivalTime_minutes: number } {
  const g = 9.81;
  const waveSpeed_ms = Math.sqrt(g * waterDepth_m);
  
  // Geometric spreading (cylindrical for tsunami)
  const r0 = wavelength_km; // Initial radius
  const r = distance_km;
  const spreadingFactor = Math.sqrt(r0 / Math.max(r, r0));
  
  // Dispersion and attenuation
  const dispersionFactor = Math.exp(-distance_km / (1000 * wavelength_km));
  
  // Wave height at distance
  const height_m = initialHeight_m * spreadingFactor * dispersionFactor;
  
  // Arrival time
  const arrivalTime_minutes = (distance_km * 1000) / waveSpeed_ms / 60;
  
  return { height_m, arrivalTime_minutes };
}

/**
 * Calculate runup (wave height on shore)
 * Runup is typically 2-5x the offshore wave height
 */
function calculateRunup(waveHeight_m: number, slopeAngle_deg: number = 5): number {
  const slopeRad = slopeAngle_deg * Math.PI / 180;
  const runupFactor = 2.0 + 3.0 * Math.sin(slopeRad);
  return waveHeight_m * runupFactor;
}

/**
 * Calculate inundation distance
 * Distance inland that tsunami penetrates
 */
function calculateInundation(runup_m: number, terrainSlope_deg: number = 1): number {
  const slopeRad = terrainSlope_deg * Math.PI / 180;
  return runup_m / Math.tan(slopeRad);
}

/**
 * Simulate tsunami propagation
 */
export function simulateTsunami(params: TsunamiParameters): TsunamiSimulationResult {
  const { impactLocation } = params;
  
  // Calculate initial wave
  const initialWave = calculateInitialWave(params);
  
  // Generate wave profiles at various distances
  const distances_km = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000];
  const waveProfiles: TsunamiWaveProfile[] = distances_km.map(distance => {
    const wave = propagateWave(
      initialWave.waveHeight_m,
      distance,
      params.waterDepthM,
      initialWave.wavelength_km
    );
    const runup = calculateRunup(wave.height_m);
    const inundation = calculateInundation(runup);
    
    return {
      distance_km: distance,
      arrivalTime_minutes: wave.arrivalTime_minutes,
      waveHeight_m: wave.height_m,
      runup_m: runup,
      inundationDistance_m: inundation
    };
  });
  
  // Identify affected coastlines (simplified - major coastal cities)
  const affectedCoastlines = identifyAffectedCoastlines(
    impactLocation,
    waveProfiles,
    params.waterDepthM
  );
  
  // Generate ComMIT job script
  const commitJobScript = generateCommitJobScript(params, initialWave);
  
  return {
    impactLocation,
    initialWaveHeight_m: initialWave.waveHeight_m,
    initialWaveSpeed_ms: initialWave.waveSpeed_ms,
    energyTransferEfficiency: 0.01,
    waveProfiles,
    affectedCoastlines,
    commitJobScript
  };
}

/**
 * Identify major coastlines that could be affected
 */
function identifyAffectedCoastlines(
  impactLocation: { lat: number; lng: number },
  waveProfiles: TsunamiWaveProfile[],
  waterDepth_m: number
): Array<{
  name: string;
  lat: number;
  lng: number;
  distance_km: number;
  arrivalTime_minutes: number;
  maxWaveHeight_m: number;
  maxRunup_m: number;
  populationAtRisk: number;
}> {
  // Major coastal cities database (simplified)
  const coastalCities = [
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, population: 14000000 },
    { name: 'Los Angeles, USA', lat: 33.9416, lng: -118.4085, population: 4000000 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, population: 5000000 },
    { name: 'Mumbai, India', lat: 18.9388, lng: 72.8354, population: 20000000 },
    { name: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729, population: 6500000 },
    { name: 'Shanghai, China', lat: 31.2304, lng: 121.4737, population: 24000000 },
    { name: 'New York, USA', lat: 40.7128, lng: -74.0060, population: 8000000 },
    { name: 'Miami, USA', lat: 25.7617, lng: -80.1918, population: 500000 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, population: 5700000 },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, population: 7500000 }
  ];
  
  const affected = coastalCities.map(city => {
    const distance_km = haversineDistance(
      impactLocation.lat,
      impactLocation.lng,
      city.lat,
      city.lng
    );
    
    // Find closest wave profile
    let closestProfile = waveProfiles[0];
    let minDiff = Math.abs(waveProfiles[0].distance_km - distance_km);
    for (const profile of waveProfiles) {
      const diff = Math.abs(profile.distance_km - distance_km);
      if (diff < minDiff) {
        minDiff = diff;
        closestProfile = profile;
      }
    }
    
    // Estimate population at risk (simplified)
    const waveHeight = closestProfile.waveHeight_m;
    const riskFactor = Math.min(1.0, waveHeight / 10); // 10m wave = 100% risk
    const populationAtRisk = Math.round(city.population * riskFactor * 0.1); // 10% coastal
    
    return {
      name: city.name,
      lat: city.lat,
      lng: city.lng,
      distance_km,
      arrivalTime_minutes: closestProfile.arrivalTime_minutes,
      maxWaveHeight_m: closestProfile.waveHeight_m,
      maxRunup_m: closestProfile.runup_m,
      populationAtRisk
    };
  }).filter(city => city.distance_km < 10000 && city.maxWaveHeight_m > 0.5); // Filter relevant
  
  return affected.sort((a, b) => b.maxWaveHeight_m - a.maxWaveHeight_m);
}

/**
 * Haversine distance between two lat/lng points
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate ComMIT/MOST job script
 */
function generateCommitJobScript(
  params: TsunamiParameters,
  initialWave: { waveHeight_m: number; waveSpeed_ms: number; wavelength_km: number }
): string {
  return `#!/bin/bash
# ComMIT/MOST Tsunami Simulation Job Script
# Generated for asteroid impact tsunami modeling
# Reference: NOAA PMEL ComMIT framework

# Impact Parameters
IMPACT_LAT=${params.impactLocation.lat.toFixed(4)}
IMPACT_LNG=${params.impactLocation.lng.toFixed(4)}
CRATER_DIAMETER=${params.craterDiameterM.toFixed(0)}
WATER_DEPTH=${params.waterDepthM.toFixed(0)}
IMPACT_ANGLE=${params.impactAngleDeg.toFixed(1)}

# Initial Wave Parameters
WAVE_HEIGHT=${initialWave.waveHeight_m.toFixed(2)}
WAVE_SPEED=${initialWave.waveSpeed_ms.toFixed(2)}
WAVELENGTH=${initialWave.wavelength_km.toFixed(2)}

# Simulation Configuration
GRID_RESOLUTION=30  # arc-seconds
TIME_STEP=1.0       # seconds
DURATION=43200      # 12 hours in seconds
OUTPUT_INTERVAL=300 # 5 minutes

# Create initial condition file
cat > initial_condition.dat << EOF
# Asteroid impact tsunami initial condition
# Format: lon lat amplitude(m) period(s)
\${IMPACT_LNG} \${IMPACT_LAT} \${WAVE_HEIGHT} 600
EOF

# Run MOST propagation model
echo "Running MOST tsunami propagation model..."
most_propagate \\
  --initial-condition initial_condition.dat \\
  --bathymetry etopo1_30s.nc \\
  --grid-resolution \${GRID_RESOLUTION} \\
  --time-step \${TIME_STEP} \\
  --duration \${DURATION} \\
  --output-interval \${OUTPUT_INTERVAL} \\
  --output-dir ./tsunami_output

# Run inundation model for affected coastlines
echo "Running inundation models..."
most_inundation \\
  --propagation-data ./tsunami_output/propagation.nc \\
  --dem high_res_dem.nc \\
  --output-dir ./inundation_output

# Generate visualization
echo "Generating visualization..."
python3 visualize_tsunami.py \\
  --propagation ./tsunami_output/propagation.nc \\
  --inundation ./inundation_output/inundation.nc \\
  --output ./tsunami_visualization.mp4

echo "Simulation complete. Results in ./tsunami_output/"
`;
}

/**
 * Check if impact location is oceanic
 */
export function isOceanicImpact(lat: number, lng: number): boolean {
  // Simplified ocean detection
  // In production, would use actual bathymetry data
  
  // Major ocean regions (simplified)
  const oceanRegions = [
    { name: 'Pacific', latMin: -60, latMax: 60, lngMin: -180, lngMax: -70 },
    { name: 'Pacific', latMin: -60, latMax: 60, lngMin: 100, lngMax: 180 },
    { name: 'Atlantic', latMin: -60, latMax: 70, lngMin: -70, lngMax: 20 },
    { name: 'Indian', latMin: -60, latMax: 30, lngMin: 20, lngMax: 100 },
  ];
  
  for (const region of oceanRegions) {
    if (
      lat >= region.latMin &&
      lat <= region.latMax &&
      lng >= region.lngMin &&
      lng <= region.lngMax
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Estimate water depth at location (simplified)
 */
export function estimateWaterDepth(lat: number, lng: number): number {
  // Simplified bathymetry model
  // In production, would query actual bathymetry database (ETOPO1, GEBCO)
  
  if (!isOceanicImpact(lat, lng)) {
    return 0;
  }
  
  // Average ocean depth is ~3700m
  // Deep ocean trenches: up to 11000m
  // Continental shelf: 0-200m
  
  // Simplified: assume deep ocean
  return 4000;
}

export const TsunamiSimulator = {
  simulateTsunami,
  isOceanicImpact,
  estimateWaterDepth,
  calculateInitialWave
};
