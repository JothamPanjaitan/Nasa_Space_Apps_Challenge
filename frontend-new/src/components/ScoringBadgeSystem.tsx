import React, { useState, useEffect } from 'react';
import './ScoringBadgeSystem.css';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  category: 'exploration' | 'defense' | 'mitigation' | 'achievement';
  points: number;
}

export interface ScoreData {
  totalScore: number;
  explorationPoints: number;
  defensePoints: number;
  mitigationPoints: number;
  bonusPoints: number;
  badges: Badge[];
  level: number;
  rank: string;
}

interface ScoringBadgeSystemProps {
  gameData?: {
    playerChoice?: 'explore' | 'deflect' | 'mitigate' | null;
    asteroidParams?: any;
    impactData?: any;
    deflectionSuccess?: boolean;
    mitigationScore?: any;
  };
  compact?: boolean;
  showAnimation?: boolean;
  onScoreUpdate?: (score: ScoreData) => void;
}

const BADGE_DEFINITIONS: Omit<Badge, 'earned'>[] = [
  {
    id: 'first_discovery',
    name: 'First Discovery',
    description: 'Detected your first asteroid',
    icon: '🔭',
    category: 'exploration',
    points: 100
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    description: 'Explored asteroid parameters thoroughly',
    icon: '🔬',
    category: 'exploration',
    points: 300
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Analyzed impact scenarios in detail',
    icon: '📊',
    category: 'exploration',
    points: 250
  },
  {
    id: 'savior',
    name: 'The Savior',
    description: 'Successfully deflected an asteroid',
    icon: '🌟',
    category: 'defense',
    points: 5000
  },
  {
    id: 'perfect_deflection',
    name: 'Perfect Deflection',
    description: 'Deflected with 100% accuracy',
    icon: '🎯',
    category: 'defense',
    points: 2000
  },
  {
    id: 'early_warning',
    name: 'Early Warning',
    description: 'Detected threat with maximum warning time',
    icon: '⚠️',
    category: 'defense',
    points: 500
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    description: 'Protected over 10,000 lives',
    icon: '🛡️',
    category: 'mitigation',
    points: 1000
  },
  {
    id: 'coordinator',
    name: 'The Coordinator',
    description: 'Achieved 80%+ response coordination',
    icon: '🤝',
    category: 'mitigation',
    points: 800
  },
  {
    id: 'economist',
    name: 'The Economist',
    description: 'Prevented $1B+ in economic losses',
    icon: '💰',
    category: 'mitigation',
    points: 1500
  },
  {
    id: 'rapid_response',
    name: 'Rapid Response',
    description: 'Executed emergency plan in record time',
    icon: '⚡',
    category: 'mitigation',
    points: 600
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    description: 'Investigated multiple impact scenarios',
    icon: '🌍',
    category: 'exploration',
    points: 400
  },
  {
    id: 'master_strategist',
    name: 'Master Strategist',
    description: 'Completed all mission phases successfully',
    icon: '🎖️',
    category: 'achievement',
    points: 3000
  },
  {
    id: 'humanitarian',
    name: 'Humanitarian',
    description: 'Prioritized civilian safety above all',
    icon: '❤️',
    category: 'mitigation',
    points: 1200
  },
  {
    id: 'tech_innovator',
    name: 'Tech Innovator',
    description: 'Used advanced deflection techniques',
    icon: '🚀',
    category: 'defense',
    points: 700
  },
  {
    id: 'global_hero',
    name: 'Global Hero',
    description: 'Earned maximum score across all categories',
    icon: '🏆',
    category: 'achievement',
    points: 10000
  }
];

const RANK_THRESHOLDS = [
  { threshold: 0, rank: 'Cadet', icon: '🎓' },
  { threshold: 1000, rank: 'Observer', icon: '👁️' },
  { threshold: 3000, rank: 'Analyst', icon: '📊' },
  { threshold: 5000, rank: 'Specialist', icon: '🔬' },
  { threshold: 8000, rank: 'Commander', icon: '⭐' },
  { threshold: 12000, rank: 'Hero', icon: '🦸' },
  { threshold: 20000, rank: 'Legend', icon: '🏆' }
];

