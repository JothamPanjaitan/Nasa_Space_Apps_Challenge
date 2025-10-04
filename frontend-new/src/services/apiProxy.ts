// API Proxy Service - Frontend integration with backend proxy
// Handles NASA NeoWs and USGS data fetching

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * NASA NeoWs asteroid data structure
 */
export interface NeoWsAsteroid {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    close_approach_date_full: string;
    epoch_date_close_approach: number;
    relative_velocity: {
      kilometers_per_second: string;
      kilometers_per_hour: string;
      miles_per_hour: string;
    };
    miss_distance: {
      astronomical: string;
      lunar: string;
      kilometers: string;
      miles: string;
    };
    orbiting_body: string;
  }>;
  orbital_data: {
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

/**
 * USGS Earthquake GeoJSON feature
 */
export interface EarthquakeFeature {
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string;
}

export interface EarthquakeData {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
}

/**
 * Fetch asteroid data by ID from NASA NeoWs
 */
export async function fetchAsteroidById(asteroidId: string): Promise<NeoWsAsteroid> {
  const response = await fetch(`${API_BASE_URL}/api/neows/lookup/${encodeURIComponent(asteroidId)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch asteroid ${asteroidId}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Browse asteroids from NASA NeoWs
 */
export async function browseAsteroids(page: number = 0, size: number = 20): Promise<{
  links: any;
  page: {
    size: number;
    total_elements: number;
    total_pages: number;
    number: number;
  };
  near_earth_objects: NeoWsAsteroid[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/neows/browse?page=${page}&size=${size}`);
  
  if (!response.ok) {
    throw new Error(`Failed to browse asteroids: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get NEO feed by date range
 */
export async function fetchNeoFeed(startDate: string, endDate: string): Promise<{
  links: any;
  element_count: number;
  near_earth_objects: { [date: string]: NeoWsAsteroid[] };
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/neows/feed?start_date=${startDate}&end_date=${endDate}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch NEO feed: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Query USGS earthquakes near a location
 */
export async function fetchEarthquakes(params: {
  latitude: number;
  longitude: number;
  maxradiuskm: number;
  starttime: string;
  endtime: string;
  minmagnitude?: number;
  maxmagnitude?: number;
}): Promise<EarthquakeData> {
  const queryParams = new URLSearchParams();
  queryParams.append('latitude', params.latitude.toString());
  queryParams.append('longitude', params.longitude.toString());
  queryParams.append('maxradiuskm', params.maxradiuskm.toString());
  queryParams.append('starttime', params.starttime);
  queryParams.append('endtime', params.endtime);
  
  if (params.minmagnitude !== undefined) {
    queryParams.append('minmagnitude', params.minmagnitude.toString());
  }
  
  if (params.maxmagnitude !== undefined) {
    queryParams.append('maxmagnitude', params.maxmagnitude.toString());
  }
  
  const response = await fetch(`${API_BASE_URL}/api/usgs/earthquakes?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch earthquakes: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get elevation at a specific point
 */
export async function fetchElevation(latitude: number, longitude: number): Promise<{
  USGS_Elevation_Point_Query_Service: {
    Elevation_Query: {
      x: number;
      y: number;
      Data_Source: string;
      Elevation: number;
      Units: string;
    };
  };
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/usgs/elevation?latitude=${latitude}&longitude=${longitude}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch elevation: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get tsunami catalog metadata
 */
export async function fetchTsunamiCatalog(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/tsunami/catalog`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tsunami catalog: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Convert NeoWs orbital data to OrbitalElements format
 */
export function neoWsToOrbitalElements(asteroid: NeoWsAsteroid): {
  aAU: number;
  e: number;
  iDeg: number;
  omegaDeg: number;
  OmegaDeg: number;
  Mdeg: number;
  epochJD: number;
} {
  const od = asteroid.orbital_data;
  
  return {
    aAU: parseFloat(od.semi_major_axis),
    e: parseFloat(od.eccentricity),
    iDeg: parseFloat(od.inclination),
    omegaDeg: parseFloat(od.perihelion_argument),
    OmegaDeg: parseFloat(od.ascending_node_longitude),
    Mdeg: parseFloat(od.mean_anomaly),
    epochJD: parseFloat(od.epoch_osculation)
  };
}

/**
 * Get asteroid size estimate (average diameter in meters)
 */
export function getAsteroidSize(asteroid: NeoWsAsteroid): number {
  const { estimated_diameter_min, estimated_diameter_max } = asteroid.estimated_diameter.meters;
  return (estimated_diameter_min + estimated_diameter_max) / 2;
}

/**
 * Get closest approach data
 */
export function getClosestApproach(asteroid: NeoWsAsteroid) {
  if (!asteroid.close_approach_data || asteroid.close_approach_data.length === 0) {
    return null;
  }
  
  // Sort by date and get the closest one
  const sorted = [...asteroid.close_approach_data].sort(
    (a, b) => a.epoch_date_close_approach - b.epoch_date_close_approach
  );
  
  return sorted[0];
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<{
  status: string;
  timestamp: string;
  nasa_api_key: string;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('API proxy is not responding');
  }
  
  return await response.json();
}

export const ApiProxy = {
  fetchAsteroidById,
  browseAsteroids,
  fetchNeoFeed,
  fetchEarthquakes,
  fetchElevation,
  fetchTsunamiCatalog,
  neoWsToOrbitalElements,
  getAsteroidSize,
  getClosestApproach,
  checkApiHealth
};
