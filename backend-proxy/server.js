// Backend API Proxy for NASA NeoWs and USGS data
// Handles API key management and caching to avoid rate limits

import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Middleware
app.use(cors());
app.use(express.json());

// NASA API key from environment (use DEMO_KEY for development)
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

// Helper function for fetch (works in Node 18+)
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  return await response.json();
}

/**
 * NASA NeoWs: Lookup asteroid by ID or designation
 * GET /api/neows/lookup/:id
 */
app.get('/api/neows/lookup/:id', async (req, res) => {
  try {
    const asteroidId = req.params.id;
    const cacheKey = `neows:${asteroidId}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for asteroid ${asteroidId}`);
      return res.json(cached);
    }
    
    // Fetch from NASA API
    const url = `https://api.nasa.gov/neo/rest/v1/neo/${encodeURIComponent(asteroidId)}?api_key=${NASA_API_KEY}`;
    console.log(`Fetching asteroid ${asteroidId} from NASA NeoWs...`);
    
    const data = await fetchJSON(url);
    
    // Cache the result
    cache.set(cacheKey, data);
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching NeoWs data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch asteroid data',
      message: error.message 
    });
  }
});

/**
 * NASA NeoWs: Browse asteroids
 * GET /api/neows/browse?page=0&size=20
 */
app.get('/api/neows/browse', async (req, res) => {
  try {
    const page = req.query.page || 0;
    const size = req.query.size || 20;
    const cacheKey = `neows:browse:${page}:${size}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const url = `https://api.nasa.gov/neo/rest/v1/neo/browse?page=${page}&size=${size}&api_key=${NASA_API_KEY}`;
    console.log(`Browsing asteroids (page ${page})...`);
    
    const data = await fetchJSON(url);
    cache.set(cacheKey, data);
    
    return res.json(data);
  } catch (error) {
    console.error('Error browsing asteroids:', error);
    return res.status(500).json({ 
      error: 'Failed to browse asteroids',
      message: error.message 
    });
  }
});

/**
 * NASA NeoWs: Feed (asteroids by date range)
 * GET /api/neows/feed?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
app.get('/api/neows/feed', async (req, res) => {
  try {
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    
    const cacheKey = `neows:feed:${startDate}:${endDate}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`;
    console.log(`Fetching NEO feed from ${startDate} to ${endDate}...`);
    
    const data = await fetchJSON(url);
    cache.set(cacheKey, data);
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching NEO feed:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch NEO feed',
      message: error.message 
    });
  }
});

/**
 * USGS Earthquake API: Query earthquakes
 * GET /api/usgs/earthquakes?latitude=...&longitude=...&maxradiuskm=...&starttime=...&endtime=...&minmagnitude=...
 */
app.get('/api/usgs/earthquakes', async (req, res) => {
  try {
    const params = new URLSearchParams();
    
    // Add format
    params.append('format', 'geojson');
    
    // Add query parameters
    if (req.query.latitude) params.append('latitude', req.query.latitude);
    if (req.query.longitude) params.append('longitude', req.query.longitude);
    if (req.query.maxradiuskm) params.append('maxradiuskm', req.query.maxradiuskm);
    if (req.query.starttime) params.append('starttime', req.query.starttime);
    if (req.query.endtime) params.append('endtime', req.query.endtime);
    if (req.query.minmagnitude) params.append('minmagnitude', req.query.minmagnitude);
    if (req.query.maxmagnitude) params.append('maxmagnitude', req.query.maxmagnitude);
    
    const queryString = params.toString();
    const cacheKey = `usgs:eq:${queryString}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for USGS earthquake query');
      return res.json(cached);
    }
    
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${queryString}`;
    console.log(`Fetching USGS earthquakes: ${url}`);
    
    const data = await fetchJSON(url);
    cache.set(cacheKey, data);
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching USGS earthquake data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch earthquake data',
      message: error.message 
    });
  }
});

/**
 * USGS Elevation API: Get elevation at a point
 * GET /api/usgs/elevation?latitude=...&longitude=...
 */
app.get('/api/usgs/elevation', async (req, res) => {
  try {
    const lat = req.query.latitude;
    const lng = req.query.longitude;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    
    const cacheKey = `usgs:elev:${lat}:${lng}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const url = `https://nationalmap.gov/epqs/pqs.php?x=${lng}&y=${lat}&units=Meters&output=json`;
    console.log(`Fetching elevation for (${lat}, ${lng})...`);
    
    const data = await fetchJSON(url);
    cache.set(cacheKey, data);
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching elevation data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch elevation data',
      message: error.message 
    });
  }
});

/**
 * NOAA Tsunami Catalog (placeholder)
 * GET /api/tsunami/catalog
 */
app.get('/api/tsunami/catalog', async (req, res) => {
  try {
    // For now, return metadata about tsunami datasets
    // In production, integrate with NOAA NCEI tsunami database
    return res.json({
      info: 'NOAA NCEI Tsunami Database',
      note: 'For production, integrate with https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-search',
      datasets: [
        {
          name: 'Global Historical Tsunami Database',
          url: 'https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-search',
          description: 'Historical tsunami events worldwide'
        },
        {
          name: 'ETOPO Bathymetry',
          url: 'https://www.ncei.noaa.gov/products/etopo-global-relief-model',
          description: 'Global relief model for tsunami modeling'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching tsunami catalog:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch tsunami catalog',
      message: error.message 
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    nasa_api_key: NASA_API_KEY === 'DEMO_KEY' ? 'DEMO_KEY' : 'configured'
  });
});

/**
 * Cache stats endpoint
 */
app.get('/api/cache/stats', (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
});

/**
 * Clear cache endpoint
 */
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({ message: 'Cache cleared' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Proxy server running on port ${PORT}`);
  console.log(`📡 NASA API Key: ${NASA_API_KEY === 'DEMO_KEY' ? 'DEMO_KEY (limited rate)' : 'Custom key configured'}`);
  console.log(`💾 Cache TTL: 300 seconds`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  GET  /api/neows/lookup/:id`);
  console.log(`  GET  /api/neows/browse`);
  console.log(`  GET  /api/neows/feed`);
  console.log(`  GET  /api/usgs/earthquakes`);
  console.log(`  GET  /api/usgs/elevation`);
  console.log(`  GET  /api/tsunami/catalog`);
  console.log(`  GET  /api/cache/stats`);
  console.log(`  POST /api/cache/clear`);
});

export default app;
