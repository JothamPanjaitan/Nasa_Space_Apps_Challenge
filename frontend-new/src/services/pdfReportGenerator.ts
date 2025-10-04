// PDF Report Generator for Impact Simulations
// Generates comprehensive PDF reports with charts and data

import { ImpactData } from './simulationEngine';
import { OverpressureProfile } from './overpressureCalculations';

export interface ReportData {
  impactData: ImpactData;
  overpressure?: OverpressureProfile;
  thermal?: any;
  tsunami?: any;
  asteroidInfo?: {
    name: string;
    diameter: number;
    velocity: number;
    density: number;
  };
  timestamp: Date;
}

/**
 * Generate HTML report content
 */
function generateHTMLReport(data: ReportData): string {
  const { impactData, overpressure, thermal, tsunami, asteroidInfo, timestamp } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asteroid Impact Assessment Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      border-bottom: 4px solid #d32f2f;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #d32f2f;
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    
    .classification {
      background: #d32f2f;
      color: white;
      padding: 10px;
      text-align: center;
      font-weight: bold;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      color: #1976d2;
      border-bottom: 2px solid #1976d2;
      padding-bottom: 8px;
      margin-bottom: 15px;
      font-size: 22px;
    }
    
    .section h3 {
      color: #424242;
      margin: 15px 0 10px 0;
      font-size: 18px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    
    .info-item {
      background: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #1976d2;
      border-radius: 4px;
    }
    
    .info-item .label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .info-item .value {
      font-size: 20px;
      color: #1976d2;
      font-weight: bold;
    }
    
    .info-item .unit {
      font-size: 14px;
      color: #666;
      font-weight: normal;
    }
    
    .warning-box {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    .danger-box {
      background: #ffebee;
      border-left: 4px solid #d32f2f;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    .info-box {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    table th {
      background: #1976d2;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    
    table td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    
    table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .recommendations {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    .recommendations ul {
      margin: 10px 0 0 20px;
    }
    
    .recommendations li {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .chart-placeholder {
      background: #f5f5f5;
      border: 2px dashed #ccc;
      padding: 40px;
      text-align: center;
      color: #999;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌍 ASTEROID IMPACT ASSESSMENT REPORT</h1>
    <div class="subtitle">
      Generated: ${timestamp.toLocaleString()}<br>
      NASA Space Apps Challenge - Impact Simulation System
    </div>
  </div>

  <div class="classification">
    ⚠️ CLASSIFIED - FOR EMERGENCY RESPONSE PLANNING ONLY
  </div>

  ${asteroidInfo ? `
  <div class="section">
    <h2>1. Asteroid Characteristics</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Asteroid Name</div>
        <div class="value">${asteroidInfo.name}</div>
      </div>
      <div class="info-item">
        <div class="label">Diameter</div>
        <div class="value">${asteroidInfo.diameter.toFixed(3)} <span class="unit">km</span></div>
      </div>
      <div class="info-item">
        <div class="label">Impact Velocity</div>
        <div class="value">${asteroidInfo.velocity.toFixed(2)} <span class="unit">km/s</span></div>
      </div>
      <div class="info-item">
        <div class="label">Density</div>
        <div class="value">${asteroidInfo.density} <span class="unit">kg/m³</span></div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2>2. Impact Location & Energy</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Impact Coordinates</div>
        <div class="value">${impactData.impactLocation.lat.toFixed(4)}°, ${impactData.impactLocation.lng.toFixed(4)}°</div>
      </div>
      <div class="info-item">
        <div class="label">Kinetic Energy</div>
        <div class="value">${(impactData.energy / 1e18).toFixed(2)} <span class="unit">EJ</span></div>
      </div>
      <div class="info-item">
        <div class="label">TNT Equivalent</div>
        <div class="value">${(impactData.tntEquivalent / 1e6).toFixed(2)} <span class="unit">Megatons</span></div>
      </div>
      <div class="info-item">
        <div class="label">Seismic Magnitude</div>
        <div class="value">${impactData.seismicMagnitude.toFixed(1)} <span class="unit">Richter</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>3. Crater Formation</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Crater Diameter</div>
        <div class="value">${(impactData.craterDiameter / 1000).toFixed(2)} <span class="unit">km</span></div>
      </div>
      <div class="info-item">
        <div class="label">Crater Depth</div>
        <div class="value">${(impactData.craterDepth).toFixed(0)} <span class="unit">m</span></div>
      </div>
      <div class="info-item">
        <div class="label">Ejecta Volume</div>
        <div class="value">${impactData.ejectaVolume.toFixed(2)} <span class="unit">km³</span></div>
      </div>
      <div class="info-item">
        <div class="label">Fireball Radius</div>
        <div class="value">${impactData.fireballRadius.toFixed(2)} <span class="unit">km</span></div>
      </div>
    </div>
  </div>

  ${overpressure ? `
  <div class="section">
    <h2>4. Overpressure Effects (Hopkinson-Cranz Scaling)</h2>
    <div class="danger-box">
      <strong>⚠️ Critical Damage Zones:</strong> Overpressure calculations based on empirical blast wave scaling laws.
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Overpressure</th>
          <th>Radius (km)</th>
          <th>Effects</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>100 psi</strong></td>
          <td>${(overpressure.criticalRadii.R_100psi_m / 1000).toFixed(2)}</td>
          <td>Total destruction, crater formation, 100% fatality</td>
        </tr>
        <tr>
          <td><strong>20 psi</strong></td>
          <td>${(overpressure.criticalRadii.R_20psi_m / 1000).toFixed(2)}</td>
          <td>Severe structural damage, concrete buildings collapse</td>
        </tr>
        <tr>
          <td><strong>5 psi</strong></td>
          <td>${(overpressure.criticalRadii.R_5psi_m / 1000).toFixed(2)}</td>
          <td>Moderate to severe damage, most buildings destroyed</td>
        </tr>
        <tr>
          <td><strong>1 psi</strong></td>
          <td>${(overpressure.criticalRadii.R_1psi_m / 1000).toFixed(2)}</td>
          <td>Light damage, window breakage, minor injuries</td>
        </tr>
        <tr>
          <td><strong>0.5 psi</strong></td>
          <td>${(overpressure.criticalRadii.R_0_5psi_m / 1000).toFixed(2)}</td>
          <td>Window glass shattered, minor structural damage</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  ${thermal ? `
  <div class="section">
    <h2>5. Thermal Radiation Effects</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Fireball Radius</div>
        <div class="value">${(thermal.fireballRadiusM / 1000).toFixed(2)} <span class="unit">km</span></div>
      </div>
      <div class="info-item">
        <div class="label">3rd Degree Burns</div>
        <div class="value">${(thermal.thirdDegreeBurnsRadiusM / 1000).toFixed(2)} <span class="unit">km</span></div>
      </div>
      <div class="info-item">
        <div class="label">2nd Degree Burns</div>
        <div class="value">${(thermal.secondDegreeBurnsRadiusM / 1000).toFixed(2)} <span class="unit">km</span></div>
      </div>
      <div class="info-item">
        <div class="label">Ignition Radius</div>
        <div class="value">${(thermal.ignitionRadiusM / 1000).toFixed(2)} <span class="unit">km</span></div>
      </div>
    </div>
  </div>
  ` : ''}

  ${tsunami ? `
  <div class="section">
    <h2>6. Tsunami Analysis</h2>
    <div class="info-box">
      <strong>🌊 Oceanic Impact Detected:</strong> Tsunami propagation modeling activated.
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Initial Wave Height</div>
        <div class="value">${tsunami.initialWaveHeight_m.toFixed(1)} <span class="unit">m</span></div>
      </div>
      <div class="info-item">
        <div class="label">Wave Speed</div>
        <div class="value">${tsunami.initialWaveSpeed_ms.toFixed(1)} <span class="unit">m/s</span></div>
      </div>
      <div class="info-item">
        <div class="label">Affected Coastlines</div>
        <div class="value">${tsunami.affectedCoastlines.length}</div>
      </div>
      <div class="info-item">
        <div class="label">Total Population at Risk</div>
        <div class="value">${tsunami.affectedCoastlines.reduce((sum: number, c: any) => sum + c.populationAtRisk, 0).toLocaleString()}</div>
      </div>
    </div>

    <h3>Affected Coastal Regions</h3>
    <table>
      <thead>
        <tr>
          <th>Location</th>
          <th>Distance (km)</th>
          <th>Arrival Time</th>
          <th>Wave Height (m)</th>
          <th>Population at Risk</th>
        </tr>
      </thead>
      <tbody>
        ${tsunami.affectedCoastlines.map((c: any) => `
          <tr>
            <td>${c.name}</td>
            <td>${c.distance_km.toFixed(0)}</td>
            <td>${Math.floor(c.arrivalTime_minutes / 60)}h ${Math.floor(c.arrivalTime_minutes % 60)}m</td>
            <td>${c.maxWaveHeight_m.toFixed(1)}</td>
            <td>${c.populationAtRisk.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>7. Human Impact Assessment</h2>
    <div class="danger-box">
      <strong>Population at Risk:</strong> ${impactData.populationAtRisk.toLocaleString()} people in immediate danger zone
    </div>
    
    <h3>Infrastructure at Risk</h3>
    <ul>
      ${impactData.infrastructureAtRisk.map(item => `<li>${item}</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>8. Mitigation Recommendations</h2>
    <div class="recommendations">
      <strong>Recommended Actions (${impactData.earlyWarningTime > 86400 ? 'Long-term' : 'Immediate'}):</strong>
      <ul>
        ${impactData.recommendedActions.map(action => `<li>${action}</li>`).join('')}
      </ul>
    </div>
    
    <div class="warning-box">
      <strong>Early Warning Time:</strong> ${(impactData.earlyWarningTime / 86400).toFixed(1)} days
    </div>
  </div>

  <div class="footer">
    <p><strong>Disclaimer:</strong> This report is generated by automated simulation software for educational and planning purposes.</p>
    <p>Actual impact effects may vary based on local conditions, impact angle, and asteroid composition.</p>
    <p>© 2025 NASA Space Apps Challenge - Asteroid Impact Simulation System</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate and download PDF report
 */
export async function generatePDFReport(data: ReportData): Promise<void> {
  const htmlContent = generateHTMLReport(data);
  
  // Create a new window with the report
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert('Please allow popups to generate the report');
    return;
  }
  
  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
  
  // Wait for content to load, then trigger print
  setTimeout(() => {
    reportWindow.print();
  }, 500);
}

/**
 * Download report as HTML file
 */
export function downloadHTMLReport(data: ReportData): void {
  const htmlContent = generateHTMLReport(data);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `asteroid_impact_report_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV data export
 */
export function generateCSVExport(data: ReportData): string {
  const { impactData, overpressure } = data;
  
  let csv = 'Parameter,Value,Unit\n';
  csv += `Impact Latitude,${impactData.impactLocation.lat},degrees\n`;
  csv += `Impact Longitude,${impactData.impactLocation.lng},degrees\n`;
  csv += `Energy,${impactData.energy},Joules\n`;
  csv += `TNT Equivalent,${impactData.tntEquivalent},tons\n`;
  csv += `Crater Diameter,${impactData.craterDiameter},meters\n`;
  csv += `Crater Depth,${impactData.craterDepth},meters\n`;
  csv += `Seismic Magnitude,${impactData.seismicMagnitude},Richter\n`;
  csv += `Population at Risk,${impactData.populationAtRisk},people\n`;
  
  if (overpressure) {
    csv += `\nOverpressure Zone,Radius (m)\n`;
    csv += `100 psi,${overpressure.criticalRadii.R_100psi_m}\n`;
    csv += `20 psi,${overpressure.criticalRadii.R_20psi_m}\n`;
    csv += `5 psi,${overpressure.criticalRadii.R_5psi_m}\n`;
    csv += `1 psi,${overpressure.criticalRadii.R_1psi_m}\n`;
    csv += `0.5 psi,${overpressure.criticalRadii.R_0_5psi_m}\n`;
  }
  
  return csv;
}

/**
 * Download CSV export
 */
export function downloadCSVExport(data: ReportData): void {
  const csv = generateCSVExport(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `asteroid_impact_data_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const PDFReportGenerator = {
  generatePDFReport,
  downloadHTMLReport,
  downloadCSVExport,
  generateCSVExport
};
