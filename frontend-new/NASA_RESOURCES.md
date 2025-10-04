# NASA Space Apps Challenge - MeteorMadness Resources

## Overview
This document outlines the NASA and USGS data sources, APIs, and reference materials used in the MeteorMadness asteroid impact simulation application for the 2025 NASA Space Apps Challenge.

## NASA Data Sources & APIs

### 1. NASA Near-Earth Object (NEO) Web Service API
- **URL**: https://api.nasa.gov/neo/rest/v1
- **Purpose**: Access to NASA's Near-Earth Object dataset including orbital parameters, size estimates, and close-approach data
- **Key Features**:
  - Orbital elements (semi-major axis, eccentricity, inclination)
  - Size estimates and close-approach data
  - Real-time NEO tracking information
  - Free API key available at https://api.nasa.gov
- **Implementation**: Used in `src/services/nasaApi.js` for realistic asteroid data integration

### 2. NASA Small-Body Database Query Tool
- **URL**: https://ssd-api.jpl.nasa.gov/doc/sbdb.html
- **Purpose**: Access to Keplerian parameters for near-Earth objects (NEOs) and potentially hazardous asteroids (PHAs)
- **Key Features**:
  - Precise orbital ephemerides
  - Small-body parameters and classifications
  - High-fidelity trajectory verification
- **Implementation**: Used for validating orbital mechanics calculations in the simulation engine

### 3. NASA JPL Horizons System
- **URL**: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **Purpose**: High-precision planetary and small-body ephemerides
- **Key Features**:
  - Precise orbital calculations
  - Multi-body gravitational effects
  - Time-dependent position calculations
- **Implementation**: Reference for advanced orbital mechanics in `src/services/simulationEngine.ts`

## USGS Data Sources

### 1. USGS National Earthquake Information Center (NEIC) Earthquake Catalog
- **URL**: https://earthquake.usgs.gov/earthquakes/feed/
- **Purpose**: Global earthquake data for modeling seismic effects of asteroid impacts
- **Key Features**:
  - Location, magnitude, and depth data
  - Seismic effect correlation with impact energy
  - Ground shaking intensity modeling
- **Implementation**: Used in `src/services/usgsApi.js` for seismic impact analysis

### 2. USGS National Map Elevation Data
- **URL**: https://www.usgs.gov/3d-elevation-program
- **Purpose**: High-resolution digital elevation models (DEMs) for impact location analysis
- **Key Features**:
  - GeoTIFF format elevation data
  - Tsunami inundation modeling
  - Crater formation topography
- **Implementation**: Integrated for regional impact analysis and visualization

### 3. USGS National Map Training Resources
- **URL**: https://www.usgs.gov/3d-elevation-program/training
- **Purpose**: Educational resources for geospatial data utilization
- **Key Features**:
  - Training videos and documentation
  - Best practices for elevation data usage
  - GIS integration guidelines

## Orbital Mechanics References

