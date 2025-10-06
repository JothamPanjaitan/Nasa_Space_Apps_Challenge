# 🌍☄️ Meteor Madness: Defend Earth

**NASA Space Apps Challenge 2025**  
**Team MeteorBusUK:** Arman, Micu, Wok, Jothamd, Cyrus  
**Deadline:** Sunday, October 5, 2025 - 11:59 PM AEST

---

## 🎯 Project Overview

**Meteor Madness: Defend Earth** is a scientific-accurate, visually rich web application that allows users to:
- Load real NASA NEO (Near-Earth Object) data
- Watch 3D orbital simulations with Cesium
- Visualize impact scenarios on Earth
- Choose mitigation strategies (kinetic impactor, gravity tractor, nuclear deflection)
- See immediate outcomes with damage radii, casualty estimates, and economic impact

### Design Goals
✅ **Science-First:** Formulas based on Holsapple scaling laws and USGS empirical relations  
✅ **Visually Rich:** 3D Cesium globe, animated orbital arcs, explosion effects, layered 2D maps  
✅ **Interactive & Playful:** Sliders, timelines, deflection sandbox, scoring and badges  
✅ **Accessible:** Tooltips, plain-language explanations, exportable reports

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js 16+** (for frontend)
- **Python 3.7+** (for backend)
- **npm** and **pip** installed

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs at: **http://localhost:5001**

### 2. Frontend Setup
```bash
cd frontend-new
npm install
npm start
```
Frontend runs at: **http://localhost:3000**

### 3. Open Your Browser
Navigate to **http://localhost:3000/landing** to see the landing page!

---

## 🎨 Visual Language & Branding

### Color Palette
```css
--primary-900: #0B3D91  /* Deep space blue */
--accent-500: #FF6B35   /* Impact/alert orange */
--success-500: #2CCB8B  /* Safe outcomes */
--danger-600: #D93F3F   /* Catastrophic */
--muted-400: #8AA0C8    /* UI neutrals */
```

### Typography
- **Headlines:** Inter (400, 500, 600, 700)
- **Code/Stats:** IBM Plex Mono (400, 500, 600)

### UI Motifs
- Soft-glow planet rim
- Orbital lines with gradients
- Heatmap overlays for damage (radial gradients)
- Particle-based smoke/dust post-impact
- Glassmorphism panels with backdrop blur

---

## 📱 Core Screens & Features

### 1. Landing Page (`/landing`)
- Full-screen animated starfield
- Rotating Earth with pulsing impactor arc
- Three CTA buttons: Defend Earth, Explore Scenario, Load Real NEO
- Features grid showcasing science-first approach
- Quick stats strip with NASA facts

### 2. Space View - 3D Orbital Explorer (`/`)
- Cesium globe with realistic terrain
- Orbital arcs drawn as glowing spline paths
- HUD display: distance, velocity, diameter, mass, impact probability
- Time-step controls: rewind / play / fast-forward
- Click asteroid to fly-to camera and simulate impact

### 3. Impact Explorer - Map Mode (`/impact`)
- 2D Leaflet map with impact point
- Concentric damage rings: blast, thermal, ejecta, seismic
- Population density heatmap overlay
- Tsunami inundation zones (for ocean impacts)
- Critical infrastructure markers (hospitals, shelters)

### 4. Defend Earth - Mitigation Sandbox (`/mitigation`)
- Δv slider (m/s) for velocity change
- Lead-time slider (days/years before impact)
- Method selector: kinetic, gravity tractor, nuclear
- Cost calculator
- Simulate and draw new orbit arc
- Outcome preview: Success / Partial / Fail with confidence band

### 5. Game Mode (`/game`)
- Campaign scenarios with increasing difficulty
- Time loop mechanics (22-minute loops)
- Discovery-based progression
- Scoring system: lives saved + economic damage - mitigation cost
- Badges: The Savior, The Strategist, The Economist

---

## 🔬 Physics Implementation

### Impact Calculations
```javascript
// Mass calculation
m = (4/3) * π * (D/2)³ * ρ

// Kinetic Energy
E = 0.5 * m * v²

// TNT Equivalent
1 megaton TNT = 4.184e15 J

// Crater Diameter (pi-scaling)
D_crater = k * (E / (ρ_t * g))^(1/3.4)

// Earthquake Magnitude
M_w ≈ (2/3) * log₁₀(E) - 3.2
```

### Deflection Model
```javascript
// Linear approximation
Δd = Δv × t_lead

// Success criteria
Δd > Earth_radius (6,371 km)
```

### Tsunami Estimation (Simplified)
- Displaced water volume from crater size
- Initial wave height H₀ via empirical relation
- Propagate with depth-based energy attenuation
- Run-up using DEM (Digital Elevation Model)

---

## 📡 API Endpoints

