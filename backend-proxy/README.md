# Meteor Madness API Proxy

Backend proxy server for NASA NeoWs and USGS data integration. Handles API key management, caching, and rate limiting.

## Features

- **NASA NeoWs Integration**: Fetch asteroid data, orbital elements, and close approach information
- **USGS Earthquake Data**: Query historical seismic activity near impact sites
- **USGS Elevation Data**: Get terrain elevation for impact modeling
- **Caching**: 5-minute cache to reduce API calls and improve performance
- **CORS Enabled**: Ready for frontend integration

## Setup

### 1. Install Dependencies

```bash
cd backend-proxy
npm install
```

### 2. Configure NASA API Key (Optional)

Get a free API key from [NASA Open APIs](https://api.nasa.gov/):

```bash
# Create .env file
echo "NASA_API_KEY=your_key_here" > .env
```

Or use the default `DEMO_KEY` (limited to 30 requests/hour).

### 3. Start Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```

### NASA NeoWs

#### Lookup Asteroid by ID
```
GET /api/neows/lookup/:id
Example: /api/neows/lookup/2010PK9
```

#### Browse Asteroids
```
GET /api/neows/browse?page=0&size=20
```

#### NEO Feed (by date range)
```
GET /api/neows/feed?start_date=2024-01-01&end_date=2024-01-07
```

### USGS Earthquake Data

```
GET /api/usgs/earthquakes?latitude=35.0&longitude=-118.0&maxradiuskm=500&starttime=2020-01-01&endtime=2024-01-01&minmagnitude=4.5
```

Parameters:
- `latitude`: Center latitude
- `longitude`: Center longitude
- `maxradiuskm`: Search radius in km
- `starttime`: Start date (YYYY-MM-DD)
- `endtime`: End date (YYYY-MM-DD)
- `minmagnitude`: Minimum magnitude
- `maxmagnitude`: Maximum magnitude (optional)

### USGS Elevation

```
GET /api/usgs/elevation?latitude=35.0&longitude=-118.0
```

### Tsunami Catalog

```
GET /api/tsunami/catalog
```

Returns metadata about NOAA tsunami datasets.

### Cache Management

#### Get Cache Stats
```
GET /api/cache/stats
```

#### Clear Cache
```
POST /api/cache/clear
```

## Usage in Frontend

```javascript
// Fetch asteroid data
const response = await fetch('http://localhost:3001/api/neows/lookup/2010PK9');
const asteroid = await response.json();

// Get orbital elements
const orbitalData = asteroid.orbital_data;
const elements = {
  aAU: parseFloat(orbitalData.semi_major_axis),
  e: parseFloat(orbitalData.eccentricity),
  iDeg: parseFloat(orbitalData.inclination),
  omegaDeg: parseFloat(orbitalData.perihelion_argument),
  OmegaDeg: parseFloat(orbitalData.ascending_node_longitude),
  Mdeg: parseFloat(orbitalData.mean_anomaly),
  epochJD: parseFloat(orbitalData.epoch_osculation)
};

// Query earthquakes near impact site
const eqResponse = await fetch(
  'http://localhost:3001/api/usgs/earthquakes?' +
  'latitude=35.0&longitude=-118.0&maxradiuskm=500&' +
  'starttime=2020-01-01&endtime=2024-01-01&minmagnitude=4.5'
);
const earthquakes = await eqResponse.json();
```

## Data Sources

- **NASA NeoWs**: https://api.nasa.gov/
- **USGS Earthquake Catalog**: https://earthquake.usgs.gov/fdsnws/event/1/
- **USGS Elevation**: https://nationalmap.gov/epqs/
- **NOAA Tsunami Data**: https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/

## Environment Variables

- `NASA_API_KEY`: Your NASA API key (default: `DEMO_KEY`)
- `PORT`: Server port (default: `3001`)

## Notes

- The `DEMO_KEY` has a rate limit of 30 requests/hour
- Get a free API key for higher limits (1000 requests/hour)
- Cache is set to 5 minutes (300 seconds) by default
- All responses are cached to minimize API calls

## Troubleshooting

### CORS Errors
Make sure the frontend is configured to use `http://localhost:3001` as the API base URL.

### Rate Limit Errors
If using `DEMO_KEY`, you may hit rate limits. Get a free NASA API key to increase limits.

### Cache Issues
Clear the cache using `POST /api/cache/clear` if you need fresh data.
