from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import math
from impact import (
    calculate_mass, calculate_kinetic_energy, calculate_tnt_equivalent, 
    calculate_crater_diameter, energy_to_magnitude, calculate_blast_radius,
    calculate_thermal_radius, calculate_seismic_radius, calculate_tsunami_radius,
    calculate_indirect_effects, calculate_casualties, calculate_infrastructure_damage
)
from nasa_api import AsteroidProcessor, OrbitalMechanics
from ml_models import impact_predictor, deflection_optimizer, adaptive_difficulty, initialize_ml_models

app = Flask(__name__)
CORS(app)

# Initialize asteroid processor and ML models
asteroid_processor = AsteroidProcessor()
initialize_ml_models()

# Sample asteroid data
ASTEROIDS = {
    "impactor-2025": {
        "id": "impactor-2025",
        "name": "2025 Impactor",
        "diameter": 100,  # meters
        "velocity": 17000,  # m/s
        "density": 2600,  # kg/m³
        "approach_date": "2025-03-15",
        "hazardous": True
    },
    "apophis": {
        "id": "apophis",
        "name": "99942 Apophis",
        "diameter": 370,  # meters
        "velocity": 12000,  # m/s
        "density": 2600,  # kg/m³
        "approach_date": "2029-04-13",
        "hazardous": True
    },
    "bennu": {
        "id": "bennu",
        "name": "101955 Bennu",
        "diameter": 500,  # meters
        "velocity": 10000,  # m/s
        "density": 1200,  # kg/m³
        "approach_date": "2135-09-25",
        "hazardous": False
    }
}

# Story scenarios
STORY_SCENARIOS = [
    {
        "id": "scenario_1",
        "title": "The Discovery",
        "description": "A 100-meter asteroid has been detected on a collision course with Earth. Impact in 30 days. Population at risk: 2.5 million people in coastal cities.",
        "asteroid_id": "impactor-2025",
        "time_to_impact": 30,  # days
        "population_at_risk": 2500000,
        "target_cities": [
            {"name": "Miami", "lat": 25.7617, "lon": -80.1918, "population": 500000},
            {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503, "population": 14000000},
            {"name": "New York", "lat": 40.7128, "lon": -74.0060, "population": 8000000}
        ],
        "challenge": "deflect_asteroid",
        "success_criteria": {
            "min_deflection_distance": 1000,  # km
            "max_time_remaining": 30
        }
    },
    {
        "id": "scenario_2", 
        "title": "The Big One",
        "description": "A massive 500-meter asteroid threatens global civilization. Impact in 60 days. Population at risk: 50 million people worldwide.",
        "asteroid_id": "apophis",
        "time_to_impact": 60,
        "population_at_risk": 50000000,
        "target_cities": [
            {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437, "population": 4000000},
            {"name": "London", "lat": 51.5074, "lon": -0.1278, "population": 9000000},
            {"name": "Shanghai", "lat": 31.2304, "lon": 121.4737, "population": 24000000}
        ],
        "challenge": "deflect_asteroid",
        "success_criteria": {
            "min_deflection_distance": 2000,
            "max_time_remaining": 60
        }
    }
]

@app.route('/api/neo/<asteroid_id>', methods=['GET'])
def get_asteroid(asteroid_id):
    """Get asteroid data by ID"""
    if asteroid_id in ASTEROIDS:
        return jsonify(ASTEROIDS[asteroid_id])
    else:
        return jsonify({"error": "Asteroid not found"}), 404

@app.route('/api/neo', methods=['GET'])
def list_asteroids():
    """List all available asteroids"""
    return jsonify(list(ASTEROIDS.values()))

@app.route('/api/neo/live', methods=['GET'])
def get_live_asteroids():
    """Get live asteroid data from NASA API"""
    try:
        limit = request.args.get('limit', 10, type=int)
        asteroids = asteroid_processor.get_live_asteroids(limit)
        return jsonify(asteroids)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch live data: {str(e)}"}), 500

@app.route('/api/neo/hazardous', methods=['GET'])
def get_hazardous_asteroids():
    """Get potentially hazardous asteroids"""
    try:
        days = request.args.get('days', 7, type=int)
        asteroids = asteroid_processor.get_hazardous_asteroids(days)
        return jsonify(asteroids)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch hazardous asteroids: {str(e)}"}), 500

