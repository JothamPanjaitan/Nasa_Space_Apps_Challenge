"""
NASA NEO API integration and orbital mechanics calculations
Based on NASA's Near-Earth Object Web Service and Keplerian orbital elements
"""

import requests
import math
import numpy as np
from datetime import datetime, timedelta
import json

class NASAAPIClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or "DEMO_KEY"  # Use demo key if none provided
        self.base_url = "https://api.nasa.gov/neo/rest/v1"
        
    def get_asteroids_today(self):
        """Get asteroids approaching Earth today"""
        today = datetime.now().strftime("%Y-%m-%d")
        url = f"{self.base_url}/feed"
        params = {
            "start_date": today,
            "end_date": today,
            "api_key": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get("near_earth_objects", {}).get(today, [])
        except requests.RequestException as e:
            print(f"Error fetching NASA data: {e}")
            return []
    
    def get_asteroid_details(self, asteroid_id):
        """Get detailed information about a specific asteroid"""
        url = f"{self.base_url}/neo/{asteroid_id}"
        params = {"api_key": self.api_key}
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching asteroid details: {e}")
            return None
    
    def get_hazardous_asteroids(self, days=7):
        """Get potentially hazardous asteroids in the next N days"""
        start_date = datetime.now()
        end_date = start_date + timedelta(days=days)
        
        url = f"{self.base_url}/feed"
        params = {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "api_key": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            hazardous = []
            for date, asteroids in data.get("near_earth_objects", {}).items():
                for asteroid in asteroids:
                    if asteroid.get("is_potentially_hazardous_asteroid", False):
                        hazardous.append(asteroid)
            
            return hazardous
        except requests.RequestException as e:
            print(f"Error fetching hazardous asteroids: {e}")
            return []

class OrbitalMechanics:
    """Orbital mechanics calculations using Keplerian elements"""
    
    @staticmethod
    def kepler_equation(E, e, M):
        """Solve Kepler's equation: M = E - e*sin(E)"""
        return E - e * math.sin(E) - M
    
    @staticmethod
    def solve_kepler_equation(M, e, tolerance=1e-6, max_iterations=100):
        """Solve Kepler's equation using Newton-Raphson method"""
        if e < 1e-6:  # Circular orbit
            return M
        
        E = M  # Initial guess
        for _ in range(max_iterations):
            f = OrbitalMechanics.kepler_equation(E, e, M)
            f_prime = 1 - e * math.cos(E)
            
            if abs(f) < tolerance:
                break
                
            E = E - f / f_prime
        
        return E
    
    @staticmethod
    def calculate_position(a, e, i, omega, w, M, mu=1.327e11):
        """
        Calculate 3D position from Keplerian elements
        Args:
            a: semi-major axis (km)
            e: eccentricity
            i: inclination (radians)
            omega: longitude of ascending node (radians)
            w: argument of periapsis (radians)
            M: mean anomaly (radians)
            mu: gravitational parameter (km³/s²)
        Returns:
            (x, y, z) position in km
        """
        # Solve Kepler's equation
        E = OrbitalMechanics.solve_kepler_equation(M, e)
        
        # Calculate true anomaly
        nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(E/2), 
                           math.sqrt(1 - e) * math.cos(E/2))
        
        # Calculate distance from focus
        r = a * (1 - e**2) / (1 + e * math.cos(nu))
        
        # Position in orbital plane
        x_orb = r * math.cos(nu)
        y_orb = r * math.sin(nu)
        z_orb = 0
        
        # Rotate to 3D space
        # Rotation matrix for orbital elements
        cos_omega = math.cos(omega)
        sin_omega = math.sin(omega)
        cos_w = math.cos(w)
        sin_w = math.sin(w)
        cos_i = math.cos(i)
        sin_i = math.sin(i)
        
        # First rotation: argument of periapsis
        x1 = x_orb * cos_w - y_orb * sin_w
        y1 = x_orb * sin_w + y_orb * cos_w
        z1 = z_orb
        
        # Second rotation: inclination
        x2 = x1
        y2 = y1 * cos_i - z1 * sin_i
        z2 = y1 * sin_i + z1 * cos_i
        
        # Third rotation: longitude of ascending node
        x = x2 * cos_omega - y2 * sin_omega
        y = x2 * sin_omega + y2 * cos_omega
        z = z2
        
        return x, y, z
    
    @staticmethod
    def calculate_velocity(a, e, i, omega, w, M, mu=1.327e11):
        """
        Calculate 3D velocity from Keplerian elements
        """
        E = OrbitalMechanics.solve_kepler_equation(M, e)
        
        # Calculate true anomaly
        nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(E/2), 
                           math.sqrt(1 - e) * math.cos(E/2))
        
        # Calculate distance and velocity magnitude
        r = a * (1 - e**2) / (1 + e * math.cos(nu))
        v = math.sqrt(mu * (2/r - 1/a))
        
        # Velocity components in orbital plane
        vx_orb = -v * math.sin(nu)
        vy_orb = v * (e + math.cos(nu))
        vz_orb = 0
        
        # Apply same rotations as position
        cos_omega = math.cos(omega)
        sin_omega = math.sin(omega)
        cos_w = math.cos(w)
        sin_w = math.sin(w)
        cos_i = math.cos(i)
        sin_i = math.sin(i)
        
        # First rotation: argument of periapsis
        vx1 = vx_orb * cos_w - vy_orb * sin_w
        vy1 = vx_orb * sin_w + vy_orb * cos_w
        vz1 = vz_orb
        
        # Second rotation: inclination
        vx2 = vx1
        vy2 = vy1 * cos_i - vz1 * sin_i
        vz2 = vy1 * sin_i + vz1 * cos_i
        
        # Third rotation: longitude of ascending node
        vx = vx2 * cos_omega - vy2 * sin_omega
        vy = vx2 * sin_omega + vy2 * cos_omega
        vz = vz2
        
        return vx, vy, vz
    
    @staticmethod
    def propagate_orbit(a, e, i, omega, w, M0, time_delta, mu=1.327e11):
        """
        Propagate orbit forward in time
        Args:
            time_delta: time change in seconds
        Returns:
            (x, y, z, vx, vy, vz) position and velocity
        """
        # Calculate mean motion
        n = math.sqrt(mu / (a**3))
        
        # New mean anomaly
        M = M0 + n * time_delta
        
        # Calculate position and velocity
        pos = OrbitalMechanics.calculate_position(a, e, i, omega, w, M, mu)
        vel = OrbitalMechanics.calculate_velocity(a, e, i, omega, w, M, mu)
        
        return pos + vel

