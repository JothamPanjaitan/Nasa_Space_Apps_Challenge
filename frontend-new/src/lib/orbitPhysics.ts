import type { 
  OrbitalElements, 
  Position3D, 
  Velocity3D, 
  StateVector, 
  OrbitPropagation, 
  DeltaVManuever,
  PhysicsConstants,
  KeplerSolver,
  OrbitIntegrator 
} from '../types/orbit';

export type { OrbitalElements } from '../types/orbit';
// Physics constants
export const ORBIT_PHYSICS_CONSTANTS: PhysicsConstants = {
  MU_SUN: 1.32712440018e20, // m^3/s^2
  MU_EARTH: 3.986004418e14, // m^3/s^2
  EARTH_RADIUS: 6.371e6, // m
  AU: 1.496e11, // m
  G: 6.67430e-11 // m^3/kg/s^2
};

const { MU_SUN, MU_EARTH, EARTH_RADIUS, AU } = ORBIT_PHYSICS_CONSTANTS;

/**
 * Kepler equation solver using Newton-Raphson method
 */
export class KeplerSolverImpl implements KeplerSolver {
  solve(M: number, e: number, tolerance = 1e-8): number {
    // Normalize mean anomaly to [0, 2π]
    M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    
    // Initial guess: E = M for circular orbits, E = π for parabolic
    let E = e < 0.8 ? M : Math.PI;
    
    for (let i = 0; i < 50; i++) {
      const f = E - e * Math.sin(E) - M;
      const df = 1 - e * Math.cos(E);
      
      if (Math.abs(f) < tolerance) {
        return E;
      }
      
      E = E - f / df;
    }
    
    return E;
  }
}

const keplerSolver = new KeplerSolverImpl();

/**
 * Convert orbital elements to position and velocity
 */
export function keplerianToPosition(
  elements: OrbitalElements, 
  tMs: number
): Position3D {
  const { a, e, i, omega, Omega, M0, epochMs } = elements;
  
  // Time since epoch
  const t = (tMs - epochMs) / 1000; // convert to seconds
  
  // Mean motion
  const n = Math.sqrt(MU_SUN / (a * a * a));
  
  // Mean anomaly at time t
  const M = (M0 + n * t) % (2 * Math.PI);
  
  // Solve Kepler equation
  const E = keplerSolver.solve(M, e);
  
  // True anomaly
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const sinV = (Math.sqrt(1 - e * e) * sinE) / (1 - e * cosE);
  const cosV = (cosE - e) / (1 - e * cosE);
  const v = Math.atan2(sinV, cosV);
  
  // Distance
  const r = a * (1 - e * cosE);
  
  // Position in orbital plane
  const xOrb = r * Math.cos(v);
  const yOrb = r * Math.sin(v);
  
  // Rotation matrices for orbital plane to inertial frame
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  
  // Rotation matrix elements
  const R11 = cosO * cosw - sinO * sinw * cosi;
  const R12 = -cosO * sinw - sinO * cosw * cosi;
  const R21 = sinO * cosw + cosO * sinw * cosi;
  const R22 = -sinO * sinw + cosO * cosw * cosi;
  const R31 = sinw * sini;
  const R32 = cosw * sini;
  
  return {
    x: R11 * xOrb + R12 * yOrb,
    y: R21 * xOrb + R22 * yOrb,
    z: R31 * xOrb + R32 * yOrb
  };
}

/**
 * Calculate velocity from orbital elements
 */
