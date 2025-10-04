import React, { useState, useEffect, useCallback } from 'react';

// Story discovery system inspired by Outer Wilds
class StoryDiscovery {
  constructor() {
    this.discoveries = new Set();
    this.storyFragments = [];
    this.currentTimeLoop = 0;
    this.maxTimeLoop = 22; // 22 minutes like Outer Wilds
    this.timeRemaining = this.maxTimeLoop * 60; // seconds
  }

  // Time loop mechanics
  startTimeLoop() {
    this.currentTimeLoop++;
    this.timeRemaining = this.maxTimeLoop * 60;
    console.log(`Time Loop ${this.currentTimeLoop} started`);
  }

  updateTime(deltaTime) {
    this.timeRemaining -= deltaTime;
    if (this.timeRemaining <= 0) {
      this.endTimeLoop();
    }
  }

  endTimeLoop() {
    console.log(`Time Loop ${this.currentTimeLoop} ended`);
    this.startTimeLoop();
  }

  // Discovery system
  addDiscovery(discoveryId, description, location) {
    if (!this.discoveries.has(discoveryId)) {
      this.discoveries.add(discoveryId);
      this.storyFragments.push({
        id: discoveryId,
        description,
        location,
        timestamp: Date.now(),
        timeLoop: this.currentTimeLoop
      });
      console.log(`New discovery: ${description}`);
      return true;
    }
    return false;
  }

  getDiscoveries() {
    return this.storyFragments;
  }

  getDiscoveryCount() {
    return this.discoveries.size;
  }

  // Story progression
  getStoryProgress() {
    const totalFragments = 15; // Total story fragments to discover
    return (this.discoveries.size / totalFragments) * 100;
  }
}

// Story fragments data
const STORY_FRAGMENTS = {
  // Initial discovery
  "asteroid_detected": {
    title: "Asteroid Detected",
    description: "A near-Earth object has been detected on a collision course with Earth. Initial calculations suggest impact in 30 days.",
    location: "Space Tracking Station",
    type: "discovery",
    unlocks: ["impact_analysis", "deflection_planning"]
  },

  // Impact analysis
  "impact_analysis": {
    title: "Impact Analysis",
    description: "Detailed analysis reveals the asteroid is 100 meters in diameter, traveling at 17 km/s. Impact energy equivalent to 50 megatons of TNT.",
    location: "Impact Analysis Lab",
    type: "analysis",
    unlocks: ["population_risk", "environmental_effects"]
  },

  // Population risk assessment
  "population_risk": {
    title: "Population at Risk",
    description: "2.5 million people in coastal cities are at direct risk. Major metropolitan areas including Miami, Tokyo, and New York are in the impact zone.",
    location: "Population Risk Assessment Center",
    type: "risk",
    unlocks: ["evacuation_planning", "deflection_mission"]
  },

  // Environmental effects
  "environmental_effects": {
    title: "Environmental Catastrophe",
    description: "Impact will create a crater 2km in diameter, generate magnitude 7.5 earthquake, and trigger massive tsunamis affecting coastlines worldwide.",
    location: "Environmental Impact Lab",
    type: "environment",
    unlocks: ["tsunami_modeling", "atmospheric_effects"]
  },

  // Deflection mission planning
  "deflection_mission": {
    title: "Deflection Mission",
    description: "NASA's Planetary Defense Coordination Office has approved a kinetic impactor mission. The spacecraft must be launched within 15 days to reach the asteroid in time.",
    location: "Mission Control",
    type: "mission",
    unlocks: ["spacecraft_preparation", "trajectory_calculation"]
  },

  // Spacecraft preparation
  "spacecraft_preparation": {
    title: "Spacecraft Preparation",
    description: "The DART (Double Asteroid Redirection Test) spacecraft is being prepared for launch. It carries a 500kg kinetic impactor designed to change the asteroid's velocity by 0.1 m/s.",
    location: "Launch Facility",
    type: "preparation",
    unlocks: ["launch_sequence", "mission_timeline"]
  },

  // Trajectory calculation
  "trajectory_calculation": {
    title: "Trajectory Calculation",
    description: "Orbital mechanics calculations show that a 0.1 m/s velocity change 15 days before impact will deflect the asteroid by 1,000 km - enough to miss Earth entirely.",
    location: "Orbital Mechanics Lab",
    type: "calculation",
    unlocks: ["deflection_simulation", "success_probability"]
  },

  // Deflection simulation
  "deflection_simulation": {
    title: "Deflection Simulation",
    description: "Computer simulations confirm the deflection strategy will work. The asteroid will pass 1,200 km from Earth's surface - a safe distance.",
    location: "Simulation Center",
    type: "simulation",
    unlocks: ["mission_execution", "success_celebration"]
  },

  // Mission execution
  "mission_execution": {
    title: "Mission Execution",
    description: "The DART spacecraft successfully impacts the asteroid! Initial telemetry shows the velocity change was achieved. The asteroid's trajectory is being monitored.",
    location: "Mission Control",
    type: "execution",
    unlocks: ["impact_verification", "trajectory_update"]
  },

  // Success celebration
  "success_celebration": {
    title: "Mission Success!",
    description: "The asteroid has been successfully deflected! It will pass safely by Earth at a distance of 1,200 km. The mission has saved millions of lives.",
    location: "Mission Control",
    type: "success",
    unlocks: []
  },

  // Time loop mechanics
  "time_loop_mechanics": {
    title: "Time Loop Discovered",
    description: "You've discovered that you're trapped in a time loop! Each attempt to save Earth resets after 22 minutes. Use this knowledge to perfect your deflection strategy.",
    location: "Temporal Anomaly",
    type: "mechanic",
    unlocks: ["time_manipulation", "perfect_strategy"]
  },

  // Perfect strategy
  "perfect_strategy": {
    title: "Perfect Strategy",
    description: "After multiple time loops, you've discovered the optimal deflection parameters: Delta-V of 0.15 m/s applied 18 days before impact. This guarantees success!",
    location: "Temporal Research Lab",
    type: "strategy",
    unlocks: ["final_mission", "time_loop_escape"]
  },

  // Final mission
  "final_mission": {
    title: "Final Mission",
    description: "This is it! The final attempt. All previous knowledge from the time loops has been applied. The asteroid will be deflected and Earth will be saved.",
    location: "Mission Control",
    type: "final",
    unlocks: ["earth_saved", "time_loop_escape"]
  },

  // Earth saved
  "earth_saved": {
    title: "Earth Saved!",
    description: "Congratulations! You've successfully deflected the asteroid and saved Earth. The time loop has been broken, and humanity is safe from this cosmic threat.",
    location: "Mission Control",
    type: "victory",
    unlocks: []
  }
};

