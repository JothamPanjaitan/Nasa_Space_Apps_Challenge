const express = require('express');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const NASA_API_KEY = process.env.NASA_API_KEY;

if (!NASA_API_KEY) {
  console.warn('Warning: NASA_API_KEY not found in environment variables');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend-new/build')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 6, // limit each IP to 6 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Cache setup
const cache = new NodeCache({ stdTTL: 120 }); // 2 minutes default TTL

// Helper function for cached responses
function cached(key, ttl = 120) {
  return async (res, fn) => {
    const hit = cache.get(key);
    if (hit) {
      console.log(`Cache hit for ${key}`);
      return res.json(hit);
    }
    try {
      const json = await fn();
      cache.set(key, json, ttl);
      console.log(`Cache set for ${key}`);
      res.json(json);
    } catch (error) {
      console.error(`Error fetching data for ${key}:`, error.message);
      res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
  };
}

// NASA NeoWs API endpoints
app.get('/api/neo/browse', async (req, res) => {
  const cacheKey = 'neo-browse';
  return cached(cacheKey, 180)(res, async () => {
    if (!NASA_API_KEY) {
      throw new Error('NASA API key not configured');
    }
    const url = `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${NASA_API_KEY}`;
    console.log('Fetching NEO browse data from NASA...');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  });
});

app.get('/api/neo/lookup/:id', async (req, res) => {
  const cacheKey = `neo-${req.params.id}`;
  return cached(cacheKey, 300)(res, async () => {
    if (!NASA_API_KEY) {
      throw new Error('NASA API key not configured');
    }
    const url = `https://api.nasa.gov/neo/rest/v1/neo/${encodeURIComponent(req.params.id)}?api_key=${NASA_API_KEY}`;
    console.log(`Fetching NEO data for ID: ${req.params.id}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  });
});

// JPL SBDB Close-Approach Data (CAD)
app.get('/api/cad', async (req, res) => {
  const params = new URLSearchParams({
    dist: req.query.dist || '',
    'dist-max': req.query['dist-max'] || '0.05',
    nea: '1',
    sort: 'date',
    'date-min': req.query['date-min'] || '',
    'date-max': req.query['date-max'] || '',
    h: req.query.h || '',
    des: req.query.des || '',
    limit: req.query.limit || '50',
    fullname: 'true',
    json: 'true'
  });
  
  const cacheKey = `cad:${params.toString()}`;
  return cached(cacheKey, 300)(res, async () => {
    const url = `https://ssd-api.jpl.nasa.gov/cad.api?${params.toString()}`;
    console.log('Fetching CAD data from JPL...');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`JPL API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  });
});

// USGS ComCat passthrough (GeoJSON)
app.get('/api/usgs', async (req, res) => {
  const base = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  const params = new URLSearchParams({ 
    format: 'geojson', 
    ...Object.fromEntries(
      Object.entries(req.query).map(([k, v]) => [k, String(v)])
    ) 
  });
  
  const cacheKey = `usgs:${params.toString()}`;
  return cached(cacheKey, 60)(res, async () => {
    const url = `${base}?${params}`;
    console.log('Fetching USGS data...');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  });
});

// NOAA Tsunami API (if available)
app.get('/api/noaa/tsunami', async (req, res) => {
  const cacheKey = `noaa-tsunami:${JSON.stringify(req.query)}`;
  return cached(cacheKey, 300)(res, async () => {
    // Placeholder for NOAA tsunami data
    // In a real implementation, you would integrate with NOAA's tsunami APIs
    return {
      message: 'NOAA tsunami data integration placeholder',
      timestamp: new Date().toISOString()
    };
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend-new/build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MeteorBusUK Backend Proxy running on port ${PORT}`);
  console.log(`📡 NASA API Key configured: ${NASA_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🗄️  Cache initialized with ${cache.keys().length} entries`);
  console.log(`🌐 CORS enabled for cross-origin requests`);
});

module.exports = app;