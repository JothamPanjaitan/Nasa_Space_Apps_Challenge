import type { ImpactData, IndirectImpact, SimulationParameters, PhysicsConstants } from '../types/impact';

// Physics constants
export const PHYSICS_CONSTANTS: PhysicsConstants = {
  J_PER_TON_TNT: 4.184e9,
  DEFAULT_DENSITY: 3000, // kg/m^3
  EARTH_RADIUS: 6.371e6, // m
  GRAVITY: 9.81, // m/s^2
  ATMOSPHERE_SCALE_HEIGHT: 8000, // m
};

const { J_PER_TON_TNT, DEFAULT_DENSITY, EARTH_RADIUS } = PHYSICS_CONSTANTS;

/**
 * Convert diameter to mass using spherical approximation
 */
export function diameterToMassKg(diameterM: number, densityKgM3 = DEFAULT_DENSITY): number {
  const r = diameterM / 2;
  return (4 / 3) * Math.PI * r * r * r * densityKgM3;
}

/**
 * Calculate kinetic energy from mass and velocity
 */
export function kineticEnergyJ(massKg: number, velocityKms: number): number {
  const v = velocityKms * 1000; // convert km/s to m/s
  return 0.5 * massKg * v * v;
}

/**
 * Convert energy to TNT equivalent
 */
export function energyToTNTTons(energyJ: number): number {
  return energyJ / J_PER_TON_TNT;
}

/**
 * Estimate crater diameter using Schmidt-Holsapple scaling
 * Educational approximation with labeled uncertainty
 */
export function estimateCraterDiameterM(
  massKg: number, 
  velocityKms: number, 
  densityTarget = 2700,
  impactAngle = 45 // degrees from vertical
): number {
  const v = velocityKms * 1000;
  const rhoImp = 3000; // kg/m^3 typical asteroid density
  const angleFactor = Math.sin((impactAngle * Math.PI) / 180);
  
  // Schmidt-Holsapple inspired scaling with empirical constant
  const k = 1.3; // tuned for Earth-like values
  const term = Math.cbrt(massKg) * Math.pow(v, 0.44);
  const D = k * term * Math.cbrt(rhoImp / densityTarget) * Math.pow(angleFactor, 0.33);
  
  return D; // meters (transient crater diameter)
}

/**
 * Calculate seismic magnitude from impact energy
 * Uses seismic efficiency factor to account for energy conversion
 */
export function energyToSeismicMagnitude(
  energyJ: number, 
  etaSeismic = 1e-4 // seismic efficiency
): number {
  const Es = Math.max(1, energyJ * etaSeismic);
  return Math.log10(Es) - 4.8;
}

/**
 * Estimate tsunami radius (first-order approximation)
 * Based on energy scaling and coastal geometry
 */
export function estimateTsunamiRadiusKm(
  tntTons: number,
  impactLocation: { lat: number; lng: number }
): number {
  // Check if impact is in ocean (simplified)
  const isOceanic = Math.abs(impactLocation.lat) < 30 || 
                   (Math.abs(impactLocation.lat) > 60) ||
                   Math.abs(impactLocation.lng) > 150;
  
  if (!isOceanic) return 0;
  
  const C = 5; // tuned constant for tsunami propagation
  return C * Math.sqrt(Math.max(0, tntTons) / 1e3);
}

/**
 * Calculate blast overpressure radii
 * Based on TNT scaling laws
 */
export function calculateBlastRadii(tntTons: number): {
  onePsi: number;
  threePsi: number;
  fivePsi: number;
} {
  const W = tntTons;
  const onePsi = 280 * Math.pow(W, 1/3); // meters
  const threePsi = 120 * Math.pow(W, 1/3); // meters
  const fivePsi = 80 * Math.pow(W, 1/3); // meters
  
  return {
    onePsi: onePsi / 1000, // convert to km
    threePsi: threePsi / 1000,
    fivePsi: fivePsi / 1000
  };
}

/**
 * Estimate thermal radiation radius
 */
export function estimateThermalRadius(tntTons: number): number {
  const W = tntTons;
  return (200 * Math.pow(W, 1/3)) / 1000; // km
}

/**
 * Calculate population at risk (simplified)
 */
export function estimatePopulationAtRisk(
  impactLocation: { lat: number; lng: number },
  blastRadiusKm: number
): number {
  // Simplified population density model
  const populationDensity = getPopulationDensity(impactLocation.lat, impactLocation.lng);
  const areaKm2 = Math.PI * blastRadiusKm * blastRadiusKm;
  return Math.round(populationDensity * areaKm2);
}