### Asteroid Data
- `GET /api/neo/<id>` - Get asteroid by ID
- `GET /api/neo` - List all asteroids
- `GET /api/neo/live?limit=10` - Live NASA NEO data
- `GET /api/neo/hazardous?days=7` - Hazardous asteroids

### Simulation
- `POST /api/simulate` - Calculate impact effects
  ```json
  {
    "diameter": 100,
    "velocity": 17000,
    "density": 2600,
    "impact_lat": 25.7617,
    "impact_lon": -80.1918,
    "impact_region": "land"
  }
  ```

- `POST /api/deflect` - Calculate deflection results
  ```json
  {
    "delta_v": 0.1,
    "time_before_impact": 30,
    "original_lat": 25.7617,
    "original_lon": -80.1918
  }
  ```

- `POST /api/trajectory` - 3D trajectory calculation

### Machine Learning
- `POST /api/ml/predict-impact` - AI-powered impact prediction
- `POST /api/ml/optimize-deflection` - AI-powered deflection optimization

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + TypeScript
- **CesiumJS** - 3D globe visualization
- **Leaflet** - 2D map visualization
- **React Router** - Navigation
- **Axios** - API calls

### Backend
- **Flask** (Python) - REST API
- **NumPy/SciPy** - Physics calculations
- **Requests** - NASA API integration

### Data Sources
1. **NASA NEO NeoWs API** - Real asteroid data
2. **JPL Horizons** - High-precision ephemerides
3. **USGS** - Elevation, seismic zones, tsunami hazard
4. **NOAA ETOPO1** - Bathymetry for tsunami modeling
5. **WorldPop / CIESIN** - Population density

---

## 🎮 Gamification Features

### Scoring System
```
Score = (Lives Saved × 10) + (Time Bonus × 1000) + (Deflection Bonus × 100)
```

### Badges
- 🏆 **The Savior** - Successful total deflection
- 🧠 **The Strategist** - Saved >80% with civil measures
- 💰 **The Economist** - Best cost-effectiveness

### Campaign Mode
- **Scenario 1:** The Discovery (100m asteroid, 30 days, 2.5M at risk)
- **Scenario 2:** The Big One (500m asteroid, 60 days, 50M at risk)
- **Scenario 3:** Custom scenarios with adaptive difficulty

---

## 📊 Performance Optimizations

- Heavy physics calculations run on backend
- Frontend requests precomputed scenario tiles
- WebGL instancing for particles and debris
- Pre-baked population heatmap tiles (XYZ format)
- Cesium camera particle limits on mobile
- Redis caching for NASA & USGS responses

---

## 🧪 Testing & Validation

### Physics Test Vectors
```bash
curl http://localhost:5001/api/physics/test-vectors
```

### Example Asteroids
- **Impactor-2025:** 100m, 17 km/s
- **Apophis:** 370m, 12 km/s
- **Bennu:** 500m, 10 km/s

---

## 📚 References & Citations

1. **Holsapple Scaling Laws**  
   https://www.lpi.usra.edu/meetings/lpsc2017/pdf/1440.pdf

2. **Purdue EAPS Impact Calculator**  
   https://www.eaps.purdue.edu/impactcrater/

3. **USGS Earthquake Magnitude Relations**  
   https://www.usgs.gov/programs/earthquake-hazards/

4. **NASA NEO Program**  
   https://cneos.jpl.nasa.gov/

5. **NOAA Tsunami Modeling**  
   https://nctr.pmel.noaa.gov/

---

## 🚧 Known Limitations

- Tsunami model is simplified (not full ComMIT/MOST workflow)
- Atmospheric entry effects use simplified drag equations
- Population data is static (not real-time)
- Deflection model assumes linear along-track shift

---

## 🎉 Future Enhancements

- [ ] Real-time NOAA ComMIT tsunami integration
- [ ] Advanced deflection strategies (laser ablation)
- [ ] Multiplayer competitive mode
- [ ] AR visualization with mobile app
- [ ] Voice narration for story elements
- [ ] Multi-language support

---

## 📄 License & Attribution

This project is for educational and demonstration purposes as part of NASA Space Apps Challenge 2025.

**Team MeteorBusUK:**
- Arman - Backend & Physics
- Micu - Frontend & UI/UX
- Wok - 3D Visualization
- Jotham - Game Design & Integration
- Cyrus - Concept design & presentation

**Data Sources:**
- NASA JPL NEO Program
- USGS Earthquake Hazards Program
- NOAA National Centers for Environmental Information

---

## 🙏 Acknowledgments

Special thanks to:
- NASA Space Apps Challenge organizers
- Cesium team for the amazing 3D globe library
- The open-source community

---

**Save Earth, one asteroid at a time! 🌍☄️**

---

## 📞 Contact

For questions or feedback:
- GitHub: [Your Repository URL]
- Email: [Your Team Email]
- NASA Space Apps: [Your Project Page]