export function keplerianToVelocity(
  elements: OrbitalElements,
  tMs: number
): Velocity3D {
  const { a, e, i, omega, Omega, M0, epochMs } = elements;
  
  const t = (tMs - epochMs) / 1000;
  const n = Math.sqrt(MU_SUN / (a * a * a));
  const M = (M0 + n * t) % (2 * Math.PI);
  const E = keplerSolver.solve(M, e);
  
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const sinV = (Math.sqrt(1 - e * e) * sinE) / (1 - e * cosE);
  const cosV = (cosE - e) / (1 - e * cosE);
  
  const r = a * (1 - e * cosE);
  const h = Math.sqrt(MU_SUN * a * (1 - e * e));
  
  // Velocity in orbital plane
  const vxOrb = -(MU_SUN / h) * sinV;
  const vyOrb = (MU_SUN / h) * (e + cosV);
  
  // Apply rotations (same as position)
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  
  const R11 = cosO * cosw - sinO * sinw * cosi;
  const R12 = -cosO * sinw - sinO * cosw * cosi;
  const R21 = sinO * cosw + cosO * sinw * cosi;
  const R22 = -sinO * sinw + cosO * cosw * cosi;
  const R31 = sinw * sini;
  const R32 = cosw * sini;
  
  return {
    vx: R11 * vxOrb + R12 * vyOrb,
    vy: R21 * vxOrb + R22 * vyOrb,
    vz: R31 * vxOrb + R32 * vyOrb
  };
}

/**
 * Apply delta-v to orbital elements (simplified)
 */
export function applyDeltaVToElements(
  elements: OrbitalElements, 
  deltaVms: number,
  direction: 'prograde' | 'retrograde' | 'radial' = 'prograde'
): OrbitalElements {
  // Get current velocity
  const velocity = keplerianToVelocity(elements, Date.now());
  const vMag = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy + velocity.vz * velocity.vz);
  
  // Calculate new velocity
  let deltaVx = 0, deltaVy = 0, deltaVz = 0;
  
  switch (direction) {
    case 'prograde':
      // Add velocity in direction of motion
      deltaVx = (velocity.vx / vMag) * deltaVms;
      deltaVy = (velocity.vy / vMag) * deltaVms;
      deltaVz = (velocity.vz / vMag) * deltaVms;
      break;
    case 'retrograde':
      // Subtract velocity from direction of motion
      deltaVx = -(velocity.vx / vMag) * deltaVms;
      deltaVy = -(velocity.vy / vMag) * deltaVms;
      deltaVz = -(velocity.vz / vMag) * deltaVms;
      break;
    case 'radial':
      // Add velocity toward/away from Sun (simplified)
      const position = keplerianToPosition(elements, Date.now());
      const rMag = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
      deltaVx = (position.x / rMag) * deltaVms;
      deltaVy = (position.y / rMag) * deltaVms;
      deltaVz = (position.z / rMag) * deltaVms;
      break;
  }
  
  // Calculate new orbital energy
  const r = Math.sqrt(
    Math.pow(keplerianToPosition(elements, Date.now()).x, 2) +
    Math.pow(keplerianToPosition(elements, Date.now()).y, 2) +
    Math.pow(keplerianToPosition(elements, Date.now()).z, 2)
  );
  
  const vNew = Math.sqrt(
    Math.pow(velocity.vx + deltaVx, 2) +
    Math.pow(velocity.vy + deltaVy, 2) +
    Math.pow(velocity.vz + deltaVz, 2)
  );
  
  // New specific orbital energy
  const E = 0.5 * vNew * vNew - MU_SUN / r;
  
  // New semi-major axis
  const aNew = -MU_SUN / (2 * E);
  
  // For simplicity, assume circular orbit after maneuver
  return {
    ...elements,
    a: aNew,
    e: Math.max(0, Math.min(0.99, elements.e * 0.8)) // reduce eccentricity slightly
  };
}

/**
 * Calculate orbital period
 */
export function calculateOrbitalPeriod(a: number): number {
  return 2 * Math.PI * Math.sqrt((a * a * a) / MU_SUN);
}

/**
 * Calculate periapsis and apoapsis
 */
export function calculatePeriapsisApoapsis(a: number, e: number): { periapsis: number; apoapsis: number } {
  return {
    periapsis: a * (1 - e),
    apoapsis: a * (1 + e)
  };
}

/**
 * Simple orbit propagator
 */