/**
 * Get population density by location (simplified model)
 */
function getPopulationDensity(lat: number, lng: number): number {
  // Simplified population density model
  // In reality, this would use actual population data
  
  // Urban areas (high density)
  if (isUrbanArea(lat, lng)) {
    return 2000; // people per km²
  }
  
  // Coastal areas (medium density)
  if (isCoastalArea(lat, lng)) {
    return 500;
  }
  
  // Rural areas (low density)
  return 50;
}

/**
 * Check if location is in urban area (simplified)
 */
function isUrbanArea(lat: number, lng: number): boolean {
  // Major urban centers (simplified)
  const urbanCenters = [
    { lat: 40.7128, lng: -74.0060, radius: 100 }, // NYC
    { lat: 51.5074, lng: -0.1278, radius: 80 },   // London
    { lat: 35.6762, lng: 139.6503, radius: 80 },  // Tokyo
    { lat: 48.8566, lng: 2.3522, radius: 60 },    // Paris
    { lat: 39.9042, lng: 116.4074, radius: 80 },  // Beijing
    { lat: -33.8688, lng: 151.2093, radius: 60 }, // Sydney
    { lat: 37.7749, lng: -122.4194, radius: 60 }, // San Francisco
    { lat: 41.8781, lng: -87.6298, radius: 60 },  // Chicago
  ];
  
  return urbanCenters.some(center => {
    const distance = Math.sqrt(
      Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
    );
    return distance < center.radius / 111; // rough km to degrees conversion
  });
}

/**
 * Check if location is coastal (simplified)
 */
function isCoastalArea(lat: number, lng: number): boolean {
  // Simplified coastal detection
  // In reality, this would use actual coastline data
  const coastalThreshold = 50; // km from coast
  
  // Major coastlines (simplified)
  const isNearCoast = (
    Math.abs(lat) < 20 || // tropical coasts
    Math.abs(lng) > 150 || // Pacific coasts
    (Math.abs(lat) > 40 && Math.abs(lng) < 20) || // Atlantic coasts
    (Math.abs(lat) > 30 && Math.abs(lng) > 100 && Math.abs(lng) < 150) // Asian coasts
  );
  
  return isNearCoast;
}

/**
 * Calculate atmospheric effects from impact
 */
export function calculateAtmosphericEffects(
  energyJ: number,
  tntTons: number
): {
  dustMassKg: number;
  aerosolRadiusKm: number;
  temperatureDropC: number;
  durationDays: number;
} {
  // Dust injection scaling (empirical)
  const dustMassKg = Math.pow(tntTons, 0.7) * 1e6; // kg of dust
  
  // Aerosol spread radius (stratospheric)
  const aerosolRadiusKm = 500 + Math.sqrt(tntTons / 1000) * 100;
  
  // Temperature drop (simplified climate model)
  const temperatureDropC = Math.min(15, Math.log10(tntTons / 1e6) * 2);
  
  // Duration of atmospheric effects
  const durationDays = Math.min(365 * 3, Math.sqrt(tntTons / 1000) * 30);
  
  return { dustMassKg, aerosolRadiusKm, temperatureDropC, durationDays };
}

/**
 * Generate indirect impacts based on energy and location
 */
export function generateIndirectImpacts(
  energyJ: number,
  tntTons: number,
  impactLocation: { lat: number; lng: number },
  seismicMagnitude: number
): IndirectImpact[] {
  const impacts: IndirectImpact[] = [];
  
  // Tsunami impact
  const tsunamiRadius = estimateTsunamiRadiusKm(tntTons, impactLocation);
  if (tsunamiRadius > 0) {
    impacts.push({
      type: 'tsunami',
      radiusKm: tsunamiRadius,
      intensity: Math.sqrt(tntTons / 1000), // simplified wave height
      populationAtRisk: estimatePopulationAtRisk(impactLocation, tsunamiRadius),
      description: `Tsunami with ${tsunamiRadius.toFixed(0)} km radius`
    });
  }
  
  // Seismic impact
  impacts.push({
    type: 'seismic',
    radiusKm: Math.max(1, seismicMagnitude * 10),
    intensity: seismicMagnitude,
    description: `Earthquake equivalent to M${seismicMagnitude.toFixed(1)}`
  });
  
  // Wildfire impact (if on land)
  if (!isCoastalArea(impactLocation.lat, impactLocation.lng)) {
    const fireRadius = estimateThermalRadius(tntTons) * 2;
    if (fireRadius > 5) { // only if significant
      impacts.push({
        type: 'wildfire',
        radiusKm: fireRadius,
        intensity: tntTons / 1000,
        description: `Wildfire zone with ${fireRadius.toFixed(0)} km radius`
      });
    }
  }
  
  // Atmospheric effects (for large impacts)
  if (tntTons > 1e6) { // > 1 megaton
    const atmo = calculateAtmosphericEffects(energyJ, tntTons);
    impacts.push({
      type: 'landslide', // reusing type for atmospheric
      radiusKm: atmo.aerosolRadiusKm,
      intensity: atmo.temperatureDropC,
      description: `Atmospheric effects: ${atmo.temperatureDropC.toFixed(1)}°C cooling, ${(atmo.durationDays / 365).toFixed(1)} years`
    });
  }
  
  return impacts;
}

