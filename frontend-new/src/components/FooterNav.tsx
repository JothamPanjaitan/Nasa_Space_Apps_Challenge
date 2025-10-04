import React from 'react';
import './FooterNav.css';

interface FooterNavProps {
  currentState: string;
  onNavigate: (state: string) => void;
  onHelp: () => void;
  onExport?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export default function FooterNav({ 
  currentState, 
  onNavigate, 
  onHelp, 
  onExport,
  canGoBack = true,
  canGoForward = true 
}: FooterNavProps) {
  const getNavigationItems = () => {
    const items = [
      { id: 'intro', label: 'Home', icon: '🏠', disabled: false },
      { id: 'simulator', label: 'Simulator', icon: '🌌', disabled: false },
      { id: 'impact_map', label: 'Impact', icon: '💥', disabled: false },
      { id: 'deflection', label: 'Defend', icon: '🚀', disabled: false },
      { id: 'civil_protection', label: 'Protect', icon: '🛡️', disabled: false }
    ];

    return items.map(item => ({
      ...item,
      active: currentState === item.id,
      disabled: item.disabled
    }));
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="footer-nav">
      <div className="nav-container">
        {/* Back Button */}
        <button 
          className={`nav-button back-button ${!canGoBack ? 'disabled' : ''}`}
          onClick={() => onNavigate('back')}
          disabled={!canGoBack}
          title="Go Back"
        >
          ← Back
        </button>

        {/* Main Navigation */}
        <div className="nav-items">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`nav-button ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={() => !item.disabled && onNavigate(item.id)}
              disabled={item.disabled}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="nav-actions">
          <button 
            className="nav-button help-button"
            onClick={onHelp}
            title="Help & Information"
          >
            ❓ Help
          </button>
          
          {onExport && (
            <button 
              className="nav-button export-button"
              onClick={onExport}
              title="Export Results"
            >
              📊 Export
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${getProgressPercentage()}%` 
          }}
        />
      </div>
    </div>
  );

  function getProgressPercentage() {
    const states = ['intro', 'simulator', 'impact_map', 'deflection', 'civil_protection', 'ending'];
    const currentIndex = states.indexOf(currentState);
    return Math.max(0, (currentIndex / (states.length - 1)) * 100);
  }
}