@app.route('/api/simulate', methods=['POST'])
def simulate_impact():
    """Simulate asteroid impact effects with enhanced calculations"""
    data = request.get_json()
    
    # Use provided data or sample asteroid
    diameter = data.get('diameter', 100)  # meters
    velocity = data.get('velocity', 17000)  # m/s
    density = data.get('density', 2600)  # kg/m³
    impact_lat = data.get('impact_lat', 25.7617)  # Miami default
    impact_lon = data.get('impact_lon', -80.1918)
    impact_region = data.get('impact_region', 'land')  # land/ocean/urban
    population_density = data.get('population_density', 100)  # people per km²
    
    # Calculate basic impact effects
    mass = calculate_mass(diameter, density)
    kinetic_energy = calculate_kinetic_energy(mass, velocity)
    tnt_equivalent = calculate_tnt_equivalent(kinetic_energy)
    crater_diameter = calculate_crater_diameter(diameter, velocity, density)
    magnitude = energy_to_magnitude(kinetic_energy)
    
    # Calculate direct effects
    blast_radius = calculate_blast_radius(tnt_equivalent)
    thermal_radius = calculate_thermal_radius(tnt_equivalent)
    seismic_radius = calculate_seismic_radius(tnt_equivalent)
    
    # Calculate tsunami effects (if ocean impact)
    tsunami_radius = None
    if impact_region == 'ocean':
        tsunami_radius = calculate_tsunami_radius(tnt_equivalent)
    
    # Calculate indirect effects
    indirect_effects = calculate_indirect_effects(tnt_equivalent, impact_region)
    
    # Calculate casualties
    casualties = calculate_casualties(blast_radius, population_density, impact_region)
    
    # Calculate infrastructure damage
    infrastructure_damage = calculate_infrastructure_damage(blast_radius, thermal_radius, seismic_radius)
    
    result = {
        "asteroid": {
            "diameter": diameter,
            "velocity": velocity,
            "density": density,
            "mass": mass
        },
        "impact": {
            "location": {
                "latitude": impact_lat,
                "longitude": impact_lon
            },
            "kinetic_energy": kinetic_energy,
            "tnt_equivalent": tnt_equivalent,
            "crater_diameter": crater_diameter,
            "earthquake_magnitude": magnitude
        },
        "direct_effects": {
            "blast_radius": blast_radius / 1000,  # Convert to km
            "thermal_radius": thermal_radius / 1000,  # Convert to km
            "seismic_radius": seismic_radius / 1000,  # Convert to km
            "tsunami_radius": tsunami_radius / 1000 if tsunami_radius else None  # Convert to km
        },
        "indirect_effects": {
            "economic_radius": indirect_effects["economic_radius"] / 1000,  # Convert to km
            "environmental_radius": indirect_effects["environmental_radius"] / 1000,  # Convert to km
            "health_radius": indirect_effects["health_radius"] / 1000,  # Convert to km
            "governance_radius": indirect_effects["governance_radius"] / 1000  # Convert to km
        },
        "casualties": {
            "estimated_casualties": casualties,
            "population_density": population_density,
            "impact_region": impact_region
        },
        "infrastructure_damage": infrastructure_damage
    }
    
    return jsonify(result)

@app.route('/api/deflect', methods=['POST'])
def deflect_asteroid():
    """Calculate deflection results"""
    data = request.get_json()
    
    delta_v = data.get('delta_v', 0.1)  # m/s
    time_before_impact = data.get('time_before_impact', 30)  # days
    original_lat = data.get('original_lat', 25.7617)
    original_lon = data.get('original_lon', -80.1918)
    velocity = data.get('velocity', 17000)  # m/s
    
    # Simple linear approximation for deflection
    # This is a simplified model for demonstration
    deflection_distance = delta_v * time_before_impact * 24 * 3600  # meters
    
    # Convert to degrees (rough approximation)
    lat_deflection = deflection_distance / 111000  # ~111km per degree
    lon_deflection = deflection_distance / (111000 * math.cos(math.radians(original_lat)))
    
    new_lat = original_lat + lat_deflection
    new_lon = original_lon + lon_deflection
    
    # Calculate if deflection is sufficient
    distance_shifted = math.sqrt((lat_deflection * 111000) ** 2 + (lon_deflection * 111000) ** 2)
    
    result = {
        "deflection": {
            "delta_v": delta_v,
            "time_before_impact": time_before_impact,
            "distance_shifted": distance_shifted / 1000,  # km
            "success": distance_shifted > 1000  # 1000m minimum deflection
        },
        "new_impact_location": {
            "latitude": new_lat,
            "longitude": new_lon
        },
        "original_impact_location": {
            "latitude": original_lat,
            "longitude": original_lon
        }
    }
    
    return jsonify(result)

