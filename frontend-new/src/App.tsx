import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameController from './game/GameController';
import ImpactMap from './ImpactMap';
import MitigationPage from './pages/MitigationPage';
import './styles/global.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-main">
        <Routes>
          <Route path="/" element={<GameController />} />
          <Route path="/impact" element={<ImpactMap />} />
          <Route path="/mitigation" element={<MitigationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;