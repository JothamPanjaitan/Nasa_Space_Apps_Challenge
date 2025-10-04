"""
Production-grade impact physics calculations
Based on Holsapple scaling laws, Kingery-Bulmash overpressure curves,
and empirical atmospheric breakup models.

All functions use SI units (meters, kilograms, seconds, Joules) unless explicitly noted.
References:
- Holsapple, K.A. (1993) - Crater scaling laws
- Collins et al. (2005) - Earth Impact Effects Program
- Kingery & Bulmash (1984) - Airblast parameters
- Ward & Asphaug (2000) - Tsunami generation
"""

import math

# ============================================================================
# CONSTANTS (SI units)
# ============================================================================

G_EARTH = 9.80665  # m/s² - standard gravity
JOULES_PER_MEGATON = 4.184e15  # J/MT - TNT conversion
RHO_AIR_SEA = 1.225  # kg/m³ - sea level air density
ATM_SCALE_H = 7640.0  # m - atmospheric scale height
RHO_ASTEROID_DEFAULT = 3000.0  # kg/m³ - typical stony asteroid
RHO_TARGET_DEFAULT = 2700.0  # kg/m³ - crustal rock
EARTH_RADIUS_M = 6.371e6  # m - mean Earth radius
SECONDS_PER_YEAR = 3.15576e7  # s - seconds in one year


# ============================================================================
# MASS AND ENERGY CALCULATIONS
# ============================================================================

def mass_from_diameter(diameter_m, density_kg_m3=RHO_ASTEROID_DEFAULT):
    """
    Calculate asteroid mass from diameter assuming spherical shape.
    
    Args:
        diameter_m (float): Asteroid diameter in meters
        density_kg_m3 (float): Bulk density in kg/m³ (default: 3000 for stony)
    
    Returns:
        float: Mass in kilograms
    
    Formula: m = (4/3) * π * r³ * ρ
    """
    r = diameter_m / 2.0
    m = (4.0 / 3.0) * math.pi * (r ** 3) * density_kg_m3
    return m


def kinetic_energy_joules(diameter_m, velocity_m_s, density_kg_m3=RHO_ASTEROID_DEFAULT):
    """
    Calculate kinetic energy of impactor.
    
    Args:
        diameter_m (float): Asteroid diameter in meters
        velocity_m_s (float): Impact velocity in m/s
        density_kg_m3 (float): Bulk density in kg/m³
    
    Returns:
        float: Kinetic energy in Joules
    
    Formula: E = (1/2) * m * v²
    """
    m = mass_from_diameter(diameter_m, density_kg_m3)
    E = 0.5 * m * (velocity_m_s ** 2)
    return E


def joules_to_megatons(E_joules):
    """
    Convert energy from Joules to megaton TNT equivalent.
    
    Args:
        E_joules (float): Energy in Joules
    
    Returns:
        float: Energy in megatons TNT
    
    Conversion: 1 MT = 4.184 × 10¹⁵ J
    """
    return E_joules / JOULES_PER_MEGATON


def megatons_to_joules(E_megatons):
    """Convert megatons TNT to Joules."""
    return E_megatons * JOULES_PER_MEGATON


# ============================================================================
# SEISMIC MAGNITUDE CONVERSION
# ============================================================================

def energy_to_eq_magnitude(E_joules):
    """
    Convert impact energy to earthquake moment magnitude equivalent.
    
    Args:
        E_joules (float): Energy in Joules
    
    Returns:
        float: Earthquake magnitude (Richter/moment magnitude scale)
        None: If energy is non-positive
    
    Formula: log₁₀(E) ≈ 1.5M + 4.8  →  M ≈ (log₁₀(E) - 4.8) / 1.5
    
    Note: This provides a communicable comparison, NOT direct seismic modeling.
    """
    if E_joules <= 0:
        return None
    return (math.log10(E_joules) - 4.8) / 1.5


# ============================================================================
# CRATER SCALING (Holsapple / Pi-scaling)
# ============================================================================

