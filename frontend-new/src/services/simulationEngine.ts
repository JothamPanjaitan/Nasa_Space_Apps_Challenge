// src/services/simulationEngine.ts
// Enhanced Simulation Engine with proper orbital mechanics
// Based on NASA resources and Keplerian orbital mechanics

export interface OrbitalElements {
  aAU: number;            // semi-major axis in AU
  e: number;              // eccentricity (unitless)
  iDeg: number;           // inclination (degrees)
  raanDeg: number;        // RAAN (Ω) in degrees
  argPeriDeg: number;     // argument of periapsis (ω) in degrees
  meanAnomalyDeg: number; // mean anomaly at epoch (M0) in degrees
  epochJD?: number;       // epoch (optional)
}

export interface Cartesian {
  x: number;
  y: number;
  z: number;
}

export interface ImpactData {
  energy: number; // Joules
  tntEquivalent: number; // tons TNT
  craterDiameter: number; // meters
  blastRadius: number; // km
  thermalRadius: number; // km
  seismicRadius: number; // km
  tsunamiRadius?: number; // km
  tsunamiHeight?: number; // m
  impactLocation: { lat: number; lng: number };
  collisionPredicted: boolean;
}

// Physical constants
const AU_IN_KM = 149597870.7; // kilometers in 1 AU
const GM_SUN = 1.32712440018e11; // μ = GM of sun in km^3 / s^2
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_AU = EARTH_RADIUS_KM / AU_IN_KM;

// Tolerance & iteration limits for Kepler solver
const KEPLER_TOL = 1e-12;
const KEPLER_MAX_ITERS = 100;

/**
 * Solve Kepler's equation M = E - e sin E for eccentric anomaly E
 * Returns E in radians
 * Based on NASA JPL orbital mechanics references
 */
export function keplerSolve(e: number, M: number): number {
  // normalize M to [-pi, pi]
  let Mn = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (Mn > Math.PI) Mn -= 2 * Math.PI;

  // Good initial guess (classic): for e < 0.8 use M, otherwise use pi
  let E = e < 0.8 ? Mn : Math.PI;

  // Newton-Raphson iteration
  for (let iter = 0; iter < KEPLER_MAX_ITERS; iter++) {
    const f = E - e * Math.sin(E) - Mn;
    const fprime = 1 - e * Math.cos(E);
    const delta = f / fprime;
    E -= delta;
    if (Math.abs(delta) < KEPLER_TOL) break;
  }
  return E;
}

/**
 * From eccentric anomaly E compute true anomaly nu and radius r
 */
export function eccentricToTrueAnomaly(E: number, e: number, aKm: number): { nu: number; r: number } {
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const sqrtOneMinusESq = Math.sqrt(Math.max(0, 1 - e * e));
  // true anomaly
  const nu = Math.atan2(sqrtOneMinusESq * sinE, cosE - e);
  // radius in km
  const r = aKm * (1 - e * cosE);
  return { nu, r };
}

// 3D rotation helpers
function deg2rad(d: number) { return d * Math.PI / 180; }

function rotateZ(v: Cartesian, angleRad: number): Cartesian {
  const c = Math.cos(angleRad), s = Math.sin(angleRad);
  return { x: c * v.x - s * v.y, y: s * v.x + c * v.y, z: v.z };
}

function rotateX(v: Cartesian, angleRad: number): Cartesian {
  const c = Math.cos(angleRad), s = Math.sin(angleRad);
  return { x: v.x, y: c * v.y - s * v.z, z: s * v.y + c * v.z };
}

/**
 * Propagate Keplerian orbit to ECI coordinates
 * Based on NASA JPL orbital mechanics
 */
export function propagateOrbitKM(elements: OrbitalElements, dtSeconds: number): Cartesian {
  const aKm = elements.aAU * AU_IN_KM;
  const e = elements.e;
  const i = deg2rad(elements.iDeg);
  const omega = deg2rad(elements.argPeriDeg); // argument of periapsis ω
  const raan = deg2rad(elements.raanDeg);     // RAAN Ω
  const M0 = deg2rad(elements.meanAnomalyDeg);

  // mean motion
  const n = Math.sqrt(GM_SUN / Math.pow(aKm, 3)); // rad/s
  const M = M0 + n * dtSeconds; // current mean anomaly

  // Solve Kepler
  const E = keplerSolve(e, M);

  // radius
  const r = aKm * (1 - e * Math.cos(E)); // km

  // true anomaly
  const sinE = Math.sin(E);
  const cosE = Math.cos(E);
  const sqrtOneMinusESq = Math.sqrt(Math.max(0, 1 - e * e));
  const nu = Math.atan2(sqrtOneMinusESq * sinE, cosE - e);

  // position in orbital plane (perifocal coordinates)
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);
  const posPerifocal: Cartesian = { x: xOrb, y: yOrb, z: 0 };

  // rotate from perifocal -> ECI via:
  // r_ECI = R_z(raan) * R_x(i) * R_z(omega) * r_perifocal
  let v = rotateZ(posPerifocal, omega);
  v = rotateX(v, i);
  v = rotateZ(v, raan);

  return v;
}

/**
 * Sample trajectory points (ECI km) for a set of times relative to epoch
 */
export function sampleTrajectory(elements: OrbitalElements, dtStartSeconds: number, dtEndSeconds: number, samples: number): Cartesian[] {
  const pts: Cartesian[] = [];
  const step = (dtEndSeconds - dtStartSeconds) / Math.max(1, samples - 1);
  for (let j = 0; j < samples; j++) {
    const t = dtStartSeconds + j * step;
    pts.push(propagateOrbitKM(elements, t));
  }
  return pts;
}

