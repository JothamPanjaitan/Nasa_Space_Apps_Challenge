"""
Physics calculations for asteroid impact effects
Based on Holsapple scaling laws and USGS empirical relations
"""

import math

def calculate_mass(diameter, density):
    """
    Calculate mass of spherical asteroid
    Args:
        diameter: diameter in meters
        density: density in kg/m³
    Returns:
        mass in kg
    """
    radius = diameter / 2
    volume = (4/3) * math.pi * radius**3
    return volume * density

def calculate_kinetic_energy(mass, velocity):
    """
    Calculate kinetic energy of asteroid
    Args:
        mass: mass in kg
        velocity: velocity in m/s
    Returns:
        kinetic energy in Joules
    """
    return 0.5 * mass * velocity**2

def calculate_tnt_equivalent(kinetic_energy):
    """
    Convert kinetic energy to TNT equivalent
    Args:
        kinetic_energy: energy in Joules
    Returns:
        TNT equivalent in tons
    """
    # 1 ton TNT = 4.184 × 10^9 J
    tnt_energy_per_ton = 4.184e9
    return kinetic_energy / tnt_energy_per_ton

def calculate_crater_diameter(diameter, velocity, density):
    """
    Calculate crater diameter using simplified pi-scaling
    Args:
        diameter: asteroid diameter in meters
        velocity: impact velocity in m/s
        density: asteroid density in kg/m³
    Returns:
        crater diameter in meters
    """
    # Target density (Earth's crust) in kg/m³
    target_density = 2700
    
    # Pi-scaling parameter (simplified)
    pi_scaling = 1.61 * (density / target_density)**(1/3) * (velocity / 1000)**(2/3)
    
    # Crater diameter
    crater_diameter = diameter * pi_scaling
    
    return crater_diameter

def energy_to_magnitude(kinetic_energy):
    """
    Convert kinetic energy to earthquake magnitude
    Based on USGS empirical relation
    Args:
        kinetic_energy: energy in Joules
    Returns:
        moment magnitude
    """
    # USGS empirical relation: log10(E) = 1.5*M + 4.8
    # Solving for M: M = (log10(E) - 4.8) / 1.5
    if kinetic_energy <= 0:
        return 0
    
    magnitude = (math.log10(kinetic_energy) - 4.8) / 1.5
    return max(0, magnitude)  # Ensure non-negative magnitude

def calculate_blast_radius(tnt_equivalent):
    """
    Calculate blast radius based on TNT equivalent
    Args:
        tnt_equivalent: TNT equivalent in tons
    Returns:
        blast radius in meters
    """
    # Simplified blast radius calculation
    # Based on Hopkinson-Cranz scaling
    if tnt_equivalent <= 0:
        return 0
    
    # Blast radius in meters
    blast_radius = 100 * (tnt_equivalent / 1000)**(1/3)
    return blast_radius

def calculate_thermal_radius(tnt_equivalent):
    """
    Calculate thermal radiation radius
    Args:
        tnt_equivalent: TNT equivalent in tons
    Returns:
        thermal radius in meters
    """
    if tnt_equivalent <= 0:
        return 0
    
    # Thermal radius is typically 2-3x blast radius
    thermal_radius = 2.5 * calculate_blast_radius(tnt_equivalent)
    return thermal_radius

def calculate_seismic_radius(tnt_equivalent):
    """
    Calculate seismic effect radius
    Args:
        tnt_equivalent: TNT equivalent in tons
    Returns:
        seismic radius in meters
    """
    if tnt_equivalent <= 0:
        return 0
    
    # Seismic effects extend much further than blast
    seismic_radius = 10 * calculate_blast_radius(tnt_equivalent)
    return seismic_radius