export class SimpleOrbitIntegrator implements OrbitIntegrator {
  propagate(
    elements: OrbitalElements,
    startTime: number,
    endTime: number,
    stepSize: number
  ): OrbitPropagation {
    const positions: Array<{
      time: number;
      position: Position3D;
      velocity: Velocity3D;
    }> = [];
    
    const numSteps = Math.floor((endTime - startTime) / stepSize);
    
    for (let i = 0; i <= numSteps; i++) {
      const time = startTime + i * stepSize;
      const position = keplerianToPosition(elements, time);
      const velocity = keplerianToVelocity(elements, time);
      
      positions.push({
        time,
        position,
        velocity
      });
    }
    
    const period = calculateOrbitalPeriod(elements.a);
    const { periapsis, apoapsis } = calculatePeriapsisApoapsis(elements.a, elements.e);
    
    return {
      elements,
      positions,
      period,
      periapsis,
      apoapsis
    };
  }
}

/**
 * Calculate deflection distance for given delta-v and lead time
 */
export function calculateDeflectionDistance(
  deltaVms: number,
  leadTimeDays: number,
  currentVelocity: number
): number {
  // Simplified deflection calculation
  // In reality, this would depend on orbital mechanics and encounter geometry
  
  const leadTimeSeconds = leadTimeDays * 24 * 3600;
  const deflectionVelocity = deltaVms; // m/s
  
  // Approximate deflection distance
  // This is a simplified model - real deflection depends on encounter geometry
  const deflectionDistance = deflectionVelocity * leadTimeSeconds;
  
  return deflectionDistance / 1000; // convert to km
}

/**
 * Check if deflection is sufficient to avoid Earth
 */
export function isDeflectionSufficient(
  deflectionDistanceKm: number,
  missDistanceKm: number = 6400 // Earth radius
): boolean {
  return deflectionDistanceKm > missDistanceKm;
}

/**
 * Calculate mission success probability
 */
export function calculateMissionSuccess(
  deltaVms: number,
  leadTimeDays: number,
  asteroidSize: number,
  missionType: 'kinetic' | 'gravity' | 'nuclear'
): number {
  // Simplified success probability calculation
  const effectiveness = {
    kinetic: 0.8,
    gravity: 0.6,
    nuclear: 1.0
  };
  
  const timeFactor = Math.min(1, leadTimeDays / 365); // full year = 100%
  const deltaVFactor = Math.min(1, deltaVms / 5.0); // 5 m/s = 100%
  const sizeFactor = Math.min(1, 1000 / asteroidSize); // smaller = easier
  
  const baseSuccess = effectiveness[missionType] * timeFactor * deltaVFactor * sizeFactor;
  
  // Add some randomness for realism
  return Math.min(0.95, Math.max(0.05, baseSuccess + (Math.random() - 0.5) * 0.2));
}

/**
 * Convert NEO data to orbital elements
 */
export function neoDataToOrbitalElements(neoData: any): OrbitalElements | null {
  if (!neoData.orbital_data) return null;
  
  const orbital = neoData.orbital_data;
  
  try {
    return {
      a: parseFloat(orbital.semi_major_axis) * AU, // convert AU to meters
      e: parseFloat(orbital.eccentricity),
      i: parseFloat(orbital.inclination) * Math.PI / 180, // convert degrees to radians
      omega: parseFloat(orbital.perihelion_argument) * Math.PI / 180,
      Omega: parseFloat(orbital.ascending_node_longitude) * Math.PI / 180,
      M0: parseFloat(orbital.mean_anomaly) * Math.PI / 180,
      epochMs: new Date(orbital.epoch_osculation).getTime()
    };
  } catch (error) {
    console.error('Error converting NEO data to orbital elements:', error);
    return null;
  }
}

/**
 * Format orbital elements for display
 */
export function formatOrbitalElements(elements: OrbitalElements): Record<string, string> {
  return {
    'Semi-major axis': `${(elements.a / AU).toFixed(3)} AU`,
    'Eccentricity': elements.e.toFixed(6),
    'Inclination': `${(elements.i * 180 / Math.PI).toFixed(2)}°`,
    'Argument of periapsis': `${(elements.omega * 180 / Math.PI).toFixed(2)}°`,
    'Longitude of ascending node': `${(elements.Omega * 180 / Math.PI).toFixed(2)}°`,
    'Mean anomaly': `${(elements.M0 * 180 / Math.PI).toFixed(2)}°`,
    'Orbital period': `${(calculateOrbitalPeriod(elements.a) / (24 * 3600)).toFixed(1)} days`
  };
}
