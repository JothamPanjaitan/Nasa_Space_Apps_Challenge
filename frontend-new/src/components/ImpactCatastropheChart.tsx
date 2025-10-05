import React, { useMemo } from 'react';
import { ImpactData } from '../types/impact';
import './ImpactCatastropheChart.css';

interface ImpactCatastropheChartProps {
  impactData: ImpactData | null;
}

export default function ImpactCatastropheChart({ impactData }: ImpactCatastropheChartProps) {
  const chartData = useMemo(() => {
    if (!impactData) return null;

    // Calculate likelihood based on asteroid properties
    const calculateLikelihood = () => {
      const velocity = impactData.velocityKms || 20;
      const diameter = impactData.diameterM || 100;
      
      // Higher velocity and larger size = higher likelihood of catastrophic impact
      const velocityFactor = Math.min(velocity / 30, 1); // Normalize to 0-1
      const sizeFactor = Math.min(diameter / 1000, 1); // Normalize to 0-1
      
      return (velocityFactor * 0.6 + sizeFactor * 0.4) * 100; // 0-100%
    };

    // Calculate catastrophe levels for different impact types
    const calculateCatastropheLevels = () => {
      const tnt = impactData.tntEquivalentTons || 0;
      const crater = impactData.craterDiameterKm || 0;
      const blast = impactData.blastRadius || 0;
      const seismic = impactData.seismicMagnitude || 0;
      const tsunami = impactData.tsunamiRadius || 0;

      // Normalize to 0-100 scale
      const impactZone = Math.min((blast / 100) * 100, 100);
      const tsunamiZone = Math.min((tsunami / 500) * 100, 100);
      const seismicActivity = Math.min((seismic / 10) * 100, 100);
      const topography = Math.min((crater / 50) * 100, 100);
      
      // Atmospheric changes based on energy (Tunguska = 10-15 MT, K-T extinction = 100 million MT)
      const atmosphericChange = Math.min((tnt / 1e6 / 100) * 100, 100);

      return {
        impactZone,
        tsunamiZone,
        seismicActivity,
        topography,
        atmosphericChange
      };
    };

    const likelihood = calculateLikelihood();
    const catastrophe = calculateCatastropheLevels();

    return {
      likelihood,
      catastrophe,
      energy: impactData.kineticEnergyJ || 0,
      tnt: impactData.tntEquivalentTons || 0
    };
  }, [impactData]);

  // Calculate average impact catastrophe for X-axis
  const avgCatastrophe = useMemo(() => {
    if (!chartData) return 0;
    const { impactZone, tsunamiZone, seismicActivity, topography, atmosphericChange } = chartData.catastrophe;
    return (impactZone + tsunamiZone + seismicActivity + topography + atmosphericChange) / 5;
  }, [chartData]);

  if (!chartData) {
    return (
      <div className="impact-chart-container">
        <div className="no-data-message">
          <p>Select an asteroid to view impact catastrophe analysis</p>
        </div>
      </div>
    );
  }

  const { likelihood, catastrophe } = chartData;

  return (
    <div className="impact-chart-container">
      <div className="chart-header">
        <h3>📊 Likelihood vs Impact Catastrophe</h3>
        <p className="chart-subtitle">Risk Assessment Matrix</p>
      </div>

      {/* X-Y Coordinate Graph */}
      <div className="xy-graph">
        {/* Y-axis label */}
        <div className="y-axis-label">
          <span>LIKELIHOOD</span>
          <span className="axis-subtitle">(Inevitable)</span>
        </div>

        {/* Graph area */}
        <div className="graph-area">
          {/* Y-axis */}
          <div className="y-axis">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          {/* Grid and plot area */}
          <div className="plot-area">
            {/* Grid lines */}
            <div className="grid-lines">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={`h-${i}`} className="grid-line horizontal" />
              ))}
              {[0, 1, 2, 3, 4].map(i => (
                <div key={`v-${i}`} className="grid-line vertical" />
              ))}
            </div>

            {/* Quadrant labels */}
            <div className="quadrant top-left">
              <span className="quadrant-label">High Risk</span>
            </div>
            <div className="quadrant top-right">
              <span className="quadrant-label">Critical</span>
            </div>
            <div className="quadrant bottom-left">
              <span className="quadrant-label">Low Risk</span>
            </div>
            <div className="quadrant bottom-right">
              <span className="quadrant-label">Monitor</span>
            </div>

            {/* Data points for each catastrophe type */}
            <div 
              className="data-point impact-zone-point"
              style={{ 
                left: `${catastrophe.impactZone}%`, 
                bottom: `${likelihood}%` 
              }}
              title={`Impact Zone: ${catastrophe.impactZone.toFixed(1)}`}
            >
              <span className="point-icon">💥</span>
            </div>

            <div 
              className="data-point tsunami-point"
              style={{ 
                left: `${catastrophe.tsunamiZone}%`, 
                bottom: `${likelihood}%` 
              }}
              title={`Tsunami: ${catastrophe.tsunamiZone.toFixed(1)}`}
            >
              <span className="point-icon">🌊</span>
            </div>

            <div 
              className="data-point seismic-point"
              style={{ 
                left: `${catastrophe.seismicActivity}%`, 
                bottom: `${likelihood}%` 
              }}
              title={`Seismic: ${catastrophe.seismicActivity.toFixed(1)}`}
            >
              <span className="point-icon">🌍</span>
            </div>

            <div 
              className="data-point topography-point"
              style={{ 
                left: `${catastrophe.topography}%`, 
                bottom: `${likelihood}%` 
              }}
              title={`Topography: ${catastrophe.topography.toFixed(1)}`}
            >
              <span className="point-icon">🏔️</span>
            </div>

            <div 
              className="data-point atmospheric-point"
              style={{ 
                left: `${catastrophe.atmosphericChange}%`, 
                bottom: `${likelihood}%` 
              }}
              title={`Atmospheric: ${catastrophe.atmosphericChange.toFixed(1)}`}
            >
              <span className="point-icon">☁️</span>
            </div>

            {/* Average point (larger) */}
            <div 
              className="data-point average-point"
              style={{ 
                left: `${avgCatastrophe}%`, 
                bottom: `${likelihood}%` 
              }}
              title={`Average: ${avgCatastrophe.toFixed(1)}`}
            >
              <span className="point-icon">⚠️</span>
            </div>
          </div>

          {/* X-axis */}
          <div className="x-axis">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* X-axis label */}
        <div className="x-axis-label">
          <span className="axis-subtitle">(Not Possible)</span>
          <span>IMPACT CATASTROPHE</span>
        </div>
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-icon">💥</span>
          <span>Impact Zone</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🌊</span>
          <span>Tsunami</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🌍</span>
          <span>Seismic</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🏔️</span>
          <span>Topography</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">☁️</span>
          <span>Atmospheric</span>
        </div>
        <div className="legend-item average">
          <span className="legend-icon">⚠️</span>
          <span>Average</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Likelihood:</span>
          <span className="summary-value">{likelihood.toFixed(1)}%</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Catastrophe:</span>
          <span className="summary-value">{avgCatastrophe.toFixed(1)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Energy:</span>
          <span className="summary-value">{(chartData.energy / 1e15).toFixed(2)} PJ</span>
        </div>
      </div>
    </div>
  );
}