### 1. Elliptical Orbit Simulator (NASA/JPL)
- **Author**: Daniel A. O'Neil, April 14, 2017
- **Purpose**: Practical implementation of orbital mechanics in R programming
- **Key Features**:
  - Kepler equation solving (Murison's algorithm)
  - 3D orbital transformations
  - Interactive 3D visualization
  - WebGL export capabilities
- **Implementation**: Adapted for JavaScript/TypeScript in `src/services/simulationEngine.ts`

### 2. Approximate Positions of the Planets (NASA JPL)
- **URL**: https://ssd.jpl.nasa.gov/planets/approx_pos.html
- **Purpose**: Keplerian elements and orbital mechanics formulas
- **Key Features**:
  - Planetary position calculations
  - Kepler's equation solutions
  - Epoch handling and coordinate transformations
- **Implementation**: Reference for orbital element calculations and coordinate systems

### 3. Eyes on Asteroids (NASA/JPL)
- **URL**: https://eyes.nasa.gov/apps/asteroids/
- **Purpose**: Interactive visualization reference for asteroid tracking
- **Key Features**:
  - 3D orbital visualization
  - Real-time asteroid tracking
  - User-friendly interface design
- **Implementation**: UI/UX inspiration for the orbital trajectory simulator

## Technical Implementation

### Orbital Mechanics Engine
The core simulation engine (`src/services/simulationEngine.ts`) implements:

1. **Kepler Equation Solver**: Newton-Raphson iteration with robust convergence
2. **3D Coordinate Transformations**: Perifocal to ECI coordinate conversion
3. **Trajectory Propagation**: Time-sampled orbital position calculations
4. **Collision Detection**: Earth intersection algorithms
5. **Impact Physics**: Energy calculations, crater formation, and effect radii

### Data Integration
- **Real-time NEO Data**: NASA API integration for current asteroid information
- **Seismic Analysis**: USGS earthquake data correlation with impact effects
- **Elevation Modeling**: USGS DEM data for regional impact analysis
- **Tsunami Modeling**: Ocean depth and coastal impact calculations

### Visualization Components
- **3D Orbital Visualization**: Canvas-based trajectory rendering
- **Interactive Earth**: Click-to-select impact locations
- **Real-time Updates**: Parameter changes reflect immediately in visualization
- **Impact Animation**: Collision sequence with explosion effects

## Educational Resources

### Orbital Mechanics Tutorials
1. **2D Orbit Geometry**: http://www.physics.csbsju.edu/orbit/orbit.2d.html
2. **3D Orbit Transformations**: http://www.physics.csbsju.edu/orbit/orbit.3d.html
3. **Kepler's Laws**: Mathematical foundations and applications
4. **Coordinate Systems**: ECI, ECEF, and geodetic transformations

### Impact Physics References
1. **Pi-Scaling Laws**: Crater formation and scaling relationships
2. **Seismic Magnitude**: Earthquake equivalent calculations
3. **Tsunami Modeling**: Wave propagation and coastal effects
4. **Environmental Impact**: Atmospheric and climate effects

## API Integration Best Practices

### Security
- **API Key Management**: Server-side key storage and proxy requests
- **Rate Limiting**: Implement caching to avoid API throttling
- **Error Handling**: Graceful fallbacks for API failures

### Performance
- **Data Caching**: Local storage of frequently accessed data
- **Lazy Loading**: On-demand data fetching
- **Optimization**: Efficient data structures and algorithms

### Testing
- **Unit Tests**: Kepler solver and coordinate transformation validation
- **Integration Tests**: API connectivity and data processing
- **Visualization Tests**: Rendering accuracy and performance

## Future Enhancements

### Advanced Features
1. **Multi-body Dynamics**: Jupiter and other planetary influences
2. **Perturbation Models**: Solar radiation pressure and atmospheric drag
3. **Uncertainty Propagation**: Monte Carlo impact probability analysis
4. **Real-time Updates**: Live NEO data integration

### Data Sources
1. **ESA Space Situational Awareness**: European asteroid tracking data
2. **Minor Planet Center**: International asteroid database
3. **Space Weather Data**: Solar wind and radiation effects
4. **Population Data**: Global demographic and infrastructure datasets

## Credits and Acknowledgments

- **NASA JPL**: Orbital mechanics algorithms and reference data
- **USGS**: Seismic and elevation data services
- **Daniel A. O'Neil**: Elliptical orbit simulator methodology
- **OpenStreetMap**: Base mapping data and tile services
- **React Leaflet**: Interactive mapping components

## References

1. NASA NEO Web Service API Documentation: https://api.nasa.gov/neo/
2. USGS Earthquake API: https://earthquake.usgs.gov/earthquakes/feed/
3. JPL Small-Body Database: https://ssd-api.jpl.nasa.gov/doc/sbdb.html
4. Elliptical Orbit Simulator: https://www.nasa.gov/feature/elliptical-orbit-simulator
5. Approximate Planetary Positions: https://ssd.jpl.nasa.gov/planets/approx_pos.html
6. Eyes on Asteroids: https://eyes.nasa.gov/apps/asteroids/

---

*This application was developed for the 2025 NASA Space Apps Challenge as part of the MeteorMadness team's submission for asteroid impact simulation and mitigation strategies.*
