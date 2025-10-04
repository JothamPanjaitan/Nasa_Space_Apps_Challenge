// USGS API integration for seismic and tsunami data
const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const USGS_ELEVATION_API = 'https://nationalmap.gov/epqs/pqs.php';

export class UsgsApiService {
  static async getSeismicActivity(startTime, endTime, minMagnitude = 2.5) {
    try {
      const params = new URLSearchParams({
        format: 'geojson',
        starttime: startTime,
        endtime: endTime,
        minmagnitude: minMagnitude.toString(),
        orderby: 'time'
      });

      const response = await fetch(`${USGS_EARTHQUAKE_API}?${params}`);
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching seismic data:', error);
      return this.getMockSeismicData();
    }
  }

  static async getElevationData(lat, lng) {
    try {
      const params = new URLSearchParams({
        x: lng.toString(),
        y: lat.toString(),
        units: 'Meters',
        output: 'json'
      });

      const response = await fetch(`${USGS_ELEVATION_API}?${params}`);
      
      if (!response.ok) {
        throw new Error(`USGS Elevation API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      return this.getMockElevationData(lat, lng);
    }
  }

  static async getTsunamiHazardData(region) {
    try {
      // This would integrate with NOAA tsunami data
      // For now, return mock data based on region
      return this.getMockTsunamiData(region);
    } catch (error) {
      console.error('Error fetching tsunami data:', error);
      return this.getMockTsunamiData(region);
    }
  }

  static getMockSeismicData() {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            mag: 4.5,
            place: 'Test Earthquake',
            time: Date.now(),
            url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test',
            detail: 'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=test&format=geojson',
            felt: null,
            cdi: null,
            mmi: null,
            alert: null,
            status: 'automatic',
            tsunami: 0,
            sig: 312,
            net: 'us',
            code: 'test',
            ids: ',test,',
            sources: ',us,',
            types: ',origin,phase-data,',
            nst: null,
            dmin: null,
            rms: 0.5,
            gap: null,
            magType: 'ml',
            type: 'earthquake',
            title: 'Test Earthquake'
          },
          geometry: {
            type: 'Point',
            coordinates: [-100.0, 40.0, 10.0]
          },
          id: 'test'
        }
      ]
    };
  }

  static getMockElevationData(lat, lng) {
    // Mock elevation data - in real implementation, this would come from USGS
    const baseElevation = 100; // meters
    const variation = Math.sin(lat * Math.PI / 180) * Math.cos(lng * Math.PI / 180) * 1000;
    return {
      USGS_Elevation_Point_Query_Service: {
        Elevation_Query: {
          Elevation: baseElevation + variation,
          Units: 'Meters',
          x: lng,
          y: lat
        }
      }
    };
  }

  static getMockTsunamiData(region) {
    const tsunamiData = {
      'ocean_pacific': {
        risk_level: 'high',
        wave_height: 15.0,
        inundation_distance: 5000,
        affected_coastlines: ['Pacific Coast', 'Hawaii', 'Alaska']
      },
      'ocean_atlantic': {
        risk_level: 'medium',
        wave_height: 8.0,
        inundation_distance: 3000,
        affected_coastlines: ['East Coast', 'Caribbean']
      },
      'europe': {
        risk_level: 'low',
        wave_height: 3.0,
        inundation_distance: 1000,
        affected_coastlines: ['Mediterranean', 'North Sea']
      },
      'asia': {
        risk_level: 'high',
        wave_height: 12.0,
        inundation_distance: 4000,
        affected_coastlines: ['Pacific Rim', 'Indian Ocean']
      }
    };

    return tsunamiData[region] || {
      risk_level: 'low',
      wave_height: 2.0,
      inundation_distance: 500,
      affected_coastlines: ['Local Coastline']
    };
  }

  // Calculate seismic magnitude equivalent for asteroid impact
  static calculateSeismicMagnitude(impactEnergy) {
    // Convert impact energy to equivalent earthquake magnitude
    // Using empirical relationship: Mw = (log10(E) - 4.8) / 1.5
    const energyJoules = impactEnergy; // Assuming energy is in Joules
    const magnitude = (Math.log10(energyJoules) - 4.8) / 1.5;
    return Math.max(0, magnitude); // Ensure non-negative
  }

  // Calculate tsunami parameters for ocean impact
  static calculateTsunamiParameters(impactEnergy, impactLocation, oceanDepth = 4000) {
    const energyJoules = impactEnergy;
    
    // Simplified tsunami calculation
    const waveHeight = Math.min(50, Math.sqrt(energyJoules / 1e12) * 10); // Max 50m
    const propagationSpeed = Math.sqrt(9.8 * oceanDepth); // m/s
    const inundationDistance = waveHeight * 100; // Simplified relationship
    
    return {
      waveHeight: Math.max(1, waveHeight),
      propagationSpeed,
      inundationDistance: Math.max(100, inundationDistance),
      affectedRadius: Math.min(1000, Math.sqrt(energyJoules / 1e15) * 500) // km
    };
  }
}