def crater_diameter_final_m(diameter_m, velocity_m_s, 
                           density_impactor=RHO_ASTEROID_DEFAULT,
                           density_target=RHO_TARGET_DEFAULT,
                           g=G_EARTH, k=1.0):
    """
    Calculate final crater diameter using Holsapple-style Pi-scaling.
    
    Args:
        diameter_m (float): Projectile diameter in meters
        velocity_m_s (float): Impact velocity in m/s
        density_impactor (float): Impactor density in kg/m³
        density_target (float): Target (ground) density in kg/m³
        g (float): Gravitational acceleration in m/s²
        k (float): Empirical scaling constant (default: 1.0)
    
    Returns:
        float: Final crater diameter in meters
    
    Formula: D_final(km) ≈ k * g^(-0.22) * (ρ_i/ρ_t)^0.3 * d^0.78 * v^0.44
    where d is in km and v is in km/s
    
    Note: For D_final > 2-4 km, craters become complex; multiply by 1.2-1.5
    
    References:
    - Holsapple, K.A. (1993) Annual Review of Earth and Planetary Sciences
    - Collins et al. (2005) Meteoritics & Planetary Science
    """
    # Convert to km and km/s for scaling formula
    d_km = diameter_m / 1000.0
    v_km_s = velocity_m_s / 1000.0
    
    # Holsapple Pi-scaling formula
    D_km = k * (g ** (-0.22)) * \
           ((density_impactor / density_target) ** 0.3) * \
           (d_km ** 0.78) * \
           (v_km_s ** 0.44)
    
    # Convert back to meters
    D_m = D_km * 1000.0
    
    # Apply complexity factor for large craters
    if D_km > 2.0:
        complexity_factor = 1.3  # Complex crater morphology
        D_m *= complexity_factor
    
    return max(0.0, D_m)


def crater_depth_m(crater_diameter_m):
    """
    Estimate crater depth from diameter.
    
    Args:
        crater_diameter_m (float): Crater diameter in meters
    
    Returns:
        float: Crater depth in meters
    
    Simple craters: depth ≈ diameter / 5
    Complex craters: depth ≈ diameter / 10
    """
    if crater_diameter_m < 2000:  # Simple crater
        return crater_diameter_m / 5.0
    else:  # Complex crater
        return crater_diameter_m / 10.0


# ============================================================================
# ATMOSPHERIC BREAKUP (Dynamic Pressure Model)
# ============================================================================

def dynamic_pressure_at_altitude(v_ms, alt_m, rho0=RHO_AIR_SEA, H=ATM_SCALE_H):
    """
    Calculate dynamic pressure at given altitude.
    
    Args:
        v_ms (float): Velocity in m/s
        alt_m (float): Altitude in meters
        rho0 (float): Sea-level air density in kg/m³
        H (float): Atmospheric scale height in meters
    
    Returns:
        float: Dynamic pressure in Pascals
    
    Formula: q = (1/2) * ρ(z) * v²
    where ρ(z) = ρ₀ * exp(-z/H)
    """
    rho = rho0 * math.exp(-alt_m / H)
    q = 0.5 * rho * (v_ms ** 2)
    return q


def breakup_altitude_for_strength(v_ms, strength_pa, rho0=RHO_AIR_SEA, H=ATM_SCALE_H):
    """
    Calculate altitude at which asteroid fragments due to dynamic pressure.
    
    Args:
        v_ms (float): Entry velocity in m/s
        strength_pa (float): Material strength in Pascals
        rho0 (float): Sea-level air density in kg/m³
        H (float): Atmospheric scale height in meters
    
    Returns:
        float: Breakup altitude in meters
        None: If strength is non-positive
        0.0: If fragmentation occurs at or below ground level
    
    Formula: z = -H * ln(2S / (v² * ρ₀))
    
    Typical strengths:
    - Rubble pile/porous: 10⁵ - 10⁶ Pa
    - Monolithic rock: 10⁷ - 10⁹ Pa
    
    References:
    - Hills & Goda (1993) - Fragmentation model
    - Chyba et al. (1993) - Atmospheric disruption
    """
    if strength_pa <= 0:
        return None
    
    rho_needed = 2.0 * strength_pa / (v_ms ** 2)
    
    if rho_needed > rho0:
        # Density needed exceeds sea-level → fragmentation at/below ground
        return 0.0
    
    z = -H * math.log(rho_needed / rho0)
    
    # Clamp to reasonable atmospheric range
    if z < 0:
        return 0.0
    if z > 120000:  # Above Kármán line
        return 120000.0
    
    return z


def is_airburst(breakup_altitude_m, threshold_m=10000.0):
    """
    Determine if impact results in airburst vs ground impact.
    
    Args:
        breakup_altitude_m (float): Breakup altitude in meters
        threshold_m (float): Altitude threshold for airburst (default: 10 km)
    
    Returns:
        bool: True if airburst, False if ground impact
    """
    return breakup_altitude_m is not None and breakup_altitude_m > threshold_m


