// Simulation engine for asteroid impact calculations
export class SimulationEngine {
  // Physical constants
  static get ASTEROID_DENSITY() { return 3000; } // kg/m³ (average stony asteroid)
  static get EARTH_RADIUS() { return 6371000; } // meters
  static get GRAVITY() { return 9.81; } // m/s²

  // Calculate kinetic energy from asteroid parameters
  static calculateKineticEnergy(diameter, velocity, density = this.ASTEROID_DENSITY) {
    const radius = diameter / 2; // meters
    const volume = (4/3) * Math.PI * Math.pow(radius, 3); // m³
    const mass = volume * density; // kg
    const velocityMs = velocity * 1000; // Convert km/s to m/s
    
    return 0.5 * mass * Math.pow(velocityMs, 2); // Joules
  }

  // Convert energy to TNT equivalent
  static energyToTNT(energyJoules) {
    const TNT_ENERGY = 4.184e9; // Joules per ton of TNT
    return energyJoules / TNT_ENERGY; // tons of TNT
  }

  // Calculate crater diameter using scaling laws
  static calculateCraterDiameter(energyJoules, impactAngle = 45) {
    // Using Schmidt-Holsapple scaling
    const energyMT = this.energyToTNT(energyJoules) / 1e6; // Convert to megatons
    const angleFactor = Math.sin(impactAngle * Math.PI / 180);
    
    // Simplified scaling relationship
    const craterDiameter = 1.2 * Math.pow(energyMT, 0.294) * angleFactor; // km
    return Math.max(0.1, craterDiameter); // Minimum 100m crater
  }

  // Calculate blast radius (overpressure effects)
  static calculateBlastRadius(energyJoules) {
    const energyMT = this.energyToTNT(energyJoules) / 1e6; // megatons
    // Using nuclear blast scaling
    const blastRadius = 1.5 * Math.pow(energyMT, 0.33); // km
    return Math.max(0.1, blastRadius);
  }

  // Calculate thermal radiation radius
  static calculateThermalRadius(energyJoules) {
    const energyMT = this.energyToTNT(energyJoules) / 1e6; // megatons
    const thermalRadius = 2.0 * Math.pow(energyMT, 0.4); // km
    return Math.max(0.1, thermalRadius);
  }

  // Calculate seismic radius
  static calculateSeismicRadius(energyJoules) {
    const energyMT = this.energyToTNT(energyJoules) / 1e6; // megatons
    const seismicRadius = 3.0 * Math.pow(energyMT, 0.33); // km
    return Math.max(0.1, seismicRadius);
  }

  // Calculate tsunami parameters for ocean impact
  static calculateTsunamiParameters(energyJoules, oceanDepth = 4000) {
    const energyMT = this.energyToTNT(energyJoules) / 1e6; // megatons
    
    // Simplified tsunami calculation
    const waveHeight = Math.min(50, Math.sqrt(energyMT) * 5); // meters, max 50m
    const propagationSpeed = Math.sqrt(9.81 * oceanDepth); // m/s
    const affectedRadius = Math.min(1000, Math.sqrt(energyMT) * 200); // km
    
    return {
      waveHeight: Math.max(1, waveHeight),
      propagationSpeed,
      affectedRadius: Math.max(10, affectedRadius),
      inundationDistance: Math.max(100, waveHeight * 100) // meters
    };
  }

  // Calculate orbital trajectory using Keplerian elements
  static calculateOrbitalTrajectory(orbitalElements, timeSteps = 100) {
    const { a, e, i, Ω, ω, M } = orbitalElements; // semi-major axis, eccentricity, inclination, etc.
    
    const trajectory = [];
    const timeStep = 2 * Math.PI / timeSteps;
    
    for (let step = 0; step < timeSteps; step++) {
      const meanAnomaly = M + step * timeStep;
      const eccentricAnomaly = this.solveKeplerEquation(meanAnomaly, e);
      const trueAnomaly = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(eccentricAnomaly / 2));
      
      const r = a * (1 - e * Math.cos(eccentricAnomaly));
      const x = r * Math.cos(trueAnomaly);
      const y = r * Math.sin(trueAnomaly);
      
      trajectory.push({ x, y, z: 0, time: step * timeStep });
    }
    
    return trajectory;
  }

  // Solve Kepler's equation using Newton's method
  static solveKeplerEquation(meanAnomaly, eccentricity, tolerance = 1e-6) {
    let eccentricAnomaly = meanAnomaly;
    let delta = 1;
    
    while (Math.abs(delta) > tolerance) {
      delta = (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) / 
              (1 - eccentricity * Math.cos(eccentricAnomaly));
      eccentricAnomaly -= delta;
    }
    
    return eccentricAnomaly;
  }

  // Calculate deflection parameters
  static calculateDeflectionParameters(asteroidMass, velocityChange, timeToImpact) {
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

  // Calculate impact probability based on orbital uncertainty
  static calculateImpactProbability(missDistance, uncertainty) {
    if (missDistance <= 0) return 1.0; // Direct hit
    
    const sigma = uncertainty || 1000; // km, default uncertainty
    const probability = Math.exp(-Math.pow(missDistance / sigma, 2) / 2);
    
    return Math.max(0, Math.min(1, probability));
  }

  // Calculate environmental effects
  static calculateEnvironmentalEffects(energyJoules, impactLocation) {
    const energyMT = this.energyToTNT(energyJoules) / 1e6; // megatons
    
    // Atmospheric effects
    const dustInjection = energyMT * 0.1; // megatons of dust
    const sootInjection = energyMT * 0.05; // megatons of soot
    
    // Climate effects (simplified)
    const temperatureDrop = Math.min(10, energyMT * 0.1); // °C
    const sunlightReduction = Math.min(50, energyMT * 2); // %
    
    // Fire effects
    const fireRadius = this.calculateThermalRadius(energyJoules) * 1.5; // km
    
    return {
      dustInjection,
      sootInjection,
      temperatureDrop,
      sunlightReduction,
      fireRadius,
      climateImpact: energyMT > 100 ? 'severe' : energyMT > 10 ? 'moderate' : 'minor'
    };
  }

  // Calculate economic impact
  static calculateEconomicImpact(energyJoules, impactLocation, populationDensity) {
    const energyMT = this.energyToTNT(energyJoules) / 1e6; // megatons
    const blastRadius = this.calculateBlastRadius(energyJoules);
    
    // Estimate affected population
    const affectedArea = Math.PI * Math.pow(blastRadius, 2); // km²
    const affectedPopulation = affectedArea * (populationDensity || 100); // people/km²
    
    // Economic losses (simplified)
    const infrastructureLoss = energyMT * 1e9; // USD
    const gdpLoss = affectedPopulation * 50000; // USD per person
    const totalLoss = infrastructureLoss + gdpLoss;
    
    return {
      affectedPopulation: Math.round(affectedPopulation),
      infrastructureLoss,
      gdpLoss,
      totalLoss,
      recoveryTime: Math.min(50, energyMT * 0.5) // years
    };
  }
}
