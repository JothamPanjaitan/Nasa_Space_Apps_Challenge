// Hopkinson-Cranz Overpressure Calculations
// Based on empirical blast wave scaling laws and nuclear weapons effects data
// References: Glasstone & Dolan (1977), Baker et al. (1983)

/**
 * Overpressure data point
 */
export interface OverpressureData {
  radiusM: number;
  overpressurePa: number;
  overpressurePsi: number;
  dynamicPressurePa: number;
  description: string;
  effects: string[];
}

/**
 * Complete overpressure profile
 */
export interface OverpressureProfile {
  energyTNT: number; // tons TNT
  scaledDistances: number[];
  overpressures: OverpressureData[];
  criticalRadii: {
    R_100psi_m: number;  // Total destruction
    R_20psi_m: number;   // Severe damage
    R_5psi_m: number;    // Moderate damage
    R_1psi_m: number;    // Light damage
    R_0_5psi_m: number;  // Window breakage
  };
}

/**
 * Hopkinson-Cranz scaled distance
 * Z = R / W^(1/3)
 * where R is distance (m) and W is yield (kg TNT)
 */
function scaledDistance(distanceM: number, yieldKgTNT: number): number {
  return distanceM / Math.pow(yieldKgTNT, 1/3);
}

/**
 * Inverse: get distance from scaled distance
 */
function distanceFromScaled(Z: number, yieldKgTNT: number): number {
  return Z * Math.pow(yieldKgTNT, 1/3);
}

/**
 * Empirical overpressure curve (Kingery-Bulmash equations)
 * Returns overpressure in Pa for a given scaled distance Z
 * 
 * Based on empirical fits to experimental data
 * Valid for Z from ~0.1 to ~100 m/kg^(1/3)
 */
function overpressureFromScaledDistance(Z: number): number {
  // Kingery-Bulmash approximation (simplified)
  // Full implementation would use piecewise polynomial fits
  
  if (Z < 0.1) Z = 0.1; // Prevent extreme values
  
  // Empirical fit coefficients (simplified version)
  // P_s / P_0 = overpressure ratio
  let logZ = Math.log10(Z);
  let logPs;
  
  if (Z < 1.0) {
    // Close range: very high overpressure
    logPs = 3.2 - 1.5 * logZ;
  } else if (Z < 10.0) {
    // Medium range
    logPs = 2.0 - 1.2 * logZ;
  } else {
    // Far range
    logPs = 1.5 - 1.0 * logZ;
  }
  
  const overpressureRatio = Math.pow(10, logPs);
  const atmosphericPressure = 101325; // Pa
  const overpressurePa = overpressureRatio * atmosphericPressure;
  
  return Math.max(0, overpressurePa);
}

/**
 * Dynamic pressure (wind loading)
 * Q = 2.5 * P_s^2 / (7 * P_0 + P_s)
 */
function dynamicPressure(overpressurePa: number): number {
  const P0 = 101325; // atmospheric pressure
  const Ps = overpressurePa;
  return (2.5 * Ps * Ps) / (7 * P0 + Ps);
}

/**
 * Get damage description for overpressure level
 */
function getDamageDescription(overpressurePsi: number): { description: string; effects: string[] } {
  if (overpressurePsi >= 100) {
    return {
      description: 'Total destruction',
      effects: [
        'Complete destruction of all structures',
        'Crater formation',
        'Ground shock damage',
        '100% fatality rate'
      ]
    };
  } else if (overpressurePsi >= 20) {
    return {
      description: 'Severe structural damage',
      effects: [
        'Heavily built concrete buildings severely damaged',
        'Severe damage to steel-frame buildings',
        'Multistory wall-bearing buildings collapse',
        'High fatality rate (>50%)'
      ]
    };
  } else if (overpressurePsi >= 10) {
    return {
      description: 'Severe damage',
      effects: [
        'Reinforced concrete buildings severely damaged',
        'Most buildings collapse',
        'Severe injuries common',
        'Moderate to high fatality rate'
      ]
    };
  } else if (overpressurePsi >= 5) {
    return {
      description: 'Moderate to severe damage',
      effects: [
        'Most buildings severely damaged',
        'Wood frame buildings destroyed',
        'Brick buildings collapse',
        'Serious injuries common'
      ]
    };
  } else if (overpressurePsi >= 3) {
    return {
      description: 'Moderate damage',
      effects: [
        'Residential structures collapse',
        'Serious damage to industrial buildings',
        'Injuries from flying debris',
        'Some fatalities'
      ]
    };
  } else if (overpressurePsi >= 1) {
    return {
      description: 'Light to moderate damage',
      effects: [
        'Window frames distorted',
        'Doors blown in',
        'Roof damage',
        'Minor injuries from glass'
      ]
    };
  } else if (overpressurePsi >= 0.5) {
    return {
      description: 'Light damage',
      effects: [
        'Window glass shattered',
        'Minor structural damage',
        'Injuries from flying glass possible'
      ]
    };
  } else {
    return {
      description: 'Minimal damage',
      effects: [
        'Some window breakage',
        'Minor cosmetic damage'
      ]
    };
  }
}