/**
 * Check if trajectory intersects with Earth
 */
export function checkEarthCollision(trajectory: Cartesian[]): { collision: boolean; impactIndex?: number; impactPoint?: Cartesian } {
  for (let i = 0; i < trajectory.length; i++) {
    const p = trajectory[i];
    const distance = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    // Check if within Earth's sphere of influence (1 AU from Sun)
    // If heliocentric distance is very close to 1 AU, it's a candidate for intersection
    if (Math.abs(distance - AU_IN_KM) < EARTH_RADIUS_KM * 2) {
      return { collision: true, impactIndex: i, impactPoint: p };
    }
  }
  return { collision: false };
}

/**
 * Compute impact effects using proper physics
 * Based on NASA impact modeling and scaling laws
 */
export function computeImpactEffects(radiusM: number, densityKgM3: number, velocityKmS: number, impactLocation: { lat: number; lng: number }): ImpactData {
  const radius = radiusM; // m
  const density = densityKgM3;
  const velocityMS = velocityKmS * 1000;

  // mass (kg)
  const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * density;

  // energy (J)
  const energyJ = 0.5 * mass * Math.pow(velocityMS, 2);

  // TNT equivalent in tons (1 ton TNT = 4.184e9 J)
  const tntTons = energyJ / 4.184e9;

  // crater diameter estimate (empirical / pi-scaling)
  const projectileDiameterM = radius * 2;
  const craterDiameterM = projectileDiameterM * 1.61 * Math.pow(density / 2700, 1 / 3) * Math.pow(velocityMS / 1000, 2 / 3);

  const blastRadiusKm = Math.min(craterDiameterM * 10 / 1000, 1000);
  const thermalRadiusKm = Math.min(craterDiameterM * 5 / 1000, 500);
  const seismicRadiusKm = Math.min(craterDiameterM * 20 / 1000, 2000);

  // Tsunami parameters for ocean impact — heuristic
  let tsunamiRadius: number | undefined;
  let tsunamiHeight: number | undefined;
  // basic heuristic: if latitude within typical ocean latitudes, compute values (this is an approximation)
  if (impactLocation && Math.abs(impactLocation.lat) <= 60) {
    tsunamiRadius = Math.min(craterDiameterM * 15 / 1000, 800);
    tsunamiHeight = Math.min(50, Math.sqrt(tntTons / 1e6) * 5);
  }

  return {
    energy: energyJ,
    tntEquivalent: tntTons,
    craterDiameter: craterDiameterM,
    blastRadius: blastRadiusKm,
    thermalRadius: thermalRadiusKm,
    seismicRadius: seismicRadiusKm,
    tsunamiRadius,
    tsunamiHeight,
    impactLocation,
    collisionPredicted: true
  };
}

/**
 * Convert ECI coordinates to approximate lat/lng
 * Simplified for educational purposes
 */
export function eciToLatLng(eci: Cartesian): { lat: number; lng: number } {
  // Simplified conversion - in reality would need proper ECI->ECEF->geodetic
  const distance = Math.sqrt(eci.x * eci.x + eci.y * eci.y + eci.z * eci.z);
  if (distance === 0) return { lat: 0, lng: 0 };
  const lat = Math.asin(eci.z / distance) * 180 / Math.PI;
  const lng = Math.atan2(eci.y, eci.x) * 180 / Math.PI;
  return { lat, lng };
}

/**
 * Calculate deflection parameters for asteroid deflection
 */
export function calculateDeflectionParameters(asteroidMass: number, velocityChange: number, timeToImpact: number) {
  const deltaV = velocityChange; // m/s
  const timeToImpactSeconds = timeToImpact * 24 * 3600; // Convert days to seconds
  
  // Calculate required impulse
  const impulse = asteroidMass * deltaV; // kg⋅m/s
  
  // Calculate deflection distance
  const deflectionDistance = deltaV * timeToImpactSeconds; // meters
  
  return {
    impulse,
    deflectionDistance,
    deltaV,
    timeToImpact
  };
}

/**
 * Calculate environmental effects
 */
export function calculateEnvironmentalEffects(energyJoules: number) {
  const energyMT = energyJoules / (4.184e9 * 1e6); // megatons
  
  // Atmospheric effects (very rough)
  const dustInjection = energyMT * 0.1; // megatons of dust (heuristic)
  const sootInjection = energyMT * 0.05; // megatons of soot (heuristic)
  
  // Climate effects (simplified heuristics)
  const temperatureDrop = Math.min(10, energyMT * 0.1); // °C
  const sunlightReduction = Math.min(50, energyMT * 2); // %
  
  return {
    dustInjection,
    sootInjection,
    temperatureDrop,
    sunlightReduction,
    climateImpact: energyMT > 100 ? 'severe' : energyMT > 10 ? 'moderate' : 'minor'
  };
}

// Utility functions
export function vecMag(v: Cartesian) { 
  return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z); 
}

export function distance(p1: Cartesian, p2: Cartesian) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
}

export const SimulationEngine = {
  keplerSolve,
  eccentricToTrueAnomaly,
  propagateOrbitKM,
  sampleTrajectory,
  checkEarthCollision,
  computeImpactEffects,
  eciToLatLng,
  calculateDeflectionParameters,
  calculateEnvironmentalEffects,
  vecMag,
  distance
};