export const ScoringBadgeSystem: React.FC<ScoringBadgeSystemProps> = ({
  gameData,
  compact = false,
  showAnimation = true,
  onScoreUpdate
}) => {
  const [scoreData, setScoreData] = useState<ScoreData>({
    totalScore: 0,
    explorationPoints: 0,
    defensePoints: 0,
    mitigationPoints: 0,
    bonusPoints: 0,
    badges: [],
    level: 1,
    rank: 'Cadet'
  });

  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  // Calculate score based on game data
  useEffect(() => {
    if (!gameData) return;

    let explorationPoints = 0;
    let defensePoints = 0;
    let mitigationPoints = 0;
    let bonusPoints = 0;

    // Exploration scoring
    if (gameData.playerChoice === 'explore') {
      explorationPoints += 300;
    }
    if (gameData.asteroidParams) {
      explorationPoints += 200;
    }
    if (gameData.impactData) {
      explorationPoints += 500;
    }

    // Defense scoring
    if (gameData.playerChoice === 'deflect') {
      defensePoints += 1000;
    }
    if (gameData.deflectionSuccess) {
      defensePoints += 5000;
      bonusPoints += 2000;
    }

    // Mitigation scoring
    if (gameData.playerChoice === 'mitigate') {
      mitigationPoints += 500;
    }
    if (gameData.mitigationScore) {
      mitigationPoints += gameData.mitigationScore.livesSaved * 10;
      mitigationPoints += Math.floor((gameData.mitigationScore.economicImpactReduced || 0) / 1000000);
      
      if (gameData.mitigationScore.responseCoordination > 70) {
        bonusPoints += 800;
      }
    }

    // Calculate badges
    const earnedBadges = calculateBadges(gameData);
    const badgePoints = earnedBadges.reduce((sum, badge) => sum + badge.points, 0);

    const totalScore = explorationPoints + defensePoints + mitigationPoints + bonusPoints + badgePoints;
    const level = Math.floor(totalScore / 1000) + 1;
    const rank = getRank(totalScore);

    const newScoreData: ScoreData = {
      totalScore,
      explorationPoints,
      defensePoints,
      mitigationPoints,
      bonusPoints,
      badges: earnedBadges,
      level,
      rank
    };

    setScoreData(newScoreData);

    // Check for new badges
    const previousBadgeIds = scoreData.badges.map(b => b.id);
    const newlyEarnedBadges = earnedBadges.filter(b => !previousBadgeIds.includes(b.id));
    
    if (newlyEarnedBadges.length > 0 && showAnimation) {
      setNewBadges(newlyEarnedBadges);
      setShowBadgeNotification(true);
      setTimeout(() => setShowBadgeNotification(false), 5000);
    }

    if (onScoreUpdate) {
      onScoreUpdate(newScoreData);
    }
  }, [gameData]);

  const calculateBadges = (data: any): Badge[] => {
    return BADGE_DEFINITIONS.map(badgeDef => {
      let earned = false;

      switch (badgeDef.id) {
        case 'first_discovery':
          earned = !!data.asteroidParams;
          break;
        case 'scientist':
          earned = data.playerChoice === 'explore' || !!data.asteroidParams;
          break;
        case 'data_analyst':
          earned = !!data.impactData;
          break;
        case 'savior':
          earned = data.deflectionSuccess === true;
          break;
        case 'perfect_deflection':
          earned = data.deflectionSuccess === true && data.deflectionAccuracy >= 100;
          break;
        case 'early_warning':
          earned = data.impactData?.earlyWarningTime > 86400 * 30;
          break;
        case 'guardian':
          earned = data.mitigationScore?.livesSaved > 10000;
          break;
        case 'coordinator':
          earned = data.mitigationScore?.responseCoordination > 80;
          break;
        case 'economist':
          earned = data.mitigationScore?.economicImpactReduced > 1e9;
          break;
        case 'rapid_response':
          earned = data.mitigationScore?.responseTime < 3600;
          break;
        case 'explorer':
          earned = data.playerChoice === 'explore';
          break;
        case 'master_strategist':
          earned = data.deflectionSuccess && data.mitigationScore?.livesSaved > 5000;
          break;
        case 'humanitarian':
          earned = data.mitigationScore?.livesSaved > 5000;
          break;
        case 'tech_innovator':
          earned = data.deflectionSuccess && data.deflectionMethod === 'advanced';
          break;
        case 'global_hero':
          earned = data.deflectionSuccess && data.mitigationScore?.livesSaved > 50000;
          break;
      }

      return { ...badgeDef, earned };
    });
  };

  const getRank = (score: number): string => {
    for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= RANK_THRESHOLDS[i].threshold) {
        return RANK_THRESHOLDS[i].rank;
      }
    }
    return 'Cadet';
  };

  const getRankIcon = (rank: string): string => {
    const rankData = RANK_THRESHOLDS.find(r => r.rank === rank);
    return rankData?.icon || '🎓';
  };

  const getProgressToNextRank = (): { current: number; next: number; percentage: number } => {
    const currentRankIndex = RANK_THRESHOLDS.findIndex(r => r.rank === scoreData.rank);
    if (currentRankIndex === RANK_THRESHOLDS.length - 1) {
      return { current: scoreData.totalScore, next: scoreData.totalScore, percentage: 100 };
    }

    const currentThreshold = RANK_THRESHOLDS[currentRankIndex].threshold;
    const nextThreshold = RANK_THRESHOLDS[currentRankIndex + 1].threshold;
    const progress = scoreData.totalScore - currentThreshold;
    const required = nextThreshold - currentThreshold;
    const percentage = Math.min(100, (progress / required) * 100);

    return { current: currentThreshold, next: nextThreshold, percentage };
  };

  const earnedBadges = scoreData.badges.filter(b => b.earned);
  const lockedBadges = scoreData.badges.filter(b => !b.earned);
  const progress = getProgressToNextRank();

  if (compact) {
    return (
      <div className="scoring-badge-compact">
        <div className="score-summary">
          <div className="score-value">
            <span className="score-number">{scoreData.totalScore.toLocaleString()}</span>
            <span className="score-label">Points</span>
          </div>
          <div className="rank-badge">
            <span className="rank-icon">{getRankIcon(scoreData.rank)}</span>
            <span className="rank-name">{scoreData.rank}</span>
          </div>
          <div className="badges-count">
            <span className="badge-icon">🏆</span>
            <span className="badge-count">{earnedBadges.length}/{scoreData.badges.length}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scoring-badge-system">
      {/* Badge Notification */}
      {showBadgeNotification && newBadges.length > 0 && (
        <div className="badge-notification">
          <div className="notification-content">
            <h3>🎉 New Badge{newBadges.length > 1 ? 's' : ''} Earned!</h3>
            {newBadges.map(badge => (
              <div key={badge.id} className="new-badge-item">
                <span className="badge-icon-large">{badge.icon}</span>
                <div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-description">{badge.description}</div>
                  <div className="badge-points">+{badge.points} points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Overview */}
      <div className="score-overview">
        <div className="score-header">
          <h2>Mission Score</h2>
          <div className="total-score">
            <span className="score-number">{scoreData.totalScore.toLocaleString()}</span>
            <span className="score-label">Total Points</span>
          </div>
        </div>

        <div className="score-breakdown">
          <div className="score-category">
            <span className="category-icon">🔬</span>
            <span className="category-label">Exploration</span>
            <span className="category-value">{scoreData.explorationPoints.toLocaleString()}</span>
          </div>
          <div className="score-category">
            <span className="category-icon">🚀</span>
            <span className="category-label">Defense</span>
            <span className="category-value">{scoreData.defensePoints.toLocaleString()}</span>
          </div>
          <div className="score-category">
            <span className="category-icon">🛡️</span>
            <span className="category-label">Mitigation</span>
            <span className="category-value">{scoreData.mitigationPoints.toLocaleString()}</span>
          </div>
          <div className="score-category">
            <span className="category-icon">⭐</span>
            <span className="category-label">Bonus</span>
            <span className="category-value">{scoreData.bonusPoints.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Rank Progress */}
      <div className="rank-section">
        <div className="rank-header">
          <div className="current-rank">
            <span className="rank-icon-large">{getRankIcon(scoreData.rank)}</span>
            <div>
              <div className="rank-name">{scoreData.rank}</div>
              <div className="rank-level">Level {scoreData.level}</div>
            </div>
          </div>
        </div>

        <div className="rank-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="progress-labels">
            <span>{progress.current.toLocaleString()}</span>
            <span>{progress.percentage.toFixed(0)}%</span>
            <span>{progress.next.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="badges-section">
        <h3>🏆 Achievements ({earnedBadges.length}/{scoreData.badges.length})</h3>
        
        <div className="badges-grid">
          {earnedBadges.map(badge => (
            <div key={badge.id} className="badge-card earned">
              <span className="badge-icon">{badge.icon}</span>
              <div className="badge-info">
                <div className="badge-name">{badge.name}</div>
                <div className="badge-description">{badge.description}</div>
                <div className="badge-points">+{badge.points} pts</div>
              </div>
            </div>
          ))}
          
          {lockedBadges.map(badge => (
            <div key={badge.id} className="badge-card locked">
              <span className="badge-icon">🔒</span>
              <div className="badge-info">
                <div className="badge-name">{badge.name}</div>
                <div className="badge-description">{badge.description}</div>
                <div className="badge-points">{badge.points} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoringBadgeSystem;
