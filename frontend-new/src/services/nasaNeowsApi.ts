// NASA NeoWs API Integration Service
// Provides live asteroid data from NASA's Near-Earth Object Web Service

export interface NASAAsteroid {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    relative_velocity: {
      kilometers_per_second: string;
      kilometers_per_hour: string;
    };
    miss_distance: {
      astronomical: string;
      lunar: string;
      kilometers: string;
    };
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
  };
}

export interface ProcessedAsteroid {
  id: string;
  name: string;
  diameterKm: number;
  velocityKmS: number;
  densityKgM3: number;
  approachDate: string;
  isHazardous: boolean;
  orbitalElements: {
    aAU: number;
    e: number;
    iDeg: number;
    raanDeg: number;
    argPeriDeg: number;
    meanAnomalyDeg: number;
  };
  missDistanceKm: number;
  absoluteMagnitude: number;
}

class NASANeowsService {
  private apiKey: string;
  private baseUrl: string = 'https://api.nasa.gov/neo/rest/v1';

  constructor(apiKey?: string) {
    // Use environment variable or provided key, fallback to DEMO_KEY
    this.apiKey = apiKey || process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY';
  }

  /**
   * Get asteroids approaching Earth in a date range
   */
  async getAsteroidFeed(startDate?: string, endDate?: string): Promise<NASAAsteroid[]> {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    const url = `${this.baseUrl}/feed?start_date=${start}&end_date=${end}&api_key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const asteroids: NASAAsteroid[] = [];

      // Flatten the date-keyed object
      Object.values(data.near_earth_objects).forEach((dateAsteroids: any) => {
        asteroids.push(...dateAsteroids);
      });

      return asteroids;
    } catch (error) {
      console.error('Error fetching NASA asteroid feed:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific asteroid
   */
  async getAsteroidDetails(asteroidId: string): Promise<NASAAsteroid> {
    const url = `${this.baseUrl}/neo/${asteroidId}?api_key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching asteroid details:', error);
      throw error;
    }
  }

  /**
   * Get potentially hazardous asteroids
   */
  async getHazardousAsteroids(days: number = 7): Promise<NASAAsteroid[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const asteroids = await this.getAsteroidFeed(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    return asteroids.filter(a => a.is_potentially_hazardous_asteroid);
  }

  /**
   * Process NASA asteroid data into simulation format
   */
  processAsteroid(asteroid: NASAAsteroid): ProcessedAsteroid {
    // Calculate average diameter
    const diameterMin = asteroid.estimated_diameter.kilometers.estimated_diameter_min;
    const diameterMax = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
    const diameterKm = (diameterMin + diameterMax) / 2;

    // Get velocity from first close approach
    const firstApproach = asteroid.close_approach_data[0];
    const velocityKmS = parseFloat(firstApproach.relative_velocity.kilometers_per_second);
    const missDistanceKm = parseFloat(firstApproach.miss_distance.kilometers);

    // Estimate density based on asteroid type (simplified)
    // C-type (carbonaceous): ~1200 kg/m³
    // S-type (silicaceous): ~2600 kg/m³
    // M-type (metallic): ~5300 kg/m³
    // Default to S-type
    const densityKgM3 = 2600;

    // Extract orbital elements if available
    let orbitalElements = {
      aAU: 1.5,
      e: 0.1,
      iDeg: 0,
      raanDeg: 0,
      argPeriDeg: 0,
      meanAnomalyDeg: 0,
    };

    if (asteroid.orbital_data) {
      const od = asteroid.orbital_data;
      orbitalElements = {
        aAU: parseFloat(od.semi_major_axis),
        e: parseFloat(od.eccentricity),
        iDeg: parseFloat(od.inclination),
        raanDeg: parseFloat(od.ascending_node_longitude),
        argPeriDeg: parseFloat(od.perihelion_argument),
        meanAnomalyDeg: parseFloat(od.mean_anomaly),
      };
    }

    return {
      id: asteroid.id,
      name: asteroid.name,
      diameterKm,
      velocityKmS,
      densityKgM3,
      approachDate: firstApproach.close_approach_date,
      isHazardous: asteroid.is_potentially_hazardous_asteroid,
      orbitalElements,
      missDistanceKm,
      absoluteMagnitude: asteroid.absolute_magnitude_h,
    };
  }

  /**
   * Get processed asteroids ready for simulation
   */
  async getProcessedAsteroids(limit: number = 10): Promise<ProcessedAsteroid[]> {
    const asteroids = await this.getAsteroidFeed();
    return asteroids.slice(0, limit).map(a => this.processAsteroid(a));
  }
}

// Export singleton instance
export const nasaNeowsService = new NASANeowsService();
export default NASANeowsService;