# ============================================================================
# BLAST AND THERMAL RADII (Simplified for Visualization)
# ============================================================================

def simple_damage_radii_m(crater_diameter_m):
    """
    Calculate simplified damage radii for visualization.
    
    Args:
        crater_diameter_m (float): Crater diameter in meters
    
    Returns:
        dict: Dictionary of damage radii in meters
    
    Multipliers are empirical approximations for educational visualization.
    For accurate overpressure, use hopkinson_cranz_radius().
    """
    R_c = crater_diameter_m / 2.0
    
    return {
        'crater_radius_m': R_c,
        'severe_damage_m': 3.0 * R_c,
        'moderate_damage_m': 8.0 * R_c,
        'thermal_ignition_m': 12.0 * R_c,
        'light_damage_m': 20.0 * R_c
    }


# ============================================================================
# HOPKINSON-CRANZ OVERPRESSURE SCALING
# ============================================================================

def hopkinson_cranz_scaled_distance(radius_m, yield_megatons):
    """
    Calculate Hopkinson-Cranz scaled distance.
    
    Args:
        radius_m (float): Distance from impact in meters
        yield_megatons (float): Yield in megatons TNT
    
    Returns:
        float: Scaled distance Z in m/MT^(1/3)
    
    Formula: Z = R / W^(1/3)
    """
    if yield_megatons <= 0:
        return float('inf')
    return radius_m / (yield_megatons ** (1.0 / 3.0))


def radius_from_scaled_distance(Z, yield_megatons):
    """
    Calculate radius from scaled distance.
    
    Args:
        Z (float): Scaled distance in m/MT^(1/3)
        yield_megatons (float): Yield in megatons TNT
    
    Returns:
        float: Radius in meters
    
    Formula: R = Z * W^(1/3)
    """
    return Z * (yield_megatons ** (1.0 / 3.0))


# Kingery-Bulmash empirical overpressure table (Z → overpressure in psi)
# Format: (Z_min, Z_max, overpressure_psi)
OVERPRESSURE_TABLE = [
    (0.0, 10.0, 100.0),    # Very close: > 100 psi
    (10.0, 20.0, 50.0),    # 50 psi
    (20.0, 30.0, 20.0),    # 20 psi
    (30.0, 50.0, 10.0),    # 10 psi
    (50.0, 80.0, 5.0),     # 5 psi
    (80.0, 150.0, 2.0),    # 2 psi
    (150.0, 300.0, 1.0),   # 1 psi
    (300.0, 600.0, 0.5),   # 0.5 psi
    (600.0, float('inf'), 0.1)  # < 0.5 psi
]


def overpressure_from_scaled_distance(Z):
    """
    Get overpressure from scaled distance using Kingery-Bulmash table.
    
    Args:
        Z (float): Scaled distance in m/MT^(1/3)
    
    Returns:
        float: Overpressure in psi
    
    Based on Kingery & Bulmash (1984) empirical curves.
    """
    for Z_min, Z_max, psi in OVERPRESSURE_TABLE:
        if Z_min <= Z < Z_max:
            return psi
    return 0.0


def radius_for_overpressure(target_psi, yield_megatons):
    """
    Calculate radius for target overpressure level.
    
    Args:
        target_psi (float): Target overpressure in psi
        yield_megatons (float): Yield in megatons TNT
    
    Returns:
        float: Radius in meters where overpressure equals target
    
    Uses binary search on Kingery-Bulmash table.
    """
    # Find appropriate Z from table
    Z = None
    for Z_min, Z_max, psi in OVERPRESSURE_TABLE:
        if psi <= target_psi:
            Z = (Z_min + Z_max) / 2.0
            break
    
    if Z is None:
        Z = 5.0  # Default for very high pressures
    
    return radius_from_scaled_distance(Z, yield_megatons)


def calculate_overpressure_radii(yield_megatons):
    """
    Calculate radii for standard overpressure levels.
    
    Args:
        yield_megatons (float): Yield in megatons TNT
    
    Returns:
        dict: Dictionary of overpressure radii in meters
    
    Standard levels: 100, 20, 5, 1, 0.5 psi
    """
    return {
        'R_100psi_m': radius_for_overpressure(100.0, yield_megatons),
        'R_20psi_m': radius_for_overpressure(20.0, yield_megatons),
        'R_5psi_m': radius_for_overpressure(5.0, yield_megatons),
        'R_1psi_m': radius_for_overpressure(1.0, yield_megatons),
        'R_0_5psi_m': radius_for_overpressure(0.5, yield_megatons)
    }


