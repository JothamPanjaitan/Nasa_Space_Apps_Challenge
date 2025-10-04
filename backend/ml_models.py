"""
Machine Learning models for asteroid impact prediction and deflection optimization
"""

import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
from datetime import datetime

class ImpactPredictor:
    """ML model for predicting impact effects based on asteroid parameters"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def create_training_data(self, n_samples=10000):
        """Generate synthetic training data for impact prediction"""
        np.random.seed(42)
        
        # Generate random asteroid parameters
        diameters = np.random.uniform(10, 1000, n_samples)  # meters
        velocities = np.random.uniform(5000, 50000, n_samples)  # m/s
        densities = np.random.uniform(1000, 5000, n_samples)  # kg/m³
        impact_angles = np.random.uniform(0, 90, n_samples)  # degrees
        
        # Calculate features
        masses = (4/3) * np.pi * (diameters/2)**3 * densities
        kinetic_energies = 0.5 * masses * velocities**2
        
        # Calculate target variables (impact effects)
        tnt_equivalents = kinetic_energies / 4.184e9  # Convert to tons TNT
        crater_diameters = diameters * (1.61 * (densities/2700)**(1/3) * (velocities/1000)**(2/3))
        earthquake_magnitudes = np.maximum(0, (np.log10(kinetic_energies) - 4.8) / 1.5)
        
        # Add some noise for realism
        crater_diameters += np.random.normal(0, crater_diameters * 0.1, n_samples)
        earthquake_magnitudes += np.random.normal(0, 0.5, n_samples)
        
        # Features: diameter, velocity, density, mass, kinetic_energy, impact_angle
        X = np.column_stack([
            diameters,
            velocities,
            densities,
            masses,
            kinetic_energies,
            impact_angles
        ])
        
        # Targets: crater_diameter, earthquake_magnitude, tnt_equivalent
        y = np.column_stack([
            crater_diameters,
            earthquake_magnitudes,
            tnt_equivalents
        ])
        
        return X, y
    
    def train(self, X=None, y=None):
        """Train the impact prediction model"""
        if X is None or y is None:
            X, y = self.create_training_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model (using Random Forest for interpretability)
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        self.is_trained = True
        
        print(f"Impact Predictor trained - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
        
        return train_score, test_score
    
    def predict(self, diameter, velocity, density, impact_angle=45):
        """Predict impact effects for given asteroid parameters"""
        if not self.is_trained:
            self.train()
        
        # Calculate derived features
        mass = (4/3) * np.pi * (diameter/2)**3 * density
        kinetic_energy = 0.5 * mass * velocity**2
        
        # Prepare input
        X = np.array([[diameter, velocity, density, mass, kinetic_energy, impact_angle]])
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X_scaled)[0]
        
        return {
            "crater_diameter": predictions[0],
            "earthquake_magnitude": predictions[1],
            "tnt_equivalent": predictions[2]
        }
    
    def save_model(self, filepath="models/impact_predictor.pkl"):
        """Save trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }, filepath)
    
    def load_model(self, filepath="models/impact_predictor.pkl"):
        """Load trained model"""
        if os.path.exists(filepath):
            data = joblib.load(filepath)
            self.model = data['model']
            self.scaler = data['scaler']
            self.is_trained = data['is_trained']
            return True
        return False

