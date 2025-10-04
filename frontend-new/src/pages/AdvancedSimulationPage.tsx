// Advanced Simulation Page
// Integrates Cesium visualization with PDF report generation

import React, { useState } from 'react';
import CesiumImpactVisualization from '../components/CesiumImpactVisualization';
import { ImpactData } from '../services/simulationEngine';
import { generatePDFReport, downloadHTMLReport, downloadCSVExport, ReportData } from '../services/pdfReportGenerator';
import './AdvancedSimulationPage.css';

export const AdvancedSimulationPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showReportOptions, setShowReportOptions] = useState(false);

  const handleReportGenerate = (impactData: ImpactData) => {
    const data: ReportData = {
      impactData,
      timestamp: new Date()
    };
    setReportData(data);
    setShowReportOptions(true);
  };

  const handleDownloadPDF = () => {
    if (reportData) {
      generatePDFReport(reportData);
    }
  };

  const handleDownloadHTML = () => {
    if (reportData) {
      downloadHTMLReport(reportData);
    }
  };

  const handleDownloadCSV = () => {
    if (reportData) {
      downloadCSVExport(reportData);
    }
  };

  return (
    <div className="advanced-simulation-page">
      <CesiumImpactVisualization onReportGenerate={handleReportGenerate} />
      
      {showReportOptions && (
        <div className="report-options-overlay">
          <div className="report-options-modal">
            <h2>📄 Generate Report</h2>
            <p>Choose your preferred report format:</p>
            
            <div className="report-buttons">
              <button onClick={handleDownloadPDF} className="report-btn pdf">
                <span className="icon">📄</span>
                <span className="label">PDF Report</span>
                <span className="desc">Printable comprehensive report</span>
              </button>
              
              <button onClick={handleDownloadHTML} className="report-btn html">
                <span className="icon">🌐</span>
                <span className="label">HTML Report</span>
                <span className="desc">Interactive web document</span>
              </button>
              
              <button onClick={handleDownloadCSV} className="report-btn csv">
                <span className="icon">📊</span>
                <span className="label">CSV Data</span>
                <span className="desc">Raw data for analysis</span>
              </button>
            </div>
            
            <button onClick={() => setShowReportOptions(false)} className="close-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSimulationPage;