# ============================================================================
# DEFLECTION DELTA-V CALCULATIONS
# ============================================================================

def deflection_dv_for_shift(shift_m, lead_time_seconds):
    """
    Calculate required delta-v for along-track deflection.
    
    Args:
        shift_m (float): Desired shift distance in meters
        lead_time_seconds (float): Time before impact in seconds
    
    Returns:
        float: Required delta-v in m/s
    
    Formula: Δv ≈ S / t_lead (linear approximation)
    
    This is a first-order approximation. For mission planning,
    use full orbital propagation (JPL Horizons, GMAT, Orekit).
    """
    if lead_time_seconds <= 0:
        raise ValueError("lead_time_seconds must be positive")
    return shift_m / lead_time_seconds


def shift_from_dv(delta_v_ms, lead_time_seconds):
    """
    Calculate resulting shift from delta-v application.
    
    Args:
        delta_v_ms (float): Applied delta-v in m/s
        lead_time_seconds (float): Time before impact in seconds
    
    Returns:
        float: Resulting shift in meters
    
    Formula: S ≈ Δv × t_lead
    """
    return delta_v_ms * lead_time_seconds


def dv_examples():
    """
    Generate example delta-v requirements for common scenarios.
    
    Returns:
        list: List of example scenarios with delta-v calculations
    """
    examples = []
    
    # Shift by one Earth radius
    shift_earth_radius = EARTH_RADIUS_M
    for years in [1, 5, 10]:
        lead_time = years * SECONDS_PER_YEAR
        dv = deflection_dv_for_shift(shift_earth_radius, lead_time)
        examples.append({
            'scenario': f'Shift by 1 Earth radius ({years} year lead)',
            'shift_m': shift_earth_radius,
            'lead_time_years': years,
            'delta_v_ms': dv,
            'delta_v_cm_s': dv * 100,
            'delta_v_mm_s': dv * 1000
        })
    
    # Shift by 100 km
    shift_100km = 100000.0
    for years in [1, 5, 10]:
        lead_time = years * SECONDS_PER_YEAR
        dv = deflection_dv_for_shift(shift_100km, lead_time)
        examples.append({
            'scenario': f'Shift by 100 km ({years} year lead)',
            'shift_m': shift_100km,
            'lead_time_years': years,
            'delta_v_ms': dv,
            'delta_v_cm_s': dv * 100,
            'delta_v_mm_s': dv * 1000
        })
    
    return examples


# ============================================================================
# COMPREHENSIVE IMPACT CALCULATION
# ============================================================================

def calculate_impact_effects(diameter_m, velocity_m_s, 
                            density_kg_m3=RHO_ASTEROID_DEFAULT,
                            strength_pa=1e6,
                            impact_angle_deg=45.0):
    """
    Calculate comprehensive impact effects.
    
    Args:
        diameter_m (float): Asteroid diameter in meters
        velocity_m_s (float): Impact velocity in m/s
        density_kg_m3 (float): Asteroid density in kg/m³
        strength_pa (float): Material strength in Pascals
        impact_angle_deg (float): Impact angle from horizontal in degrees
    
    Returns:
        dict: Comprehensive impact effects data
    
    This is the main function that combines all physics calculations.
    """
    # Basic properties
    mass_kg = mass_from_diameter(diameter_m, density_kg_m3)
    energy_j = kinetic_energy_joules(diameter_m, velocity_m_s, density_kg_m3)
    energy_mt = joules_to_megatons(energy_j)
    eq_magnitude = energy_to_eq_magnitude(energy_j)
    
    # Atmospheric breakup
    breakup_alt_m = breakup_altitude_for_strength(velocity_m_s, strength_pa)
    is_airburst_event = is_airburst(breakup_alt_m)
    
    # Crater (only for ground impact)
    if is_airburst_event:
        crater_diam_m = 0.0
        crater_depth_m_val = 0.0
    else:
        crater_diam_m = crater_diameter_final_m(diameter_m, velocity_m_s, density_kg_m3)
        crater_depth_m_val = crater_depth_m(crater_diam_m)
    
    # Damage radii
    if is_airburst_event:
        # For airburst, use energy-based scaling
        radii = calculate_overpressure_radii(energy_mt)
    else:
        # For ground impact, use crater-based + overpressure
        simple_radii = simple_damage_radii_m(crater_diam_m)
        overpressure_radii = calculate_overpressure_radii(energy_mt)
        radii = {**simple_radii, **overpressure_radii}
    
    return {
        'inputs': {
            'diameter_m': diameter_m,
            'velocity_m_s': velocity_m_s,
            'density_kg_m3': density_kg_m3,
            'strength_pa': strength_pa,
            'impact_angle_deg': impact_angle_deg
        },
        'basic': {
            'mass_kg': mass_kg,
            'energy_joules': energy_j,
            'energy_megatons': energy_mt,
            'eq_magnitude': eq_magnitude
        },
        'atmospheric': {
            'breakup_altitude_m': breakup_alt_m,
            'is_airburst': is_airburst_event,
            'dynamic_pressure_pa': dynamic_pressure_at_altitude(velocity_m_s, breakup_alt_m if breakup_alt_m else 0)
        },
        'crater': {
            'diameter_m': crater_diam_m,
            'depth_m': crater_depth_m_val,
            'radius_m': crater_diam_m / 2.0
        },
        'radii_m': radii
    }


