// orbital.ts - Comprehensive Keplerian orbital mechanics
// Based on NASA JPL orbital mechanics and NeoWs API integration

/**
 * Orbital elements structure matching NASA NeoWs format
 */
export interface OrbitalElements {
  aAU: number;            // semi-major axis in AU
  e: number;              // eccentricity (unitless)
  iDeg: number;           // inclination (degrees)
  omegaDeg: number;       // argument of periapsis (ω) in degrees
  OmegaDeg: number;       // longitude of ascending node (Ω) in degrees
  Mdeg: number;           // mean anomaly at epoch (M0) in degrees
  epochJD: number;        // Julian Date epoch
}

/**
 * 3D position vector in heliocentric ecliptic coordinates
 */
export interface Vector3D {
  xAU: number;
  yAU: number;
  zAU: number;
  rAU?: number;  // magnitude
}

// Physical constants
const AU_IN_KM = 149597870.7; // km per AU
const MU_SUN = 0.0002959122082855911; // GM of sun in AU^3/day^2
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_AU = EARTH_RADIUS_KM / AU_IN_KM;

// Numerical tolerances
const KEPLER_TOL = 1e-12;
const KEPLER_MAX_ITERS = 100;

/**
 * Convert degrees to radians
 */
export function deg2rad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function rad2deg(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
 * Uses Newton-Raphson iteration
 * 
 * @param Mrad - Mean anomaly in radians
 * @param e - Eccentricity
 * @param tol - Convergence tolerance
 * @param maxIter - Maximum iterations
 * @returns Eccentric anomaly in radians
 */
export function solveKepler(Mrad: number, e: number, tol: number = KEPLER_TOL, maxIter: number = KEPLER_MAX_ITERS): number {
  // Normalize M to [0, 2π]
  let M = ((Mrad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // Initial guess for E
  let E = e < 0.8 ? M : Math.PI;
  
  // Newton-Raphson iteration
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    
    if (Math.abs(dE) < tol) {
      return E;
    }
  }
  
  // If not converged, return best estimate
  console.warn(`Kepler solver did not converge after ${maxIter} iterations`);
  return E;
}

/**
 * Convert orbital elements to heliocentric ecliptic position
 * Implements standard orbital mechanics transformation
 * 
 * @param elements - Orbital elements
 * @param targetJD - Target Julian Date
 * @returns Position vector in AU
 */
export function orbitalElementsToState(elements: OrbitalElements, targetJD: number): Vector3D | null {
  const { aAU, e, iDeg, omegaDeg, OmegaDeg, Mdeg, epochJD } = elements;
  
  // Check for hyperbolic orbit (not supported in this implementation)
  if (e >= 1) {
    console.warn('Hyperbolic orbits (e >= 1) not supported');
    return null;
  }
  
  // Convert angles to radians
  const i = deg2rad(iDeg);
  const omega = deg2rad(omegaDeg);      // argument of periapsis
  const Omega = deg2rad(OmegaDeg);      // longitude of ascending node
  const M0 = deg2rad(Mdeg);
  
  // Mean motion: n = sqrt(μ / a³)
  const n = Math.sqrt(MU_SUN / (aAU * aAU * aAU)); // rad/day
  
  // Time since epoch (days)
  const dt = targetJD - epochJD;
  
  // Mean anomaly at target time
  let M = M0 + n * dt;
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // Solve for eccentric anomaly
  const E = solveKepler(M, e);
  
  // Compute true anomaly and radius
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const r = aAU * (1 - e * cosE); // radius in AU
  
  // True anomaly
  const nu = Math.atan2(Math.sqrt(1 - e * e) * sinE, cosE - e);
  
  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);
  
  // Rotation matrices to transform from orbital plane to ecliptic
  // R = Rz(Ω) * Rx(i) * Rz(ω)
  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosomega = Math.cos(omega);
  const sinomega = Math.sin(omega);
  
  // Apply rotation matrix
  const xAU = (cosOmega * cosomega - sinOmega * sinomega * cosi) * xOrb +
              (-cosOmega * sinomega - sinOmega * cosomega * cosi) * yOrb;
  
  const yAU = (sinOmega * cosomega + cosOmega * sinomega * cosi) * xOrb +
              (-sinOmega * sinomega + cosOmega * cosomega * cosi) * yOrb;
  
  const zAU = (sinomega * sini) * xOrb + (cosomega * sini) * yOrb;
  
  const rAU = Math.sqrt(xAU * xAU + yAU * yAU + zAU * zAU);
  
  return { xAU, yAU, zAU, rAU };
}

/**
 * Simple Earth position approximation (circular orbit)
 * For production, use JPL Horizons ephemeris
 * 
 * @param jd - Julian Date
 * @returns Earth position in AU
 */
export function earthStateAtJD(jd: number): Vector3D {
  // J2000 epoch
  const J2000 = 2451545.0;
  const dt = jd - J2000; // days since J2000
  
  // Earth's mean orbital elements (simplified circular orbit)
  const aEarth = 1.0; // AU
  const nEarth = Math.sqrt(MU_SUN / (aEarth * aEarth * aEarth)); // rad/day
  const M0Earth = 0; // mean anomaly at J2000
  
  // Mean anomaly at target time
  const M = M0Earth + nEarth * dt;
  
  // For circular orbit: E = M, nu = M
  const xAU = aEarth * Math.cos(M);
  const yAU = aEarth * Math.sin(M);
  const zAU = 0; // Earth's orbit is in the ecliptic plane
  
  return { xAU, yAU, zAU, rAU: aEarth };
}

/**
 * Check for collision between asteroid and Earth
 * 
 * @param asteroidElements - Asteroid orbital elements
 * @param tcaJD - Time of closest approach (Julian Date)
 * @param windowDays - Time window to search (days before/after TCA)
 * @param samples - Number of time samples
 * @returns Collision data
 */
export function checkCollision(
  asteroidElements: OrbitalElements,
  tcaJD: number,
  windowDays: number = 5,
  samples: number = 1000
): {
  collision: boolean;
  minDistance: number; // AU
  minDistanceKm: number;
  impactTime?: number; // JD
  impactPoint?: Vector3D;
  impactLatLng?: { lat: number; lng: number };
} {
  let minDistance = Infinity;
  let minDistanceKm = Infinity;
  let impactTime: number | undefined;
  let impactPoint: Vector3D | undefined;
  
  const dtStep = (2 * windowDays) / samples;
  
  for (let i = 0; i < samples; i++) {
    const dt = -windowDays + i * dtStep;
    const jd = tcaJD + dt;
    
    const astPos = orbitalElementsToState(asteroidElements, jd);
    if (!astPos) continue;
    
    const earthPos = earthStateAtJD(jd);
    
    // Distance between asteroid and Earth
    const dx = astPos.xAU - earthPos.xAU;
    const dy = astPos.yAU - earthPos.yAU;
    const dz = astPos.zAU - earthPos.zAU;
    const distanceAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const distanceKm = distanceAU * AU_IN_KM;
    
    if (distanceAU < minDistance) {
      minDistance = distanceAU;
      minDistanceKm = distanceKm;
      impactTime = jd;
      impactPoint = astPos;
    }
  }
  
  const collision = minDistanceKm < EARTH_RADIUS_KM * 2; // Include margin
  
  let impactLatLng: { lat: number; lng: number } | undefined;
  if (collision && impactPoint) {
    impactLatLng = eclipticToLatLng(impactPoint);
  }
  
  return {
    collision,
    minDistance,
    minDistanceKm,
    impactTime: collision ? impactTime : undefined,
    impactPoint: collision ? impactPoint : undefined,
    impactLatLng
  };
}

/**
 * Convert ecliptic coordinates to approximate lat/lng
 * Simplified conversion for visualization
 * 
 * @param pos - Position in ecliptic coordinates
 * @returns Latitude and longitude
 */
export function eclipticToLatLng(pos: Vector3D): { lat: number; lng: number } {
  const { xAU, yAU, zAU } = pos;
  const r = Math.sqrt(xAU * xAU + yAU * yAU + zAU * zAU);
  
  if (r === 0) return { lat: 0, lng: 0 };
  
  // Latitude from z-component
  const lat = rad2deg(Math.asin(zAU / r));
  
  // Longitude from x,y components
  const lng = rad2deg(Math.atan2(yAU, xAU));
  
  return { lat, lng };
}

/**
 * Sample asteroid trajectory over time
 * 
 * @param elements - Orbital elements
 * @param startJD - Start Julian Date
 * @param endJD - End Julian Date
 * @param samples - Number of samples
 * @returns Array of position vectors
 */
export function sampleTrajectory(
  elements: OrbitalElements,
  startJD: number,
  endJD: number,
  samples: number = 100
): Vector3D[] {
  const trajectory: Vector3D[] = [];
  const dtStep = (endJD - startJD) / (samples - 1);
  
  for (let i = 0; i < samples; i++) {
    const jd = startJD + i * dtStep;
    const pos = orbitalElementsToState(elements, jd);
    if (pos) {
      trajectory.push(pos);
    }
  }
  
  return trajectory;
}

/**
 * Calculate impact energy from asteroid parameters
 * 
 * @param radiusMeters - Asteroid radius in meters
 * @param densityKgM3 - Density in kg/m³
 * @param velocityMS - Velocity in m/s
 * @returns Impact energy in Joules
 */
export function calculateImpactEnergy(radiusMeters: number, densityKgM3: number, velocityMS: number): number {
  const volume = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
  const mass = volume * densityKgM3;
  return 0.5 * mass * velocityMS * velocityMS;
}

/**
 * Convert impact energy to seismic magnitude
 * Uses empirical relationship with seismic coupling factor
 * 
 * @param energyJoules - Impact energy in Joules
 * @param coupling - Seismic coupling factor (default 1e-4)
 * @returns Seismic magnitude and energy
 */
export function impactEnergyToSeismicMagnitude(energyJoules: number, coupling: number = 1e-4): {
  seismicEnergy: number;
  magnitude: number;
} {
  const seismicEnergy = energyJoules * coupling;
  // Mw ≈ (2/3) * log10(Es) - 6.0 (approximate relationship)
  const magnitude = (2 / 3) * Math.log10(Math.max(seismicEnergy, 1)) - 6.0;
  
  return { seismicEnergy, magnitude };
}

/**
 * Estimate tsunami radius from impact energy
 * Very simplified model for educational purposes
 * 
 * @param energyMegatons - Impact energy in megatons TNT
 * @returns Tsunami radius in km
 */
export function estimateTsunamiRadius(energyMegatons: number): number {
  // Rough scaling: radius ~ energy^(1/3)
  return Math.max(10, 300 * Math.pow(Math.max(energyMegatons, 0.001), 1 / 3));
}

/**
 * Convert Julian Date to calendar date
 * 
 * @param jd - Julian Date
 * @returns Date object
 */
export function julianToDate(jd: number): Date {
  const unixTime = (jd - 2440587.5) * 86400000; // Convert to Unix timestamp
  return new Date(unixTime);
}

/**
 * Convert calendar date to Julian Date
 * 
 * @param date - Date object
 * @returns Julian Date
 */
export function dateToJulian(date: Date): number {
  const unixTime = date.getTime();
  return (unixTime / 86400000) + 2440587.5;
}

export const OrbitalMechanics = {
  solveKepler,
  orbitalElementsToState,
  earthStateAtJD,
  checkCollision,
  eclipticToLatLng,
  sampleTrajectory,
  calculateImpactEnergy,
  impactEnergyToSeismicMagnitude,
  estimateTsunamiRadius,
  julianToDate,
  dateToJulian,
  deg2rad,
  rad2deg,
  AU_IN_KM,
  EARTH_RADIUS_KM
};
