// NASA NEO API integration
const NASA_API_BASE = 'https://api.nasa.gov/neo/rest/v1';
const NASA_API_KEY = 'GLyBldPbrOkakjnxMbLd5nMmdMB3ys77eNDHnBSr'; // Replace with your actual API key

export class NasaApiService {
  static async getNearEarthObjects(startDate, endDate) {
    try {
      const response = await fetch(
        `${NASA_API_BASE}/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching NEO data:', error);
      // Return mock data for development
      return this.getMockNEOData();
    }
  }

  static async getAsteroidDetails(asteroidId) {
    try {
      const response = await fetch(
        `${NASA_API_BASE}/neo/${asteroidId}?api_key=${NASA_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching asteroid details:', error);
      return this.getMockAsteroidDetails(asteroidId);
    }
  }

  static getMockNEOData() {
    return {
      element_count: 1,
      near_earth_objects: {
        '2025-10-05': [
          {
            id: '2025-IMPCTOR',
            name: 'Impactor-2025',
            estimated_diameter: {
              meters: {
                estimated_diameter_min: 100,
                estimated_diameter_max: 200
              }
            },
            close_approach_data: [{
              close_approach_date: '2025-10-05',
              relative_velocity: {
                kilometers_per_second: '17.5'
              },
              miss_distance: {
                kilometers: '50000'
              }
            }],
            orbital_data: {
              orbit_id: '1',
              orbit_determination_date: '2025-01-01',
              first_observation_date: '2025-01-01',
              last_observation_date: '2025-01-01',
              data_arc_in_days: 0,
              observations_used: 0,
              orbit_uncertainty: '0',
              minimum_orbit_intersection: '0.015',
              jupiter_tisserand_invariant: '0',
              epoch_osculation: '2450000.5',
              eccentricity: '0.5',
              semi_major_axis: '1.2',
              inclination: '15.0',
              ascending_node_longitude: '0',
              orbital_period: '365',
              perihelion_distance: '0.8',
              perihelion_argument: '0',
              aphelion_distance: '1.6',
              perihelion_time: '2450000.5',
              mean_anomaly: '0',
              mean_motion: '1.0',
              equinox: 'J2000'
            }
          }
        ]
      }
    };
  }

  static getMockAsteroidDetails(asteroidId) {
    return {
      id: asteroidId,
      name: 'Impactor-2025',
      estimated_diameter: {
        meters: {
          estimated_diameter_min: 100,
          estimated_diameter_max: 200
        }
      },
      close_approach_data: [{
        close_approach_date: '2025-10-05',
        relative_velocity: {
          kilometers_per_second: '17.5'
        },
        miss_distance: {
          kilometers: '50000'
        }
      }]
    };
  }
}