class DeflectionOptimizer:
    """ML model for optimizing asteroid deflection strategies"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def create_training_data(self, n_samples=5000):
        """Generate synthetic training data for deflection optimization"""
        np.random.seed(42)
        
        # Generate random scenarios
        diameters = np.random.uniform(50, 500, n_samples)
        velocities = np.random.uniform(10000, 30000, n_samples)
        time_remaining = np.random.uniform(1, 365, n_samples)  # days
        delta_v_values = np.random.uniform(0.01, 2.0, n_samples)  # m/s
        impact_distances = np.random.uniform(100, 10000, n_samples)  # km from target
        
        # Calculate deflection success (simplified model)
        # Success depends on delta_v, time remaining, and asteroid size
        success_scores = []
        for i in range(n_samples):
            # Higher delta_v and more time = better success
            # Larger asteroids are harder to deflect
            success = (delta_v_values[i] * time_remaining[i]) / (diameters[i] / 100)
            success_scores.append(min(success, 10))  # Cap at 10
        
        # Features: diameter, velocity, time_remaining, delta_v, impact_distance
        X = np.column_stack([
            diameters,
            velocities,
            time_remaining,
            delta_v_values,
            impact_distances
        ])
        
        # Target: success score
        y = np.array(success_scores)
        
        return X, y
    
    def train(self, X=None, y=None):
        """Train the deflection optimization model"""
        if X is None or y is None:
            X, y = self.create_training_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model (using Gradient Boosting for better performance)
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        self.is_trained = True
        
        print(f"Deflection Optimizer trained - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
        
        return train_score, test_score
    
    def optimize_deflection(self, diameter, velocity, time_remaining, impact_distance):
        """Find optimal deflection parameters"""
        if not self.is_trained:
            self.train()
        
        # Grid search for optimal delta_v
        best_delta_v = 0
        best_score = 0
        
        for delta_v in np.linspace(0.01, 2.0, 50):
            X = np.array([[diameter, velocity, time_remaining, delta_v, impact_distance]])
            X_scaled = self.scaler.transform(X)
            score = self.model.predict(X_scaled)[0]
            
            if score > best_score:
                best_score = score
                best_delta_v = delta_v
        
        # Calculate expected deflection distance
        deflection_distance = best_delta_v * time_remaining * 24 * 3600  # meters
        
        return {
            "optimal_delta_v": best_delta_v,
            "expected_success_score": best_score,
            "expected_deflection_distance": deflection_distance / 1000,  # km
            "success_probability": min(best_score / 10, 1.0)  # Normalize to 0-1
        }
    
    def save_model(self, filepath="models/deflection_optimizer.pkl"):
        """Save trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }, filepath)
    
    def load_model(self, filepath="models/deflection_optimizer.pkl"):
        """Load trained model"""
        if os.path.exists(filepath):
            data = joblib.load(filepath)
            self.model = data['model']
            self.scaler = data['scaler']
            self.is_trained = data['is_trained']
            return True
        return False

class AdaptiveDifficulty:
    """ML-based adaptive difficulty system"""
    
    def __init__(self):
        self.player_performance = []
        self.difficulty_level = 1.0
        self.performance_window = 10  # Last N games
        
    def update_performance(self, score, time_taken, deflection_accuracy):
        """Update player performance metrics"""
        performance = {
            "score": score,
            "time_taken": time_taken,
            "deflection_accuracy": deflection_accuracy,
            "timestamp": datetime.now()
        }
        
        self.player_performance.append(performance)
        
        # Keep only recent performance
        if len(self.player_performance) > self.performance_window:
            self.player_performance = self.player_performance[-self.performance_window:]
        
        self._adjust_difficulty()
    
    def _adjust_difficulty(self):
        """Adjust difficulty based on recent performance"""
        if len(self.player_performance) < 3:
            return
        
        # Calculate average performance metrics
        avg_score = np.mean([p["score"] for p in self.player_performance[-5:]])
        avg_accuracy = np.mean([p["deflection_accuracy"] for p in self.player_performance[-5:]])
        
        # Adjust difficulty based on performance
        if avg_score > 100000 and avg_accuracy > 0.8:
            # Player is doing well, increase difficulty
            self.difficulty_level = min(self.difficulty_level * 1.1, 3.0)
        elif avg_score < 50000 or avg_accuracy < 0.5:
            # Player is struggling, decrease difficulty
            self.difficulty_level = max(self.difficulty_level * 0.9, 0.5)
    
    def get_scenario_parameters(self, base_scenario):
        """Get modified scenario parameters based on difficulty"""
        modified = base_scenario.copy()
        
        # Adjust asteroid size
        modified["asteroid"]["diameter"] *= self.difficulty_level
        
        # Adjust time pressure
        modified["time_to_impact"] = int(modified["time_to_impact"] / self.difficulty_level)
        
        # Adjust success criteria
        modified["success_criteria"]["min_deflection_distance"] *= self.difficulty_level
        
        return modified
    
    def get_difficulty_level(self):
        """Get current difficulty level"""
        return self.difficulty_level

# Initialize global ML models
impact_predictor = ImpactPredictor()
deflection_optimizer = DeflectionOptimizer()
adaptive_difficulty = AdaptiveDifficulty()

# Train models on startup
def initialize_ml_models():
    """Initialize and train ML models"""
    print("Training ML models...")
    
    # Train impact predictor
    impact_predictor.train()
    
    # Train deflection optimizer
    deflection_optimizer.train()
    
    print("ML models trained successfully!")