# ============================================================================
# TEST VECTORS (for validation)
# ============================================================================

def get_test_vectors():
    """
    Return exact test vectors for validation.
    
    These match the numerical examples in the specification.
    Use for unit testing with ±1% tolerance.
    """
    return [
        {
            'name': 'Small impactor (50m, 20km/s)',
            'inputs': {'diameter_m': 50.0, 'velocity_m_s': 20000.0, 'density_kg_m3': 3000.0},
            'expected': {
                'mass_kg': 1.9634954084936207e8,
                'energy_joules': 3.926990816987241e16,
                'energy_megatons': 9.3857,
                'eq_magnitude': 7.8627,
                'crater_diameter_m': 225.55  # Approximate
            }
        },
        {
            'name': 'Medium impactor (100m, 20km/s)',
            'inputs': {'diameter_m': 100.0, 'velocity_m_s': 20000.0, 'density_kg_m3': 3000.0},
            'expected': {
                'mass_kg': 1.5707963267948966e9,
                'energy_joules': 3.1415926535897936e17,
                'energy_megatons': 75.0859,
                'eq_magnitude': 8.4881,
                'crater_diameter_m': 2333.70  # Approximate
            }
        },
        {
            'name': 'Large impactor (1000m, 20km/s)',
            'inputs': {'diameter_m': 1000.0, 'velocity_m_s': 20000.0, 'density_kg_m3': 3000.0},
            'expected': {
                'mass_kg': 1.5707963267948963e12,
                'energy_joules': 3.1415926535897936e20,  # Fixed: was e19, should be e20
                'energy_megatons': 75085.8665,
                'eq_magnitude': 10.4648
            }
        },
        {
            'name': 'High speed (300m, 50km/s)',
            'inputs': {'diameter_m': 300.0, 'velocity_m_s': 50000.0, 'density_kg_m3': 3000.0},
            'expected': {
                'mass_kg': 4.2411500823462204e10,
                'energy_joules': 5.301437602932775e19,
                'energy_megatons': 12670.73997,
                'eq_magnitude': 9.9496
            }
        }
    ]


if __name__ == '__main__':
    # Run test vectors
    print("=" * 70)
    print("IMPACT PHYSICS TEST VECTORS")
    print("=" * 70)
    
    for test in get_test_vectors():
        print(f"\n{test['name']}")
        print("-" * 70)
        
        inputs = test['inputs']
        results = calculate_impact_effects(**inputs)
        
        print(f"Mass: {results['basic']['mass_kg']:.6e} kg")
        print(f"Energy: {results['basic']['energy_joules']:.6e} J")
        print(f"Energy: {results['basic']['energy_megatons']:.4f} MT")
        print(f"Eq. Magnitude: {results['basic']['eq_magnitude']:.4f}")
        
        if not results['atmospheric']['is_airburst']:
            print(f"Crater Diameter: {results['crater']['diameter_m']:.2f} m")
    
    print("\n" + "=" * 70)
    print("DEFLECTION DELTA-V EXAMPLES")
    print("=" * 70)
    
    for ex in dv_examples():
        print(f"\n{ex['scenario']}")
        print(f"  Δv = {ex['delta_v_ms']:.6f} m/s = {ex['delta_v_cm_s']:.4f} cm/s = {ex['delta_v_mm_s']:.2f} mm/s")