def calculate_tsunami_radius(tnt_equivalent, ocean_depth=4000):
    """
    Calculate tsunami generation radius for ocean impacts
    Args:
        tnt_equivalent: TNT equivalent in tons
        ocean_depth: ocean depth in meters (default 4000m)
    Returns:
        tsunami radius in meters
    """
    if tnt_equivalent <= 0:
        return 0
    
    # Tsunami radius based on energy and ocean depth
    # Simplified model: tsunami radius scales with cube root of energy
    tsunami_radius = 50 * (tnt_equivalent / 1000)**(1/3) * (ocean_depth / 4000)**(1/2)
    return tsunami_radius

def calculate_indirect_effects(tnt_equivalent, impact_region):
    """
    Calculate indirect impact effects
    Args:
        tnt_equivalent: TNT equivalent in tons
        impact_region: impact region type (land/ocean/urban)
    Returns:
        dictionary of indirect effect radii in meters
    """
    blast_radius = calculate_blast_radius(tnt_equivalent)
    
    # Economic disruption radius (market shocks, supply chain)
    economic_radius = blast_radius * 5
    
    # Environmental chain reaction radius (wildfires, climate effects)
    environmental_radius = blast_radius * 8
    
    # Public health & society radius (displacement, disease spread)
    health_radius = blast_radius * 3
    
    # Governance & information systems radius (coordination failures)
    governance_radius = blast_radius * 6
    
    # Adjust based on impact region
    if impact_region == "urban":
        economic_radius *= 2  # Higher economic impact in urban areas
        health_radius *= 1.5  # More displacement in urban areas
    elif impact_region == "ocean":
        environmental_radius *= 1.5  # Ocean acidification, salinity changes
        governance_radius *= 0.8  # Less governance impact for ocean impacts
    
    return {
        "economic_radius": economic_radius,
        "environmental_radius": environmental_radius,
        "health_radius": health_radius,
        "governance_radius": governance_radius
    }

def calculate_casualties(blast_radius, population_density, impact_region):
    """
    Estimate casualties based on blast radius and population density
    Args:
        blast_radius: blast radius in meters
        population_density: people per square km
        impact_region: impact region type
    Returns:
        estimated casualties
    """
    if blast_radius <= 0 or population_density <= 0:
        return 0
    
    # Area affected by blast
    blast_area_km2 = math.pi * (blast_radius / 1000)**2
    
    # Casualty rate based on distance from impact
    # 100% casualties within 0.5 * blast_radius
    # 50% casualties within blast_radius
    # 10% casualties within 2 * blast_radius
    
    inner_area = math.pi * (blast_radius * 0.5 / 1000)**2
    outer_area = math.pi * (blast_radius * 2 / 1000)**2
    middle_area = blast_area_km2 - inner_area
    
    casualties = (
        inner_area * population_density * 1.0 +  # 100% casualties
        middle_area * population_density * 0.5 +  # 50% casualties
        (outer_area - blast_area_km2) * population_density * 0.1  # 10% casualties
    )
    
    # Adjust for region type
    if impact_region == "urban":
        casualties *= 1.5  # Higher casualty rate in urban areas
    elif impact_region == "rural":
        casualties *= 0.7  # Lower casualty rate in rural areas
    
    return int(casualties)

def calculate_infrastructure_damage(blast_radius, thermal_radius, seismic_radius):
    """
    Calculate infrastructure damage categories
    Args:
        blast_radius: blast radius in meters
        thermal_radius: thermal radius in meters
        seismic_radius: seismic radius in meters
    Returns:
        dictionary of infrastructure damage
    """
    return {
        "complete_destruction": {
            "radius": blast_radius,
            "description": "Complete destruction of all structures"
        },
        "severe_damage": {
            "radius": blast_radius * 2,
            "description": "Severe structural damage, most buildings uninhabitable"
        },
        "moderate_damage": {
            "radius": thermal_radius,
            "description": "Moderate damage, fires, some structural damage"
        },
        "minor_damage": {
            "radius": seismic_radius,
            "description": "Minor damage, broken windows, ground shaking"
        }
    }