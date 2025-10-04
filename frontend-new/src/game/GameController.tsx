import React, { useState } from 'react';
import StoryIntro from './StoryIntro';
import OrbitalTrajectorySimulator from './OrbitalTrajectorySimulator';
import DeflectionMission from './DeflectionMission';
import CivilProtection from './CivilProtection';
import ImpactMap from '../ImpactMap';
import EndScreen from './EndScreen';
import './GameController.css';

type GameState = 
  | 'intro' 
  | 'simulator' 
  | 'deflection' 
  | 'civil_protection' 
  | 'impact_map' 
  | 'ending';

type PlayerChoice = 'explore' | 'deflect' | 'mitigate';

interface GameData {
  playerChoice: PlayerChoice | null;
  asteroidParams: any;
  impactData: any;
  deflectionSuccess: boolean;
  mitigationScore: any;
}

export default function GameController() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [gameData, setGameData] = useState<GameData>({
    playerChoice: null,
    asteroidParams: null,
    impactData: null,
    deflectionSuccess: false,
    mitigationScore: null
  });

  // Handle story intro completion
  const handleIntroComplete = (choice?: string) => {
    if (choice) {
      setGameData(prev => ({ ...prev, playerChoice: choice as any }));
    }
    
    if (choice === 'explore') {
      // Go directly to impact map for exploration
      setGameState('impact_map');
    } else if (choice === 'deflect') {
      // Go to deflection mission
      setGameState('deflection');
    } else if (choice === 'mitigate') {
      // Go to civil protection
      setGameState('civil_protection');
    } else {
      // Default to simulator
      setGameState('simulator');
    }
  };

  // Handle simulator completion
  const handleSimulatorComplete = (params: any, impactData: any) => {
    setGameData(prev => ({
      ...prev,
      asteroidParams: params,
      impactData: impactData
    }));
    setGameState('impact_map');
  };

  // Handle impact map completion
  const handleImpactMapComplete = () => {
    setGameState('ending');
  };

  // Handle deflection mission completion
  const handleDeflectionComplete = (success: boolean) => {
    setGameData(prev => ({
      ...prev,
      deflectionSuccess: success
    }));
    
    if (success) {
      setGameState('ending');
    } else {
      // Still some damage, go to civil protection
      setGameState('civil_protection');
    }
  };

  // Handle civil protection completion
  const handleCivilProtectionComplete = (score: any) => {
    setGameData(prev => ({
      ...prev,
      mitigationScore: score
    }));
    setGameState('ending');
  };

  // Handle game restart
  const handleRestartGame = () => {
    setGameState('intro');
    setGameData({
      playerChoice: null,
      asteroidParams: null,
      impactData: null,
      deflectionSuccess: false,
      mitigationScore: null
    });
  };

  // Render current game state
  const renderGameState = () => {
    switch (gameState) {
      case 'intro':
        return <StoryIntro onComplete={handleIntroComplete} />;

      case 'simulator':
        return (
          <OrbitalTrajectorySimulator 
            onSimulate={handleSimulatorComplete}
          />
        );

      case 'deflection':
        return (
          <DeflectionMission
            asteroidParams={gameData.asteroidParams}
            onSuccess={handleDeflectionComplete}
          />
        );

      case 'civil_protection':
        return (
          <CivilProtection
            impactData={gameData.impactData}
            asteroidParams={gameData.asteroidParams}
            onComplete={handleCivilProtectionComplete}
          />
        );

      case 'impact_map':
        return (
          <ImpactMap
            asteroidParams={gameData.asteroidParams}
            impactData={gameData.impactData}
            onBack={() => setGameState('simulator')}
            onDefend={() => setGameState('deflection')}
            onMitigation={() => setGameState('civil_protection')}
          />
        );

      case 'ending':
        return (
          <EndScreen
            gameData={gameData}
            onRestart={handleRestartGame}
          />
        );

      default:
        return <StoryIntro onComplete={handleIntroComplete} />;
    }
  };

  return (
    <div className="game-controller">
      {/* Global background for all states except impact map */}
      {gameState !== 'impact_map' && (
        <div className="global-space-background">
          <div className="stars">
            {Array.from({ length: 150 }, (_, i) => (
              <div key={i} className={`star star-${i % 3}`}></div>
            ))}
          </div>
          
          {/* Nebula effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          <div className="nebula nebula-3"></div>
          
          {/* Moving asteroids in background */}
          <div className="background-asteroid asteroid-1"></div>
          <div className="background-asteroid asteroid-2"></div>
          <div className="background-asteroid asteroid-3"></div>
        </div>
      )}

      {/* Render current game state */}
      {renderGameState()}
    </div>
  );
}