@app.route('/api/orbit/simulate', methods=['POST'])
def simulate_orbit():
    """Simulate asteroid orbital trajectory"""
    data = request.get_json()
    
    # Get orbital elements
    orbital_elements = data.get('orbital_elements', {})
    a = orbital_elements.get('semi_major_axis', 1.5e8)  # km
    e = orbital_elements.get('eccentricity', 0.1)
    i = orbital_elements.get('inclination', 0)
    omega = orbital_elements.get('longitude_of_ascending_node', 0)
    w = orbital_elements.get('argument_of_periapsis', 0)
    M0 = orbital_elements.get('mean_anomaly', 0)
    
    # Time parameters
    time_steps = data.get('time_steps', 100)
    time_span = data.get('time_span', 365 * 24 * 3600)  # 1 year in seconds
    
    # Generate trajectory points
    trajectory = []
    for step in range(time_steps):
        time_delta = (step / (time_steps - 1)) * time_span
        pos_vel = OrbitalMechanics.propagate_orbit(a, e, i, omega, w, M0, time_delta)
        
        trajectory.append({
            "time": time_delta,
            "position": {
                "x": pos_vel[0],
                "y": pos_vel[1], 
                "z": pos_vel[2]
            },
            "velocity": {
                "x": pos_vel[3],
                "y": pos_vel[4],
                "z": pos_vel[5]
            }
        })
    
    return jsonify({
        "trajectory": trajectory,
        "orbital_elements": orbital_elements
    })

@app.route('/api/story/next', methods=['GET'])
def get_next_story():
    """Get the next story scenario"""
    scenario_id = request.args.get('scenario_id', 'scenario_1')
    
    for scenario in STORY_SCENARIOS:
        if scenario['id'] == scenario_id:
            return jsonify(scenario)
    
    return jsonify({"error": "Scenario not found"}), 404

@app.route('/api/story/scenarios', methods=['GET'])
def list_scenarios():
    """List all available story scenarios"""
    return jsonify(STORY_SCENARIOS)

@app.route('/api/score', methods=['POST'])
def calculate_score():
    """Calculate player score based on performance"""
    data = request.get_json()
    
    population_saved = data.get('population_saved', 0)
    time_remaining = data.get('time_remaining', 0)
    deflection_distance = data.get('deflection_distance', 0)
    
    # Simple scoring system
    base_score = population_saved * 10
    time_bonus = time_remaining * 1000
    deflection_bonus = deflection_distance * 100
    
    total_score = base_score + time_bonus + deflection_bonus
    
    return jsonify({
        "score": total_score,
        "breakdown": {
            "population_saved": population_saved,
            "time_bonus": time_bonus,
            "deflection_bonus": deflection_bonus,
            "total": total_score
        }
    })

@app.route('/api/ml/predict-impact', methods=['POST'])
def ml_predict_impact():
    """Use ML to predict impact effects"""
    data = request.get_json()
    
    diameter = data.get('diameter', 100)
    velocity = data.get('velocity', 17000)
    density = data.get('density', 2600)
    impact_angle = data.get('impact_angle', 45)
    
    try:
        prediction = impact_predictor.predict(diameter, velocity, density, impact_angle)
        return jsonify({
            "prediction": prediction,
            "model_type": "Random Forest Regressor",
            "confidence": 0.85  # Placeholder confidence score
        })
    except Exception as e:
        return jsonify({"error": f"ML prediction failed: {str(e)}"}), 500

@app.route('/api/ml/optimize-deflection', methods=['POST'])
def ml_optimize_deflection():
    """Use ML to optimize deflection parameters"""
    data = request.get_json()
    
    diameter = data.get('diameter', 100)
    velocity = data.get('velocity', 17000)
    time_remaining = data.get('time_remaining', 30)
    impact_distance = data.get('impact_distance', 1000)
    
    try:
        optimization = deflection_optimizer.optimize_deflection(
            diameter, velocity, time_remaining, impact_distance
        )
        return jsonify({
            "optimization": optimization,
            "model_type": "Gradient Boosting Regressor",
            "confidence": 0.82
        })
    except Exception as e:
        return jsonify({"error": f"ML optimization failed: {str(e)}"}), 500

@app.route('/api/ml/adaptive-difficulty', methods=['POST'])
def update_adaptive_difficulty():
    """Update adaptive difficulty based on player performance"""
    data = request.get_json()
    
    score = data.get('score', 0)
    time_taken = data.get('time_taken', 0)
    deflection_accuracy = data.get('deflection_accuracy', 0)
    
    try:
        adaptive_difficulty.update_performance(score, time_taken, deflection_accuracy)
        return jsonify({
            "difficulty_level": adaptive_difficulty.get_difficulty_level(),
            "performance_window": len(adaptive_difficulty.player_performance)
        })
    except Exception as e:
        return jsonify({"error": f"Adaptive difficulty update failed: {str(e)}"}), 500

@app.route('/api/ml/scenario', methods=['POST'])
def get_adaptive_scenario():
    """Get scenario with adaptive difficulty"""
    data = request.get_json()
    base_scenario = data.get('scenario', STORY_SCENARIOS[0])
    
    try:
        adapted_scenario = adaptive_difficulty.get_scenario_parameters(base_scenario)
        return jsonify(adapted_scenario)
    except Exception as e:
        return jsonify({"error": f"Adaptive scenario generation failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