class AsteroidProcessor:
    """Process NASA asteroid data and convert to game format"""
    
    def __init__(self):
        self.nasa_client = NASAAPIClient()
    
    def process_asteroid_data(self, raw_asteroid):
        """Convert NASA asteroid data to game format"""
        try:
            # Extract orbital elements
            orbital_data = raw_asteroid.get("orbital_data", {})
            
            # Calculate diameter from absolute magnitude
            H = orbital_data.get("absolute_magnitude_h", 20)
            diameter = self.estimate_diameter_from_magnitude(H)
            
            # Get velocity from close approach data
            close_approach_data = raw_asteroid.get("close_approach_data", [])
            velocity = 17000  # Default velocity in m/s
            if close_approach_data:
                relative_velocity = close_approach_data[0].get("relative_velocity", {})
                velocity = float(relative_velocity.get("kilometers_per_second", 17)) * 1000
            
            # Estimate density (typical for asteroids)
            density = 2600  # kg/m³
            
            # Extract orbital elements
            a = float(orbital_data.get("semi_major_axis", 1.5))  # AU
            e = float(orbital_data.get("eccentricity", 0.1))
            i = math.radians(float(orbital_data.get("inclination", 0)))
            omega = math.radians(float(orbital_data.get("longitude_of_ascending_node", 0)))
            w = math.radians(float(orbital_data.get("argument_of_periapsis", 0)))
            M = math.radians(float(orbital_data.get("mean_anomaly", 0)))
            
            # Convert semi-major axis to km
            a_km = a * 1.496e8  # AU to km
            
            processed = {
                "id": str(raw_asteroid.get("id", "unknown")),
                "name": raw_asteroid.get("name", "Unknown Asteroid"),
                "diameter": diameter,
                "velocity": velocity,
                "density": density,
                "approach_date": self.get_next_approach_date(close_approach_data),
                "hazardous": raw_asteroid.get("is_potentially_hazardous_asteroid", False),
                "orbital_elements": {
                    "semi_major_axis": a_km,
                    "eccentricity": e,
                    "inclination": i,
                    "longitude_of_ascending_node": omega,
                    "argument_of_periapsis": w,
                    "mean_anomaly": M
                },
                "close_approaches": close_approach_data
            }
            
            return processed
            
        except Exception as e:
            print(f"Error processing asteroid data: {e}")
            return None
    
    def estimate_diameter_from_magnitude(self, H, albedo=0.15):
        """Estimate diameter from absolute magnitude"""
        # Using the relationship: D = 1329 * 10^(-H/5) / sqrt(albedo)
        diameter = 1329 * (10 ** (-H / 5)) / math.sqrt(albedo)
        return diameter  # km
    
    def get_next_approach_date(self, close_approach_data):
        """Get the next close approach date"""
        if not close_approach_data:
            return datetime.now().strftime("%Y-%m-%d")
        
        # Find the next future approach
        now = datetime.now()
        for approach in close_approach_data:
            approach_date = datetime.strptime(approach.get("close_approach_date", ""), "%Y-%m-%d")
            if approach_date > now:
                return approach.get("close_approach_date", "")
        
        # If no future approach, return the last one
        return close_approach_data[-1].get("close_approach_date", datetime.now().strftime("%Y-%m-%d"))
    
    def get_live_asteroids(self, limit=10):
        """Get live asteroid data from NASA API"""
        asteroids = self.nasa_client.get_asteroids_today()
        processed = []
        
        for asteroid in asteroids[:limit]:
            processed_asteroid = self.process_asteroid_data(asteroid)
            if processed_asteroid:
                processed.append(processed_asteroid)
        
        return processed
    
    def get_hazardous_asteroids(self, days=7):
        """Get potentially hazardous asteroids"""
        raw_asteroids = self.nasa_client.get_hazardous_asteroids(days)
        processed = []
        
        for asteroid in raw_asteroids:
            processed_asteroid = self.process_asteroid_data(asteroid)
            if processed_asteroid:
                processed.append(processed_asteroid)
        
        return processed
