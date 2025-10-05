export type Mode = 'simulator' | 'game';

export interface IndirectImpact {
  type: 'tsunami' | 'seismic' | 'landslide' | 'wildfire';
  radiusKm: number;
  intensity?: number; // Mw, runup(m), MMI, etc.
  populationAtRisk?: number;
  infrastructureAtRisk?: string[];
  description?: string;
}

export interface ImpactData {
  id: string;
  name?: string;
  raw?: any;
  epochMs?: number;
  lat?: number;
  lng?: number;
  velocityKms: number;
  massKg?: number;
  diameterM?: number;
  densityKgM3?: number;
  kineticEnergyJ?: number;
  tntEquivalentTons?: number;
  craterDiameterKm?: number;
  directImpactRadiusKm?: number;
  seismicMagnitude?: number;
  populationAtRisk?: number;
  infrastructureAtRisk?: string[];
  indirectImpacts?: IndirectImpact[];
  mitigationApplied?: string[];
  
  // Additional fields for compatibility with existing system
  energy?: number;
  tntEquivalent?: number;
  impactLocation?: { lat: number; lng: number };
  collisionPredicted?: boolean;
  craterDepth?: number;
  blastRadius?: number;
  heavyDamageRadius?: number;
  moderateDamageRadius?: number;
  thermalRadius?: number;
  seismicRadius?: number;
  seismicIntensity?: string;
  ejectaVolume?: number;
  fireballRadius?: number;
  tsunamiRisk?: number;
  tsunamiRadius?: number;
  tsunamiHeight?: number;
  tsunamiArrivalTimes?: number[];
  tsunamiData?: any; // TsunamiSimulationResult from tsunamiSimulation.ts
  earlyWarningTime?: number;
  recommendedActions?: string[];
}

export interface NEOData {
  id: string;
  name: string;
  estimated_diameter?: {
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data?: Array<{
    close_approach_date: string;
    close_approach_date_full: string;
    relative_velocity: {
      kilometers_per_second: string;
    };
    miss_distance: {
      kilometers: string;
    };
    orbiting_body: string;
  }>;
  orbital_data?: {
    orbit_id: string;
    orbit_determination_date: string;
    first_observation_date: string;
    last_observation_date: string;
    data_arc_in_days: number;
    observations_used: number;
    orbit_uncertainty: string;
    minimum_orbit_intersection: string;
    jupiter_tisserand_invariant: string;
    epoch_osculation: string;
    eccentricity: string;
    semi_major_axis: string;
    inclination: string;
    ascending_node_longitude: string;
    orbital_period: string;
    perihelion_distance: string;
    perihelion_argument: string;
    aphelion_distance: string;
    perihelion_time: string;
    mean_anomaly: string;
    mean_motion: string;
    equinox: string;
    orbit_class: {
      orbit_class_type: string;
      orbit_class_description: string;
      orbit_class_range: string;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  is_sentry_object: boolean;
}

export interface MitigationStrategy {
  id: string;
  name: string;
  type: 'kinetic' | 'gravity' | 'nuclear';
  effectiveness: number;
  leadTimeRequired: number; // days
  cost: 'low' | 'medium' | 'high';
  description: string;
  pros: string[];
  cons: string[];
}

export interface MitigationResult {
  strategy: MitigationStrategy;
  deltaV: number; // m/s
  leadTime: number; // days
  success: boolean;
  deflectionDistance: number; // km
  newVelocity?: number;
  newOrbit?: any;
  reason: string;
}

export interface ImpactScenario {
  id: string;
  name: string;
  neo: NEOData;
  impactData: ImpactData;
  mitigationResults?: MitigationResult[];
  timestamp: number;
  userDefined?: boolean;
}

export interface SimulationParameters {
  asteroidSize: number; // meters
  velocity: number; // km/s
  density: number; // kg/m^3
  impactAngle: number; // degrees from vertical
  targetDensity: number; // kg/m^3 (target material)
  seismicEfficiency: number; // fraction of energy converted to seismic waves
}

export interface PhysicsConstants {
  J_PER_TON_TNT: number;
  DEFAULT_DENSITY: number;
  EARTH_RADIUS: number;
  GRAVITY: number;
  ATMOSPHERE_SCALE_HEIGHT: number;
}

// Re-export orbital types for convenience
export type { OrbitalElements, Position3D, Velocity3D } from './orbit';
