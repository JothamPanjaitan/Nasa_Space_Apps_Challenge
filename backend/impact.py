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