/**
 * Main function to compute all impact estimates
 */
export function computeImpactEstimates(
  impact: ImpactData,
  params?: SimulationParameters
): ImpactData {
  const diameterM = impact.diameterM ?? 0;
  const density = params?.density || (impact.densityKgM3 ?? DEFAULT_DENSITY);
  const velocity = impact.velocityKms;
  
  // Calculate mass
  const massKg = impact.massKg ?? (diameterM > 0 ? diameterToMassKg(diameterM, density) : 0);
  
  // Calculate energy
  const energyJ = kineticEnergyJ(massKg, velocity);
  const tnt = energyToTNTTons(energyJ);
  
  // Calculate crater
  const craterM = estimateCraterDiameterM(massKg, velocity, params?.targetDensity);
  
  // Calculate seismic effects
  const seismicM = energyToSeismicMagnitude(energyJ, params?.seismicEfficiency);
  
  // Calculate blast radii
  const blastRadii = calculateBlastRadii(tnt);
  
  // Calculate thermal radius
  const thermalRadius = estimateThermalRadius(tnt);
  
  // Calculate indirect impacts
  const impactLocation = impact.impactLocation || { lat: impact.lat || 0, lng: impact.lng || 0 };
  const indirectImpacts = generateIndirectImpacts(energyJ, tnt, impactLocation, seismicM);
  
  // Calculate population at risk
  const populationAtRisk = estimatePopulationAtRisk(impactLocation, blastRadii.fivePsi);
  
  return {
    ...impact,
    massKg,
    kineticEnergyJ: energyJ,
    energy: energyJ,
    tntEquivalentTons: tnt,
    tntEquivalent: tnt,
    craterDiameterKm: craterM / 1000,
    craterDepth: craterM / 5, // typical depth to diameter ratio
    seismicMagnitude: seismicM,
    blastRadius: blastRadii.fivePsi,
    heavyDamageRadius: blastRadii.threePsi,
    moderateDamageRadius: blastRadii.onePsi,
    thermalRadius: thermalRadius,
    seismicRadius: Math.max(1, seismicM * 10),
    fireballRadius: thermalRadius * 0.5,
    tsunamiRadius: indirectImpacts.find(i => i.type === 'tsunami')?.radiusKm || 0,
    tsunamiHeight: indirectImpacts.find(i => i.type === 'tsunami')?.intensity || 0,
    tsunamiRisk: indirectImpacts.find(i => i.type === 'tsunami') ? 1 : 0,
    populationAtRisk,
    indirectImpacts,
    ejectaVolume: Math.PI * Math.pow(craterM / 2, 3) * 0.1, // simplified
    seismicIntensity: seismicM > 7 ? '8' : seismicM > 6 ? '7' : seismicM > 5 ? '6' : '5',
    earlyWarningTime: 0,
    recommendedActions: [],
    infrastructureAtRisk: []
  };
}

/**
 * Get physics formula information for UI display
 */
export function getPhysicsFormulas(): Record<string, { formula: string; description: string }> {
  return {
    kineticEnergy: {
      formula: 'E = ½mv²',
      description: 'Kinetic energy from mass and velocity'
    },
    tntEquivalent: {
      formula: 'TNT = E / 4.184×10⁹',
      description: 'Energy converted to TNT equivalent'
    },
    craterDiameter: {
      formula: 'D = k × ∛(m) × v^0.44 × ∛(ρi/ρt)',
      description: 'Schmidt-Holsapple crater scaling (approximate)'
    },
    seismicMagnitude: {
      formula: 'Mw = log₁₀(ηs × E) - 4.8',
      description: 'Seismic magnitude from impact energy'
    },
    tsunamiRadius: {
      formula: 'R = C × √(TNT/1000)',
      description: 'First-order tsunami propagation radius'
    }
  };
}