/**
 * Calculate complete overpressure profile
 */
export function calculateOverpressureProfile(energyJoules: number): OverpressureProfile {
  // Convert to tons TNT (1 ton TNT = 4.184e9 J)
  const energyTNT = energyJoules / 4.184e9;
  const yieldKgTNT = energyTNT * 1000;
  
  // Define scaled distances to sample
  const scaledDistances = [
    0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 
    1.5, 2.0, 3.0, 5.0, 7.0, 10.0,
    15.0, 20.0, 30.0, 50.0, 70.0, 100.0
  ];
  
  // Calculate overpressure at each scaled distance
  const overpressures: OverpressureData[] = scaledDistances.map(Z => {
    const radiusM = distanceFromScaled(Z, yieldKgTNT);
    const overpressurePa = overpressureFromScaledDistance(Z);
    const overpressurePsi = overpressurePa / 6894.76; // Pa to psi
    const dynamicPressurePa = dynamicPressure(overpressurePa);
    const damage = getDamageDescription(overpressurePsi);
    
    return {
      radiusM,
      overpressurePa,
      overpressurePsi,
      dynamicPressurePa,
      description: damage.description,
      effects: damage.effects
    };
  });
  
  // Calculate critical radii for specific overpressure levels
  const findRadiusForPressure = (targetPsi: number): number => {
    // Binary search for scaled distance that gives target pressure
    let Zmin = 0.1, Zmax = 100.0;
    for (let i = 0; i < 50; i++) {
      const Zmid = (Zmin + Zmax) / 2;
      const P = overpressureFromScaledDistance(Zmid) / 6894.76;
      if (Math.abs(P - targetPsi) < 0.01) {
        return distanceFromScaled(Zmid, yieldKgTNT);
      }
      if (P > targetPsi) {
        Zmin = Zmid;
      } else {
        Zmax = Zmid;
      }
    }
    return distanceFromScaled((Zmin + Zmax) / 2, yieldKgTNT);
  };
  
  const criticalRadii = {
    R_100psi_m: findRadiusForPressure(100),
    R_20psi_m: findRadiusForPressure(20),
    R_5psi_m: findRadiusForPressure(5),
    R_1psi_m: findRadiusForPressure(1),
    R_0_5psi_m: findRadiusForPressure(0.5)
  };
  
  return {
    energyTNT,
    scaledDistances,
    overpressures,
    criticalRadii
  };
}

/**
 * Get overpressure at specific distance
 */
export function getOverpressureAtDistance(energyJoules: number, distanceM: number): OverpressureData {
  const energyTNT = energyJoules / 4.184e9;
  const yieldKgTNT = energyTNT * 1000;
  
  const Z = scaledDistance(distanceM, yieldKgTNT);
  const overpressurePa = overpressureFromScaledDistance(Z);
  const overpressurePsi = overpressurePa / 6894.76;
  const dynamicPressurePa = dynamicPressure(overpressurePa);
  const damage = getDamageDescription(overpressurePsi);
  
  return {
    radiusM: distanceM,
    overpressurePa,
    overpressurePsi,
    dynamicPressurePa,
    description: damage.description,
    effects: damage.effects
  };
}

/**
 * Calculate thermal radiation effects
 * Based on Stefan-Boltzmann law and fireball scaling
 */
export function calculateThermalEffects(energyJoules: number) {
  const energyMT = energyJoules / (4.184e15); // Convert to megatons
  
  // Fireball radius (empirical scaling)
  const fireballRadiusM = 90 * Math.pow(energyMT, 0.4) * 1000; // meters
  
  // Thermal radiation ranges (simplified)
  const thermalFlux = {
    // cal/cm² thresholds
    third_degree_burns: 10,  // 3rd degree burns
    second_degree_burns: 5,  // 2nd degree burns
    ignition_threshold: 15   // Ignition of combustibles
  };
  
  // Calculate radii (simplified inverse square law with atmospheric absorption)
  const calcThermalRadius = (threshold: number) => {
    // Q = Y * η / (4π * R²) * exp(-k*R)
    // Simplified: R ≈ sqrt(Y * η / (4π * Q))
    const eta = 0.35; // Thermal efficiency
    const totalThermalEnergy = energyJoules * eta;
    const radiusM = Math.sqrt(totalThermalEnergy / (4 * Math.PI * threshold * 4.184e4));
    return Math.min(radiusM, 100000); // Cap at 100km
  };
  
  return {
    fireballRadiusM,
    thirdDegreeBurnsRadiusM: calcThermalRadius(thermalFlux.third_degree_burns),
    secondDegreeBurnsRadiusM: calcThermalRadius(thermalFlux.second_degree_burns),
    ignitionRadiusM: calcThermalRadius(thermalFlux.ignition_threshold)
  };
}

export const OverpressureCalculator = {
  calculateOverpressureProfile,
  getOverpressureAtDistance,
  calculateThermalEffects,
  scaledDistance,
  distanceFromScaled
};
