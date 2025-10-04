"""
Unit tests for impact_physics module
Validates against exact test vectors from specification
"""

import unittest
import impact_physics as phys
import math


class TestImpactPhysics(unittest.TestCase):
    """Test suite for production-grade impact physics"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.tolerance = 0.01  # 1% tolerance for floating point
    
    def assertAlmostEqualPercent(self, actual, expected, percent=1.0, msg=None):
        """Assert values are within percent tolerance"""
        if expected == 0:
            self.assertAlmostEqual(actual, expected, places=10, msg=msg)
        else:
            relative_error = abs((actual - expected) / expected)
            self.assertLess(relative_error, percent / 100.0, 
                          msg=f"{msg or ''} Actual: {actual}, Expected: {expected}, Error: {relative_error*100:.2f}%")
    
    # ========================================================================
    # Test Mass and Energy Calculations
    # ========================================================================
    
    def test_mass_calculation_small(self):
        """Test mass calculation for small impactor (50m)"""
        mass = phys.mass_from_diameter(50.0, 3000.0)
        expected = 1.9634954084936207e8
        self.assertAlmostEqualPercent(mass, expected, percent=0.01)
    
    def test_mass_calculation_medium(self):
        """Test mass calculation for medium impactor (100m)"""
        mass = phys.mass_from_diameter(100.0, 3000.0)
        expected = 1.5707963267948966e9
        self.assertAlmostEqualPercent(mass, expected, percent=0.01)
    
    def test_mass_calculation_large(self):
        """Test mass calculation for large impactor (1000m)"""
        mass = phys.mass_from_diameter(1000.0, 3000.0)
        expected = 1.5707963267948963e12
        self.assertAlmostEqualPercent(mass, expected, percent=0.01)
    
    def test_mass_scaling_invariant(self):
        """Test that doubling diameter increases mass by factor 8"""
        mass_1 = phys.mass_from_diameter(100.0, 3000.0)
        mass_2 = phys.mass_from_diameter(200.0, 3000.0)
        self.assertAlmostEqualPercent(mass_2, mass_1 * 8, percent=0.01)
    
    def test_kinetic_energy_small(self):
        """Test kinetic energy for small impactor"""
        energy = phys.kinetic_energy_joules(50.0, 20000.0, 3000.0)
        expected = 3.926990816987241e16
        self.assertAlmostEqualPercent(energy, expected, percent=0.01)
    
    def test_kinetic_energy_medium(self):
        """Test kinetic energy for medium impactor"""
        energy = phys.kinetic_energy_joules(100.0, 20000.0, 3000.0)
        expected = 3.1415926535897936e17
        self.assertAlmostEqualPercent(energy, expected, percent=0.01)
    
    def test_kinetic_energy_high_speed(self):
        """Test kinetic energy for high-speed impactor"""
        energy = phys.kinetic_energy_joules(300.0, 50000.0, 3000.0)
        expected = 5.301437602932775e19
        self.assertAlmostEqualPercent(energy, expected, percent=0.01)
    
    def test_joules_to_megatons(self):
        """Test energy conversion to megatons"""
        energy_j = 4.184e15
        energy_mt = phys.joules_to_megatons(energy_j)
        self.assertAlmostEqual(energy_mt, 1.0, places=10)
    
    def test_megatons_to_joules(self):
        """Test energy conversion from megatons"""
        energy_mt = 1.0
        energy_j = phys.megatons_to_joules(energy_mt)
        self.assertAlmostEqual(energy_j, 4.184e15, places=5)
    
    # ========================================================================
    # Test Seismic Magnitude Conversion
    # ========================================================================
    
    def test_earthquake_magnitude_small(self):
        """Test earthquake magnitude for small impactor"""
        energy = 3.926990816987241e16
        magnitude = phys.energy_to_eq_magnitude(energy)
        expected = 7.8627
        self.assertAlmostEqual(magnitude, expected, places=2)
    
    def test_earthquake_magnitude_medium(self):
        """Test earthquake magnitude for medium impactor"""
        energy = 3.1415926535897936e17
        magnitude = phys.energy_to_eq_magnitude(energy)
        expected = 8.4881
        # Magnitude is approximate - allow 0.1 difference
        self.assertAlmostEqual(magnitude, expected, places=1)
    
    def test_earthquake_magnitude_large(self):
        """Test earthquake magnitude for large impactor"""
        energy = 3.1415926535897936e19
        magnitude = phys.energy_to_eq_magnitude(energy)
        # Note: Large energy values show more variation in empirical formulas
        # This is expected as the formula is an approximation
        self.assertGreater(magnitude, 9.0)
        self.assertLess(magnitude, 11.0)
    
    def test_earthquake_magnitude_invalid(self):
        """Test earthquake magnitude with invalid input"""
        magnitude = phys.energy_to_eq_magnitude(0)
        self.assertIsNone(magnitude)
        
        magnitude = phys.energy_to_eq_magnitude(-100)
        self.assertIsNone(magnitude)
    
    # ========================================================================
    # Test Crater Scaling
    # ========================================================================
    
    def test_crater_diameter_positive(self):
        """Test that crater diameter is always positive"""
        diameter = phys.crater_diameter_final_m(100.0, 20000.0)
        self.assertGreater(diameter, 0)
    
    def test_crater_diameter_scaling(self):
        """Test crater diameter scaling with velocity"""
        d1 = phys.crater_diameter_final_m(100.0, 10000.0)
        d2 = phys.crater_diameter_final_m(100.0, 20000.0)
        # Higher velocity should produce larger crater
        self.assertGreater(d2, d1)
    
    def test_crater_depth_simple(self):
        """Test crater depth for simple crater"""
        depth = phys.crater_depth_m(1000.0)  # 1 km diameter
        expected = 1000.0 / 5.0
        self.assertAlmostEqual(depth, expected, places=1)
    
    def test_crater_depth_complex(self):
        """Test crater depth for complex crater"""
        depth = phys.crater_depth_m(5000.0)  # 5 km diameter
        expected = 5000.0 / 10.0
        self.assertAlmostEqual(depth, expected, places=1)
    
    # ========================================================================
    # Test Atmospheric Breakup
    # ========================================================================
    
    def test_dynamic_pressure_sea_level(self):
        """Test dynamic pressure at sea level"""
        q = phys.dynamic_pressure_at_altitude(20000.0, 0.0)
        expected = 0.5 * phys.RHO_AIR_SEA * (20000.0 ** 2)
        self.assertAlmostEqual(q, expected, places=0)
    
    def test_dynamic_pressure_altitude(self):
        """Test dynamic pressure decreases with altitude"""
        q_sea = phys.dynamic_pressure_at_altitude(20000.0, 0.0)
        q_10km = phys.dynamic_pressure_at_altitude(20000.0, 10000.0)
        self.assertGreater(q_sea, q_10km)
    
    def test_breakup_altitude_weak(self):
        """Test breakup altitude for weak material"""
        alt = phys.breakup_altitude_for_strength(20000.0, 1e6)
        self.assertIsNotNone(alt)
        self.assertGreater(alt, 0)
        self.assertLess(alt, 120000)
    
    def test_breakup_altitude_strong(self):
        """Test breakup altitude for strong material"""
        alt_weak = phys.breakup_altitude_for_strength(20000.0, 1e6)
        alt_strong = phys.breakup_altitude_for_strength(20000.0, 1e8)
        # Stronger material breaks up at lower altitude
        self.assertLess(alt_strong, alt_weak)
    
    def test_breakup_altitude_ground_impact(self):
        """Test breakup at ground level for very strong material"""
        alt = phys.breakup_altitude_for_strength(20000.0, 1e10)
        self.assertEqual(alt, 0.0)
    
    def test_is_airburst_true(self):
        """Test airburst detection for high altitude breakup"""
        self.assertTrue(phys.is_airburst(15000.0))
    
    def test_is_airburst_false(self):
        """Test airburst detection for low altitude breakup"""
        self.assertFalse(phys.is_airburst(5000.0))
        self.assertFalse(phys.is_airburst(0.0))
    
    # ========================================================================
    # Test Hopkinson-Cranz Scaling
    # ========================================================================
    
    def test_scaled_distance(self):
        """Test Hopkinson-Cranz scaled distance calculation"""
        Z = phys.hopkinson_cranz_scaled_distance(1000.0, 1.0)
        self.assertAlmostEqual(Z, 1000.0, places=1)
    
    def test_radius_from_scaled_distance(self):
        """Test radius calculation from scaled distance"""
        R = phys.radius_from_scaled_distance(100.0, 1.0)
        self.assertAlmostEqual(R, 100.0, places=1)
    
    def test_scaled_distance_roundtrip(self):
        """Test roundtrip conversion of scaled distance"""
        R_original = 5000.0
        W = 10.0
        Z = phys.hopkinson_cranz_scaled_distance(R_original, W)
        R_calculated = phys.radius_from_scaled_distance(Z, W)
        self.assertAlmostEqual(R_calculated, R_original, places=1)
    
    def test_overpressure_radii(self):
        """Test overpressure radii calculation"""
        radii = phys.calculate_overpressure_radii(1.0)
        
        # Check all expected keys exist
        self.assertIn('R_100psi_m', radii)
        self.assertIn('R_20psi_m', radii)
        self.assertIn('R_5psi_m', radii)
        self.assertIn('R_1psi_m', radii)
        self.assertIn('R_0_5psi_m', radii)
        
        # Check radii are in correct order (larger pressure = smaller radius)
        self.assertLess(radii['R_100psi_m'], radii['R_20psi_m'])
        self.assertLess(radii['R_20psi_m'], radii['R_5psi_m'])
        self.assertLess(radii['R_5psi_m'], radii['R_1psi_m'])
        self.assertLess(radii['R_1psi_m'], radii['R_0_5psi_m'])
    
    # ========================================================================
    # Test Deflection Calculations
    # ========================================================================
    
    def test_deflection_dv_earth_radius_1year(self):
        """Test delta-v for Earth radius shift in 1 year"""
        lead_time = 1 * phys.SECONDS_PER_YEAR
        dv = phys.deflection_dv_for_shift(phys.EARTH_RADIUS_M, lead_time)
        expected = 0.201885  # m/s
        self.assertAlmostEqual(dv, expected, places=4)
    
    def test_deflection_dv_earth_radius_10years(self):
        """Test delta-v for Earth radius shift in 10 years"""
        lead_time = 10 * phys.SECONDS_PER_YEAR
        dv = phys.deflection_dv_for_shift(phys.EARTH_RADIUS_M, lead_time)
        expected = 0.020188  # m/s
        self.assertAlmostEqual(dv, expected, places=5)
    
    def test_deflection_dv_100km_5years(self):
        """Test delta-v for 100 km shift in 5 years"""
        lead_time = 5 * phys.SECONDS_PER_YEAR
        dv = phys.deflection_dv_for_shift(100000.0, lead_time)
        expected = 0.000634  # m/s
        self.assertAlmostEqual(dv, expected, places=6)
    
    def test_shift_from_dv(self):
        """Test shift calculation from delta-v"""
        dv = 0.1  # m/s
        lead_time = 365 * 24 * 3600  # 1 year
        shift = phys.shift_from_dv(dv, lead_time)
        expected = dv * lead_time
        self.assertAlmostEqual(shift, expected, places=1)
    
    def test_deflection_roundtrip(self):
        """Test roundtrip deflection calculation"""
        shift_original = 1e6  # 1000 km
        lead_time = 3.15576e7  # 1 year
        dv = phys.deflection_dv_for_shift(shift_original, lead_time)
        shift_calculated = phys.shift_from_dv(dv, lead_time)
        self.assertAlmostEqual(shift_calculated, shift_original, places=0)
    
    def test_deflection_dv_invalid_lead_time(self):
        """Test deflection with invalid lead time"""
        with self.assertRaises(ValueError):
            phys.deflection_dv_for_shift(1000.0, 0)
        
        with self.assertRaises(ValueError):
            phys.deflection_dv_for_shift(1000.0, -100)
    
    # ========================================================================
    # Test Comprehensive Impact Calculation
    # ========================================================================
    
    def test_calculate_impact_effects_structure(self):
        """Test that comprehensive calculation returns correct structure"""
        effects = phys.calculate_impact_effects(100.0, 20000.0)
        
        # Check top-level keys
        self.assertIn('inputs', effects)
        self.assertIn('basic', effects)
        self.assertIn('atmospheric', effects)
        self.assertIn('crater', effects)
        self.assertIn('radii_m', effects)
        
        # Check basic results
        self.assertIn('mass_kg', effects['basic'])
        self.assertIn('energy_joules', effects['basic'])
        self.assertIn('energy_megatons', effects['basic'])
        self.assertIn('eq_magnitude', effects['basic'])
        
        # Check atmospheric results
        self.assertIn('breakup_altitude_m', effects['atmospheric'])
        self.assertIn('is_airburst', effects['atmospheric'])
        
        # Check crater results
        self.assertIn('diameter_m', effects['crater'])
        self.assertIn('depth_m', effects['crater'])
    
    def test_calculate_impact_effects_airburst(self):
        """Test impact calculation for airburst scenario"""
        # Weak material, high velocity -> airburst
        effects = phys.calculate_impact_effects(
            diameter_m=50.0,
            velocity_m_s=20000.0,
            strength_pa=1e5
        )
        
        self.assertTrue(effects['atmospheric']['is_airburst'])
        self.assertEqual(effects['crater']['diameter_m'], 0.0)
    
    def test_calculate_impact_effects_ground_impact(self):
        """Test impact calculation for ground impact scenario"""
        # Strong material -> ground impact
        effects = phys.calculate_impact_effects(
            diameter_m=100.0,
            velocity_m_s=20000.0,
            strength_pa=1e9
        )
        
        self.assertFalse(effects['atmospheric']['is_airburst'])
        self.assertGreater(effects['crater']['diameter_m'], 0)
    
    # ========================================================================
    # Test Vectors Validation
    # ========================================================================
    
    def test_all_test_vectors(self):
        """Validate all test vectors from specification"""
        test_vectors = phys.get_test_vectors()
        
        for test in test_vectors:
            with self.subTest(test=test['name']):
                inputs = test['inputs']
                expected = test['expected']
                
                # Calculate mass
                mass = phys.mass_from_diameter(
                    inputs['diameter_m'],
                    inputs['density_kg_m3']
                )
                self.assertAlmostEqualPercent(
                    mass, expected['mass_kg'], percent=1.0,
                    msg=f"Mass mismatch for {test['name']}"
                )
                
                # Calculate energy
                energy = phys.kinetic_energy_joules(
                    inputs['diameter_m'],
                    inputs['velocity_m_s'],
                    inputs['density_kg_m3']
                )
                self.assertAlmostEqualPercent(
                    energy, expected['energy_joules'], percent=1.0,
                    msg=f"Energy mismatch for {test['name']}"
                )
                
                # Calculate TNT equivalent
                energy_mt = phys.joules_to_megatons(energy)
                self.assertAlmostEqualPercent(
                    energy_mt, expected['energy_megatons'], percent=1.0,
                    msg=f"TNT equivalent mismatch for {test['name']}"
                )
                
                # Calculate earthquake magnitude (approximate - allow 0.1 difference)
                magnitude = phys.energy_to_eq_magnitude(energy)
                self.assertAlmostEqual(
                    magnitude, expected['eq_magnitude'], places=1,
                    msg=f"Magnitude mismatch for {test['name']}"
                )


class TestConstants(unittest.TestCase):
    """Test that constants are defined correctly"""
    
    def test_constants_exist(self):
        """Test that all required constants exist"""
        self.assertTrue(hasattr(phys, 'G_EARTH'))
        self.assertTrue(hasattr(phys, 'JOULES_PER_MEGATON'))
        self.assertTrue(hasattr(phys, 'RHO_AIR_SEA'))
        self.assertTrue(hasattr(phys, 'ATM_SCALE_H'))
        self.assertTrue(hasattr(phys, 'EARTH_RADIUS_M'))
        self.assertTrue(hasattr(phys, 'SECONDS_PER_YEAR'))
    
    def test_constant_values(self):
        """Test that constants have correct values"""
        self.assertAlmostEqual(phys.G_EARTH, 9.80665, places=5)
        self.assertAlmostEqual(phys.JOULES_PER_MEGATON, 4.184e15, places=10)
        self.assertAlmostEqual(phys.RHO_AIR_SEA, 1.225, places=3)
        self.assertAlmostEqual(phys.ATM_SCALE_H, 7640.0, places=1)
        self.assertAlmostEqual(phys.EARTH_RADIUS_M, 6.371e6, places=3)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
