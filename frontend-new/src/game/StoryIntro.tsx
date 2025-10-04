import React, { useState, useEffect } from 'react';
import './StoryIntro.css';

interface StoryIntroProps {
  onComplete: (choice?: string) => void;
}

interface StoryFrame {
  id: string;
  title: string;
  content: string;
  type: 'narrative' | 'choice' | 'fact';
  choices?: { text: string; action: string }[];
  fact?: { title: string; content: string };
}

const STORY_FRAMES: StoryFrame[] = [
  {
    id: 'opening',
    title: 'The Arrival',
    content: 'In the vast silence of space, our world spins, fragile and unaware. But beyond the shadows, a threat approaches.',
    type: 'narrative'
  },
  {
    id: 'discovery',
    title: 'Discovery Alert',
    content: 'Asteroid 2025-IMPCTOR has been detected by NASA\'s Near-Earth Object monitoring systems. Initial calculations suggest this 150-meter object is on a collision course with Earth.',
    type: 'narrative'
  },
  {
    id: 'data_sources',
    title: 'Data Sources',
    content: '',
    type: 'fact',
    fact: {
      title: 'Real Datasets Powering This Simulation',
      content: '🌌 NASA NEO API: Orbital elements, size, velocity, impact probability\n🌍 USGS Earthquake Data: Seismic modeling\n🌊 NOAA Tsunami Data: Ocean impact scenarios\n👥 CIESIN Population Data: Casualty estimation\n🛡️ NASA PDCO: Deflection mission parameters'
    }
  },
  {
    id: 'stakes',
    title: 'The Stakes',
    content: 'Time is short. Humanity faces a critical choice: study the threat, prepare for impact, or attempt to deflect the asteroid. The fate of billions depends on your decisions.',
    type: 'narrative'
  },
  {
    id: 'choice',
    title: 'Your Mission',
    content: 'How will you respond to this planetary threat?',
    type: 'choice',
    choices: [
      { text: '🔍 Study & Explore', action: 'explore' },
      { text: '🛡️ Defend Earth', action: 'deflect' },
      { text: '🏠 Prepare for Impact', action: 'mitigate' }
    ]
  }
];

export default function StoryIntro({ onComplete }: StoryIntroProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);

  const currentFrame = STORY_FRAMES[currentFrameIndex];

  const nextFrame = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (currentFrameIndex < STORY_FRAMES.length - 1) {
        setCurrentFrameIndex(currentFrameIndex + 1);
      } else {
        onComplete();
      }
      setIsTransitioning(false);
    }, 1000);
  };

  const handleChoice = (action: string) => {
    setPlayerChoice(action);
    setTimeout(() => {
      onComplete(action);
    }, 2000);
  };

  return (
    <div className="story-intro">
      {/* Animated Space Background */}
      <div className="space-background">
        <div className="stars">{
          Array.from({ length: 200 }, (_, i) => (
            <div key={i} className={`star star-${i % 3}`}></div>
          ))
        }</div>
        
        {/* Earth in background */}
        <div className="earth">
          <div className="earth-glow"></div>
          <div className="earth-surface"></div>
        </div>
        
        {/* Asteroid approaching */}
        <div className={`asteroid ${isTransitioning ? 'transitioning' : ''}`}>
          <div className="asteroid-glow"></div>
          <div className="asteroid-body"></div>
        </div>
      </div>

      {/* Story Content */}
      <div className={`story-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="story-frame">
          <h1 className="story-title">{currentFrame.title}</h1>
          
          {currentFrame.type === 'narrative' && (
            <div className="story-text">
              <p>{currentFrame.content}</p>
              <button className="continue-btn" onClick={nextFrame}>
                Continue ➜
              </button>
            </div>
          )}
          
          {currentFrame.type === 'fact' && currentFrame.fact && (
            <div className="fact-box">
              <h3>{currentFrame.fact.title}</h3>
              <pre>{currentFrame.fact.content}</pre>
              <button className="continue-btn" onClick={nextFrame}>
                I Understand ➜
              </button>
            </div>
          )}
          
          {currentFrame.type === 'choice' && currentFrame.choices && (
            <div className="choice-box">
              <p className="choice-question">{currentFrame.content}</p>
              <div className="choices">
                {currentFrame.choices.map((choice, index) => (
                  <button
                    key={index}
                    className={`choice-btn ${playerChoice === choice.action ? 'selected' : ''}`}
                    onClick={() => handleChoice(choice.action)}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="progress-indicator">
          {STORY_FRAMES.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index <= currentFrameIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
