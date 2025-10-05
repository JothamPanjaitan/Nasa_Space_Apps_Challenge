import React, { useState } from 'react';
import StoryIntro from './StoryIntro';
import OrbitalTrajectorySimulator from './OrbitalTrajectorySimulator';
import DeflectionMission from './DeflectionMission';
import CivilProtection from './CivilProtection';
import ImpactMap from '../ImpactMap';
import EndScreen from './EndScreen';
import FooterNav from '../components/FooterNav';
import HelpModal from '../components/HelpModal';
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
  const [showHelp, setShowHelp] = useState(false);
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
      // Go to simulator for study and exploration
      setGameState('simulator');
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

  // Handle navigation
  const handleNavigate = (targetState: string) => {
    if (targetState === 'back') {
      // Implement back navigation logic
      const stateOrder = ['intro', 'simulator', 'impact_map', 'deflection', 'civil_protection', 'ending'];
      const currentIndex = stateOrder.indexOf(gameState);
      if (currentIndex > 0) {
        setGameState(stateOrder[currentIndex - 1] as GameState);
      }
    } else {
      setGameState(targetState as GameState);
    }
  };

  // Handle help modal
  const handleHelp = () => {
    setShowHelp(true);
  };

  // Handle export functionality
  const handleExport = () => {
    // Export current simulation data
    const exportData = {
      gameState,
      gameData,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asteroid-simulation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Determine navigation state
  const canGoBack = gameState !== 'intro';
  const canGoForward = gameState !== 'ending';

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
        return <ImpactMap />;

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

      {/* Persistent Navigation */}
      <FooterNav
        currentState={gameState}
        onNavigate={handleNavigate}
        onHelp={handleHelp}
        onExport={gameState !== 'intro' ? handleExport : undefined}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        currentState={gameState}
      />
    </div>
  );
}
