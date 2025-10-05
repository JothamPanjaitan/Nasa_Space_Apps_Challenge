export interface OrbitalElements {
  a: number; // semi-major axis (m)
  e: number; // eccentricity
  i: number; // inclination (radians)
  omega: number; // argument of periapsis (radians)
  Omega: number; // longitude of ascending node (radians)
  M0: number; // mean anomaly at epoch (radians)
  epochMs: number; // epoch time in milliseconds
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Velocity3D {
  vx: number;
  vy: number;
  vz: number;
}

export interface StateVector {
  position: Position3D;
  velocity: Velocity3D;
  epochMs: number;
}

export interface OrbitPropagation {
  elements: OrbitalElements;
  positions: Array<{
    time: number;
    position: Position3D;
    velocity: Velocity3D;
  }>;
  period: number; // seconds
  periapsis: number; // m
  apoapsis: number; // m
}

export interface DeltaVManuever {
  id: string;
  time: number; // seconds from epoch
  deltaV: Velocity3D;
  magnitude: number; // m/s
  type: 'impulsive' | 'continuous';
  description: string;
}

export interface MissionProfile {
  id: string;
  name: string;
  target: OrbitalElements;
  maneuvers: DeltaVManuever[];
  launchWindow: {
    start: number;
    end: number;
  };
  duration: number; // days
  successProbability: number;
}

export interface CloseApproach {
  date: string;
  distance: number; // km
  velocity: number; // km/s
  orbitingBody: string;
  uncertainty: number; // km
}

export interface NEOOrbitData {
  id: string;
  name: string;
  orbitalElements: OrbitalElements;
  closeApproaches: CloseApproach[];
  isHazardous: boolean;
  isSentry: boolean;
  diameter: {
    min: number;
    max: number;
  };
  lastUpdated: number;
}

export interface PhysicsConstants {
  MU_SUN: number; // m^3/s^2
  MU_EARTH: number; // m^3/s^2
  EARTH_RADIUS: number; // m
  AU: number; // m (astronomical unit)
  G: number; // m^3/kg/s^2 (gravitational constant)
}

export interface KeplerSolver {
  solve(M: number, e: number, tolerance?: number): number;
}

export interface OrbitIntegrator {
  propagate(
    elements: OrbitalElements,
    startTime: number,
    endTime: number,
    stepSize: number
  ): OrbitPropagation;
}