// Story system component
function StorySystem({ onDiscovery, onTimeLoop, onStoryProgress }) {
  const [storyDiscovery] = useState(new StoryDiscovery());
  const [currentFragment, setCurrentFragment] = useState(null);
  const [discoveries, setDiscoveries] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(storyDiscovery.timeRemaining);
  const [isTimeLoopActive, setIsTimeLoopActive] = useState(false);

  // Initialize story
  useEffect(() => {
    // Start with initial discovery
    const initialFragment = STORY_FRAGMENTS["asteroid_detected"];
    setCurrentFragment(initialFragment);
    storyDiscovery.addDiscovery("asteroid_detected", initialFragment.description, initialFragment.location);
    setDiscoveries([initialFragment]);
    
    if (onDiscovery) {
      onDiscovery(initialFragment);
    }
  }, [onDiscovery, storyDiscovery]);

  // Time loop timer
  useEffect(() => {
    if (!isTimeLoopActive) return;

    const timer = setInterval(() => {
      storyDiscovery.updateTime(1);
      setTimeRemaining(storyDiscovery.timeRemaining);
      
      if (storyDiscovery.timeRemaining <= 0) {
        handleTimeLoopEnd();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimeLoopActive, handleTimeLoopEnd, storyDiscovery]);

  const handleTimeLoopEnd = useCallback(() => {
    storyDiscovery.endTimeLoop();
    setTimeRemaining(storyDiscovery.timeRemaining);
    setIsTimeLoopActive(false);
    
    if (onTimeLoop) {
      onTimeLoop(storyDiscovery.currentTimeLoop);
    }
  }, [onTimeLoop, storyDiscovery]);

  const startTimeLoop = () => {
    setIsTimeLoopActive(true);
    storyDiscovery.startTimeLoop();
    setTimeRemaining(storyDiscovery.timeRemaining);
  };

  const makeDiscovery = (fragmentId) => {
    const fragment = STORY_FRAGMENTS[fragmentId];
    if (!fragment) return false;

    const isNew = storyDiscovery.addDiscovery(fragmentId, fragment.description, fragment.location);
    if (isNew) {
      setDiscoveries([...storyDiscovery.getDiscoveries()]);
      setCurrentFragment(fragment);
      
      if (onDiscovery) {
        onDiscovery(fragment);
      }
      
      if (onStoryProgress) {
        onStoryProgress(storyDiscovery.getStoryProgress());
      }
    }
    return isNew;
  };

  const getAvailableDiscoveries = () => {
    const available = [];
    discoveries.forEach(discovery => {
      const fragment = STORY_FRAGMENTS[discovery.id];
      if (fragment && fragment.unlocks) {
        fragment.unlocks.forEach(unlockId => {
          if (!storyDiscovery.discoveries.has(unlockId)) {
            available.push(unlockId);
          }
        });
      }
    });
    return available;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="story-system">
      <div className="story-header">
        <h3>🌌 Story Discovery System</h3>
        <div className="time-display">
          Time Remaining: {formatTime(timeRemaining)}
        </div>
        <div className="discovery-count">
          Discoveries: {storyDiscovery.getDiscoveryCount()}/15
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${storyDiscovery.getStoryProgress()}%` }}
          />
        </div>
      </div>

      {currentFragment && (
        <div className="current-fragment">
          <h4>{currentFragment.title}</h4>
          <p>{currentFragment.description}</p>
          <div className="fragment-location">
            📍 {currentFragment.location}
          </div>
        </div>
      )}

      <div className="discovery-actions">
        <button 
          onClick={startTimeLoop}
          disabled={isTimeLoopActive}
          className="time-loop-btn"
        >
          {isTimeLoopActive ? 'Time Loop Active' : 'Start Time Loop'}
        </button>
        
        <div className="available-discoveries">
          <h4>Available Discoveries:</h4>
          {getAvailableDiscoveries().map(discoveryId => {
            const fragment = STORY_FRAGMENTS[discoveryId];
            return (
              <button
                key={discoveryId}
                onClick={() => makeDiscovery(discoveryId)}
                className="discovery-btn"
              >
                {fragment.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="discoveries-log">
        <h4>Discovery Log:</h4>
        {discoveries.map((discovery, index) => (
          <div key={index} className="discovery-item">
            <strong>{discovery.description}</strong>
            <div className="discovery-meta">
              Loop {discovery.timeLoop} • {discovery.location}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StorySystem;
