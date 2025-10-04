import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    content: 'Asteroid 2025-IMPECTOR has been detected by NASA\'s Near-Earth Object monitoring systems. Initial calculations suggest this 150-meter object is on a collision course with Earth.',
    type: 'narrative'
  },
  {
    id: 'data_sources',
    title: 'Data Sources',
    content: '',
    type: 'fact',
    fact: {
      title: 'Real Datasets Powering This Simulation',
      content: '🌌 NASA NEO API: Orbital elements, size, velocity, impact probability\n🌍 USGS Earthquake Data: Seismic modeling\n🌊 NOAA Tsunami Data: Ocean impact scenarios\n👥 CIESIN Population Data: Casualty estimation\n🛡 NASA PDCO: Deflection mission parameters'
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
      { text: '🛡 Defend Earth', action: 'deflect' },
      { text: '🏠 Prepare for Impact', action: 'mitigate' }
    ]
  }
];

const TYPING_SPEED = 0.1; // milliseconds per character
const AUTO_ADVANCE_DELAY = 1000; // milliseconds to wait after typing completes before auto-advancing

export default function StoryIntro({ onComplete }: StoryIntroProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const currentFrame = STORY_FRAMES[currentFrameIndex];
  const contentRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Reset text animation when frame changes
  useEffect(() => {
    // Clear any existing timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    
    setDisplayText('');
    setCurrentCharIndex(0);
    setIsTypingComplete(false);
    
    if (currentFrame.type === 'choice') {
      setDisplayText(currentFrame.content);
      setIsTypingComplete(true);
    }
  }, [currentFrameIndex]);

  // Handle typing effect
  useEffect(() => {
    if (currentFrame.type !== 'narrative' && currentFrame.type !== 'fact') return;
    
    const textToType = currentFrame.type === 'fact' 
      ? currentFrame.fact?.content || '' 
      : currentFrame.content;
    
    if (currentCharIndex < textToType.length) {
      typingTimeoutRef.current = setTimeout(() => {
        setDisplayText(textToType.substring(0, currentCharIndex + 1));
        setCurrentCharIndex(prev => {
          const newIndex = prev + 1;
          if (newIndex >= textToType.length) {
            setIsTypingComplete(true);
          }
          return newIndex;
        });
        
        // Auto-scroll to bottom of content
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }, TYPING_SPEED);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentCharIndex, currentFrame.type, currentFrame.content, currentFrame.fact]);

  const skipTyping = useCallback(() => {
    if (!isTypingComplete && currentFrame.type !== 'choice') {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      const fullText = currentFrame.type === 'fact' 
        ? currentFrame.fact?.content || '' 
        : currentFrame.content;
      setDisplayText(fullText);
      setIsTypingComplete(true);
    }
  }, [isTypingComplete, currentFrame]);

  const skipToChoice = useCallback(() => {
    // Clear all timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    // Jump to the last frame (choice screen)
    setCurrentFrameIndex(STORY_FRAMES.length - 1);
  }, []);

  const nextFrame = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    
    if (currentFrameIndex < STORY_FRAMES.length - 1) {
      setCurrentFrameIndex(prev => prev + 1);
    } else {
      onComplete();
    }
    setIsTransitioning(false);
  }, [currentFrameIndex, onComplete]);

  const handleChoice = useCallback((action: string) => {
    setPlayerChoice(action);
    setTimeout(() => {
      onComplete(action);
    }, 500);
  }, [onComplete]);

  // Auto-advance to next frame after typing completes (except for choice frame)
  useEffect(() => {
    if (isTypingComplete && currentFrame.type !== 'choice') {
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        nextFrame();
      }, AUTO_ADVANCE_DELAY);
    }

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [isTypingComplete, currentFrame.type, nextFrame]);

  return (
    <div className="story-intro">
      {/* Animated Space Background */}
      <div className="space-background">
        <div className="stars">
          {Array.from({ length: 200 }, (_, i) => (
            <div key={i} className={`star star-${i % 3}`}></div>
          ))}
        </div>
        
        {/* Earth in background */}
        <div className="earth">
          <div className="earth-glow"></div>
          <div className="earth-surface"></div>
        </div>
        
        {/* Asteroid approaching */}
        <div className={`asteroid ${isTransitioning ? 'transitioning' : ''}`}>
          <div className="asteroid-body"></div>
        </div>
      </div>

      {/* Story Content */}
      <div className={`story-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="story-frame">
          <h1 className="story-title">
            {currentFrame.title}
          </h1>
          
          <div className="content-wrapper" ref={contentRef}>
            {currentFrame.type === 'narrative' && (
              <div className="story-text" onClick={skipTyping}>
                <p style={{ whiteSpace: 'pre-line' }}>
                  {displayText}
                  {!isTypingComplete && <span className="typing-cursor">|</span>}
                </p>
              </div>
            )}
            
            {currentFrame.type === 'fact' && currentFrame.fact && (
              <div className="fact-box" onClick={skipTyping}>
                <h3>{currentFrame.fact.title}</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                  {displayText}
                  {!isTypingComplete && <span className="typing-cursor">|</span>}
                </pre>
              </div>
            )}
            
            {currentFrame.type === 'choice' && currentFrame.choices && (
              <div className="choice-box">
                <p className="choice-question">{displayText}</p>
                <div className="choices">
                  {currentFrame.choices.map((choice, index) => (
                    <button
                      key={index}
                      className={`choice-btn ${playerChoice === choice.action ? 'selected' : ''}`}
                      onClick={() => handleChoice(choice.action)}
                      style={{
                        animationDelay: `${index * 0.2}s`
                      }}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

        {/* Skip button - only show before choice screen */}
        {currentFrame.type !== 'choice' && (
          <button className="skip-story-btn" onClick={skipToChoice}>
            Skip Story →
          </button>
        )}
      </div>
    </div>
  );
}
