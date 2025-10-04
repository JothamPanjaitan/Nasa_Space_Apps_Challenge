import React, { useState, useEffect, useCallback } from 'react';

// --- Type Definitions ---
type StoryFragment = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  unlocks: string[];
  timeLoop?: number;
};

type StorySystemProps = {
  onDiscovery?: (fragment: StoryFragment) => void;
  onTimeLoop?: (loopNumber: number) => void;
  onStoryProgress?: (progress: number) => void;
};

const STORY_FRAGMENTS: { [key: string]: StoryFragment } = {
  // ...define your fragments here...
  asteroid_detected: {
    id: "asteroid_detected",
    title: "Asteroid Detected",
    description: "A new asteroid has been detected approaching Earth.",
    location: "Observatory",
    type: "discovery",
    unlocks: ["impact_analysis"],
  },
  // Add more fragments as needed
};

class StoryDiscovery {
  discoveries: Set<string>;
  storyFragments: StoryFragment[];
  currentTimeLoop: number;
  maxTimeLoop: number;
  timeRemaining: number;

  constructor() {
    this.discoveries = new Set();
    this.storyFragments = [];
    this.currentTimeLoop = 0;
    this.maxTimeLoop = 22;
    this.timeRemaining = this.maxTimeLoop * 60;
  }

  startTimeLoop() {
    this.currentTimeLoop++;
    this.timeRemaining = this.maxTimeLoop * 60;
    console.log(`Time Loop ${this.currentTimeLoop} started`);
  }

  updateTime(deltaTime: number) {
    this.timeRemaining -= deltaTime;
    if (this.timeRemaining <= 0) {
      this.endTimeLoop();
    }
  }

  endTimeLoop() {
    console.log(`Time Loop ${this.currentTimeLoop} ended`);
    this.startTimeLoop();
  }

  addDiscovery(discoveryId: string, description: string, location: string) {
    if (!this.discoveries.has(discoveryId)) {
      this.discoveries.add(discoveryId);
      this.storyFragments.push({
        id: discoveryId,
        title: STORY_FRAGMENTS[discoveryId]?.title || "",
        description,
        location,
        type: STORY_FRAGMENTS[discoveryId]?.type || "",
        unlocks: STORY_FRAGMENTS[discoveryId]?.unlocks || [],
        timeLoop: this.currentTimeLoop,
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

  getStoryProgress() {
    const totalFragments = 15;
    return (this.discoveries.size / totalFragments) * 100;
  }
}

function StorySystem({ onDiscovery, onTimeLoop, onStoryProgress }: StorySystemProps) {
  const [storyDiscovery] = useState(new StoryDiscovery());
  const [currentFragment, setCurrentFragment] = useState<StoryFragment | null>(null);
  const [discoveries, setDiscoveries] = useState<StoryFragment[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(storyDiscovery.timeRemaining);
  const [isTimeLoopActive, setIsTimeLoopActive] = useState(false);

  // Initialize story
  useEffect(() => {
    const initialFragment = STORY_FRAGMENTS["asteroid_detected"];
    setCurrentFragment(initialFragment);
    storyDiscovery.addDiscovery("asteroid_detected", initialFragment.description, initialFragment.location);
    setDiscoveries([initialFragment]);

    if (onDiscovery) {
      onDiscovery(initialFragment);
    }
    // eslint-disable-next-line
  }, []);

  // Time loop effect
  const handleTimeLoopEnd = useCallback(() => {
    storyDiscovery.endTimeLoop();
    setTimeRemaining(storyDiscovery.timeRemaining);
    setIsTimeLoopActive(false);

    if (onTimeLoop) {
      onTimeLoop(storyDiscovery.currentTimeLoop);
    }
  }, [onTimeLoop, storyDiscovery]);

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

  const startTimeLoop = () => {
    setIsTimeLoopActive(true);
    storyDiscovery.startTimeLoop();
    setTimeRemaining(storyDiscovery.timeRemaining);
  };

  const makeDiscovery = (fragmentId: string) => {
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

  const getAvailableDiscoveries = (): string[] => {
    const available: string[] = [];
    discoveries.forEach((discovery) => {
      const fragment = STORY_FRAGMENTS[discovery.id];
      if (fragment && fragment.unlocks) {
        fragment.unlocks.forEach((unlockId) => {
          if (!storyDiscovery.discoveries.has(unlockId)) {
            available.push(unlockId);
          }
        });
      }
    });
    return available;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="story-system">
      <h3>Story System</h3>
      <div>
        <button onClick={startTimeLoop} disabled={isTimeLoopActive}>
          Start Time Loop
        </button>
        <span style={{ marginLeft: 16 }}>
          Time Remaining: {formatTime(timeRemaining)}
        </span>
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
      <div style={{ marginTop: 16 }}>
        <h4>Available Discoveries:</h4>
        {getAvailableDiscoveries().map((discoveryId) => {
          const fragment = STORY_FRAGMENTS[discoveryId];
          return (
            <button
              key={discoveryId}
              onClick={() => makeDiscovery(discoveryId)}
              style={{ margin: 4 }}
            >
              {fragment?.title || discoveryId}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <h4>Discoveries:</h4>
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