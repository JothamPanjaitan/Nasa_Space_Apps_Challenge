# 🚀 NASA Asteroid Deflection Game - Outer Wilds Edition

An interactive web-based game inspired by Outer Wilds where players must deflect incoming asteroids to save Earth from catastrophic impacts. Features real NASA data, machine learning predictions, 3D orbital visualization, and time-loop storytelling mechanics.

## 🎮 Game Features

### Core Gameplay
- **Realistic Physics**: Based on Holsapple scaling laws and USGS empirical relations
- **Interactive Map**: Visualize impact zones, deflection trajectories, and affected cities
- **Episodic Gameplay**: Multiple scenarios with increasing difficulty
- **Real-time Simulation**: Calculate impact effects, crater sizes, and earthquake magnitudes
- **Scoring System**: Earn points based on population saved and deflection efficiency

### Outer Wilds-Inspired Features
- **Time Loop Mechanics**: 22-minute time loops with discovery-based progression
- **Environmental Storytelling**: Uncover the story through exploration and discovery
- **Non-linear Narrative**: Multiple story paths and endings based on player choices
- **Discovery System**: 15+ story fragments to discover through gameplay

### Advanced Features
- **Real NASA Data**: Live integration with NASA NEO API for authentic asteroid data
- **Machine Learning**: AI-powered impact prediction and deflection optimization
- **3D Orbital Visualization**: Three.js-powered 3D solar system with realistic orbital mechanics
- **Adaptive Difficulty**: ML-based difficulty adjustment based on player performance
- **Live Data Integration**: Real-time asteroid tracking and hazard assessment

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.7+ (for backend)
- Node.js 16+ (for frontend)
- pip (Python package manager)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```bash
   python app.py
   ```

   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## 🎯 How to Play

1. **Choose a Scenario**: Start with "The Discovery" scenario featuring a 100-meter asteroid
2. **Analyze the Threat**: Click "Simulate Impact" to see the potential damage
3. **Plan Your Deflection**: Adjust the delta-v (velocity change) and time before impact
4. **Execute the Mission**: Click "Deflect Asteroid" to attempt the deflection
5. **Save the World**: Successfully deflect the asteroid away from populated areas!

## 🔬 Physics Implementation

### Impact Calculations
- **Mass**: Calculated from diameter assuming spherical shape
- **Kinetic Energy**: E = ½mv²
- **TNT Equivalent**: Conversion using 4.184 × 10⁹ J per ton TNT
- **Crater Diameter**: Pi-scaling formula based on Holsapple scaling laws
- **Earthquake Magnitude**: USGS empirical relation: log₁₀(E) = 1.5M + 4.8

### Deflection Model
- **Linear Approximation**: Simplified along-track deflection calculation
- **Distance Shifted**: Δd = Δv × t (where t is time before impact)
- **Success Criteria**: Minimum 1000m deflection required

## 📡 API Endpoints

### Asteroid Data
- `GET /api/neo/<id>` - Get asteroid information
- `GET /api/neo` - List all available asteroids
- `GET /api/neo/live?limit=<n>` - Get live asteroid data from NASA API
- `GET /api/neo/hazardous?days=<n>` - Get potentially hazardous asteroids

### Simulation
- `POST /api/simulate` - Simulate impact effects
- `POST /api/deflect` - Calculate deflection results
- `POST /api/orbit/simulate` - Simulate orbital trajectory using Keplerian elements

### Machine Learning
- `POST /api/ml/predict-impact` - AI-powered impact effect prediction
- `POST /api/ml/optimize-deflection` - AI-powered deflection parameter optimization
- `POST /api/ml/adaptive-difficulty` - Update adaptive difficulty based on performance
- `POST /api/ml/scenario` - Get scenario with adaptive difficulty

### Story Progression
- `GET /api/story/next?scenario_id=<id>` - Get next scenario
- `GET /api/story/scenarios` - List all scenarios

### Scoring
- `POST /api/score` - Calculate player score

## 🎨 Frontend Features

### Core Interface
- **Interactive Map**: Leaflet-based map with custom markers and zones
- **Real-time Visualization**: Impact zones, deflection trajectories, and city markers
- **Responsive Design**: Works on desktop and mobile devices
- **Animated Effects**: Pulsing asteroid markers and ripple effects
- **Modern UI**: Dark theme with gradient backgrounds and glassmorphism effects

### Advanced Visualizations
- **3D Orbital System**: Three.js-powered 3D solar system visualization
- **Real-time Trajectory**: Animated asteroid paths with orbital mechanics
- **Interactive Controls**: Orbit, zoom, and rotate the 3D scene
- **Celestial Bodies**: Realistic Earth, Sun, and asteroid representations

### Story System
- **Discovery Interface**: Interactive story fragment discovery system
- **Time Loop Display**: Real-time countdown and loop management
- **Progress Tracking**: Visual progress bars and discovery counters
- **Environmental Storytelling**: Contextual information based on player actions

## 🧪 Sample Data

### Built-in Asteroids
- **2025 Impactor**: 100m diameter, 17 km/s velocity
- **99942 Apophis**: 370m diameter, 12 km/s velocity  
- **101955 Bennu**: 500m diameter, 10 km/s velocity

### Scenarios
1. **The Discovery**: 100m asteroid, 30 days, 2.5M people at risk
2. **The Big One**: 500m asteroid, 60 days, 50M people at risk

## 🔧 Development

### Backend Structure
```
backend/
├── app.py              # Flask application
├── impact.py           # Physics calculations
└── requirements.txt    # Python dependencies
```

### Frontend Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main React component
│   ├── App.css         # Component styles
│   ├── index.js        # React entry point
│   └── index.css       # Global styles
└── package.json        # Node.js dependencies
```

## 📚 References

- [Purdue EAPS Impact Calculator](https://www.eaps.purdue.edu/impactcrater/)
- [USGS Earthquake Magnitude Relations](https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity)
- [Holsapple Scaling Laws](https://www.lpi.usra.edu/meetings/lpsc2017/pdf/1440.pdf)

## 🚀 Future Enhancements

### Completed Features ✅
- [x] Real-time NASA NEO data integration
- [x] Machine learning impact prediction and deflection optimization
- [x] 3D visualization with Three.js
- [x] Outer Wilds-inspired storytelling system
- [x] Time loop mechanics and discovery system
- [x] Adaptive difficulty system

### Planned Features
- [ ] USGS earthquake and elevation data integration
- [ ] Tsunami wave propagation modeling
- [ ] Advanced deflection strategies (gravity tractor, laser ablation)
- [ ] Multiplayer competitive mode
- [ ] Leaderboard and achievements system
- [ ] Mobile app version
- [ ] Augmented Reality (AR) visualization
- [ ] Voice narration for story elements
- [ ] Multi-language support

## 📄 License

This project is for educational and demonstration purposes. Physics calculations are simplified approximations for gameplay purposes.

---

**Save Earth, one asteroid at a time! 🌍☄️**
