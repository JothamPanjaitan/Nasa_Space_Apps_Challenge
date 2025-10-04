import React, { useState } from 'react';
import './EndScreen.css';

interface EndScreenProps {
  gameData: {
    playerChoice: 'explore' | 'deflect' | 'mitigate' | null;
    asteroidParams: any;
    impactData: any;
    deflectionSuccess: boolean;
    mitigationScore: any;
  };
  onRestart: () => void;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export default function EndScreen({ gameData, onRestart }: EndScreenProps) {
  const [showReport, setShowReport] = useState(false);

  // Calculate badges based on player actions
  const calculateBadges = (): Badge[] => {
    const badges: Badge[] = [
      {
        id: 'scientist',
        name: 'The Scientist',
        description: 'Explored asteroid parameters',
        icon: '🔬',
        earned: gameData.playerChoice === 'explore' || !!gameData.asteroidParams
      },
      {
        id: 'savant',
        name: 'The Savior',
        description: 'Deflected asteroid successfully',
        icon: '🌟',
        earned: gameData.deflectionSuccess
      },
      {
        id: 'guardian',
        name: 'The Guardian',
        description: 'Protected lives through mitigation',
        icon: '🛡️',
        earned: !!gameData.mitigationScore && gameData.mitigationScore.livesSaved > 1000
      },
      {
        id: 'coordinator',
        name: 'The Coordinator',
        description: 'Achieved high response coordination',
        icon: '🤝',
        earned: !!gameData.mitigationScore && gameData.mitigationScore.responseCoordination > 70
      },
      {
        id: 'economist',
        name: 'The Economist',
        description: 'Prevented major economic losses',
        icon: '💰',
        earned: !!gameData.mitigationScore && gameData.mitigationScore.economicImpactReduced > 1000000000
      },
      {
        id: 'explorer',
        name: 'The Explorer',
        description: 'Investigated impact scenarios',
        icon: '🌍',
        earned: gameData.playerChoice === 'explore'
      }
    ];

    return badges;
  };

  const badges = calculateBadges();
  const earnedBadges = badges.filter(badge => badge.earned);
  
  // Calculate final score
  const calculateScore = () => {
    let totalScore = 0;
    
    // Base score from action taken
    if (gameData.playerChoice === 'deflect') totalScore += 1000;
    if (gameData.playerChoice === 'mitigate') totalScore += 500;
    if (gameData.playerChoice === 'explore') totalScore += 300;
    
    // Deflection bonus
    if (gameData.deflectionSuccess) totalScore += 5000;
    
    // Mitigation bonuses
    if (gameData.mitigationScore) {
      totalScore += gameData.mitigationScore.livesSaved * 10;
      totalScore += Math.floor(gameData.mitigationScore.economicImpactReduced / 1000000);
    }
    
    return totalScore;
  };

  const finalScore = calculateScore();

  // Generate report data
  const generateReport = () => {
    return {
      asteroid: {
        size: gameData.asteroidParams?.size || 'Unknown',
        velocity: gameData.asteroidParams?.velocity || 'Unknown',
        region: gameData.asteroidParams?.region || 'Unknown'
      },
      impact: gameData.impactData,
      deflection: gameData.deflectionSuccess,
      mitigation: gameData.mitigationScore,
      score: finalScore,
      badges: earnedBadges,
      dataSources: [
        'NASA NEO API - Orbital elements, size, velocity',
        'USGS Hazard Data - Seismic and tsunami modeling',
        'CIESIN Population Data - Casualty estimation',
        'NOAA Environmental Data - Climate impact modeling'
      ]
    };
  };

  const report = generateReport();

  if (showReport) {
    return (
      <div className="end-screen report-mode">
        <div className="space-background">
          <div className="stars">
            {Array.from({ length: 200 }, (_, i) => (
              <div key={i} className={`star star-${i % 3}`}></div>
            ))}
          </div>
          
          <div className="earth-final">
            <div className={`earth-glow ${gameData.deflectionSuccess ? 'safe' : 'scarred'}`}>
              <div className="earth-surface"></div>
              {!gameData.deflectionSuccess && <div className="impact-crater"></div>}
            </div>
          </div>
        </div>

        <div className="report-content">
          <h1>📊 Mission Report</h1>
          
          <div className="report-sections">
            <div className="report-section">
              <h3>Asteroid Analysis</h3>
              <div className="report-data">
                <p><strong>Size:</strong> {report.asteroid.size}m radius</p>
                <p><strong>Velocity:</strong> {report.asteroid.velocity} km/s</p>
                <p><strong>Target Region:</strong> {report.asteroid.region}</p>
              </div>
            </div>

            <div className="report-section">
              <h3>Impact Assessment</h3>
              <div className="report-data">
                <p><strong>Energy:</strong> {(report.impact?.energy / 1e15).toFixed(2)} PJ</p>
                <p><strong>TNT Equivalent:</strong> {(report.impact?.tntEquivalent / 1e6).toFixed(2)} MT</p>
                <p><strong>Crater Size:</strong> {(report.impact?.craterDiameter / 1000).toFixed(2)} km</p>
                <p><strong>Blast Radius:</strong> {report.impact?.blastRadius.toFixed(0)} km</p>
              </div>
            </div>

            <div className="report-section">
              <h3>Response Actions</h3>
              <div className="report-data">
                <p><strong>Deflection Success:</strong> {report.deflection ? '✅ Mission Accomplished' : '⚠️ Partial Success'}</p>
                <p><strong>Lives Protected:</strong> {report.mitigation?.livesSaved?.toLocaleString() || '0'}</p>
                <p><strong>Economic Impact Prevented:</strong> ${Math.floor((report.mitigation?.economicImpactReduced || 0) / 1e9)}B</p>
              </div>
            </div>

            <div className="report-section">
              <h3>Data Sources Used</h3>
              <div className="report-data">
                <ul className="data-sources">
                  {report.dataSources.map((source, index) => (
                    <li key={index}>{source}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="report-section badges-section">
              <h3>Achievement Badges</h3>
              <div className="report-badges">
                {earnedBadges.map((badge) => (
                  <div key={badge.id} className="badge-earned">
                    <span className="badge-icon">{badge.icon}</span>
                    <div className="badge-info">
                      <span className="badge-name">{badge.name}</span>
                      <span className="badge-description">{badge.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="report-actions">
            <button className="download-report-btn" onClick={() => console.log('Download PDF')}>
              📄 Download PDF Report
            </button>
            <button className="share-outcome-btn" onClick={() => console.log('Share outcome')}>
              📤 Share Your Outcome
            </button>
            <button className="back-to-summary-btn" onClick={() => setShowReport(false)}>
              ← Back to Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="end-screen">
      <div className="space-background">
        <div className="stars">
          {Array.from({ length: 200 }, (_, i) => (
            <div key={i} className={`star star-${i % 3}`}></div>
          ))}
        </div>
        
        <div className="earth-final">
          <div className={`earth-glow ${gameData.deflectionSuccess ? 'safe' : 'scarred'}`}>
            <div className="earth-surface"></div>
            {!gameData.deflectionSuccess && <div className="impact-crater"></div>}
          </div>
        </div>

        {/* Nebula effects */}
        <div className="nebula nebula-1"></div>
        <div className="nebula nebula-2"></div>
      </div>

      <div className="ending-content">
        <div className="final-summary">
          <h1>The Future is in Our Hands</h1>
          
          <div className="outcome-message">
            {gameData.deflectionSuccess ? (
              <div className="success-outcome">
                <h2>🌟 Humanity Triumphs!</h2>
                <p>Your deflection mission succeeded! The asteroid 'Impactor-2025' has been safely diverted away from Earth.</p>
                <p>Through international cooperation and scientific excellence, billions of lives have been saved.</p>
                <p>The world celebrates this victory while recognizing that constant vigilance remains our greatest defense.</p>
              </div>
            ) : gameData.mitigationScore ? (
              <div className="mitigation-outcome">
                <h2>🛡️ Resilience Prevails</h2>
                <p>While impact occurred, your mitigation efforts saved countless lives.</p>
                <p>From the ashes of devastation, humanity emerges stronger, more prepared, and united.</p>
                <p>This experience teaches us that preparation, cooperation, and quick response can change the outcome.</p>
              </div>
            ) : (
              <div className="exploration-outcome">
                <h2>🔬 Knowledge is Power</h2>
                <p>Through scientific exploration, you've gained invaluable understanding of asteroid threats.</p>
                <p>This knowledge prepares us for future encounters and informs our planetary defense strategies.</p>
                <p>Understanding the enemy is the first step towards effective protection.</p>
              </div>
            )}
          </div>

          <div className="final-score">
            <h3>Mission Score: {finalScore.toLocaleString()} Points</h3>
            <div className="score-breakdown">
              {gameData.playerChoice === 'deflect' && <p>📡 Deflection Mission: +1000 points</p>}
              {gameData.playerChoice === 'mitigate' && <p>🛡️ Civil Protection: +500 points</p>}
              {gameData.playerChoice === 'explore' && <p>🔬 Scientific Exploration: +300 points</p>}
              {gameData.deflectionSuccess && <p>🌟 Successful Deflection: +5000 points</p>}
              {gameData.mitigationScore && (
                <>
                  <p>🫀 Lives Saved: +{(gameData.mitigationScore.livesSaved * 10).toLocaleString()} points</p>
                  <p>💰 Economic Impact Prevented: +{Math.floor(gameData.mitigationScore.economicImpactReduced / 1000000)} points</p>
                </>
              )}
            </div>
          </div>

          <div className="achievements">
           <h3>🏆 Achievements</h3>
            <div className="badges-grid">
              {earnedBadges.map((badge) => (
                <div key={badge.id} className="badge-card earned">
                  <span className="badge-icon">{badge.icon}</span>
                  <div className="badge-content">
                    <span className="badge-name">{badge.name}</span>
                    <span className="badge-description">{badge.description}</span>
                  </div>
                </div>
              ))}
              
              {badges.filter(b => !b.earned).map((badge) => (
                <div key={badge.id} className="badge-card locked">
                  <span className="badge-icon">🔒</span>
                  <div className="badge-content">
                    <span className="badge-name">{badge.name}</span>
                    <span className="badge-description">{badge.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="final-message">
            <div className="quote">
              <blockquote>
                "The best time to prepare for an asteroid impact was years ago. The second best time is now."
              </blockquote>
              <cite>— Planetary Defense Philosophy</cite>
            </div>
            
            <div className="data-attribution">
              <h4>📊 Educational Data Sources</h4>
              <div className="data-list">
                <p>• NASA NEO API - Real asteroid orbital data</p>
                <p>• USGS Hazard Assessment - Geological impact modeling</p>
                <p>• NOAA Environmental Data - Atmospheric and ocean effects</p>
                <p>• CIESIN Population - Demographic risk analysis</p>
                <p>• NASA PDCO - Deflection mission parameters</p>
              </div>
            </div>
          </div>

          <div className="game-actions">
            <button className="play-again-btn" onClick={onRestart}>
              🎮 Play Again
            </button>
            
            <button className="view-report-btn" onClick={() => setShowReport(true)}>
              📊 View Detailed Report
            </button>
            
            <button className="go-home-btn" onClick={() => window.location.reload()}>
              🏠 Return to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
