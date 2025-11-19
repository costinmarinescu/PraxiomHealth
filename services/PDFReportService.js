/**
 * PDFReportService.js - Clinical-Grade PDF Report Generation
 * Generates Personal Vitality Roadmap and Bio-Age Assessment Reports
 * Version: 2025 Edition
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

class PDFReportService {
  constructor() {
    this.logoBase64 = null; // Will be loaded on init
    this.initializeService();
  }

  async initializeService() {
    try {
      // Load logo as base64 for PDF embedding
      // You can add your logo base64 here or load from assets
      console.log('📄 PDF Report Service initialized');
    } catch (error) {
      console.error('Error initializing PDF service:', error);
    }
  }

  /**
   * Generate comprehensive Bio-Age Assessment Report
   */
  async generateBioAgeReport(data) {
    const {
      userProfile,
      bioAge,
      chronologicalAge,
      scores,
      tier1Data,
      tier2Data,
      tier3Data,
      recommendations,
      assessmentDate = new Date().toISOString(),
    } = data;

    const ageDeviation = bioAge - chronologicalAge;
    const riskCategory = this.getRiskCategory(ageDeviation);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #FF6B35 0%, #00CED1 100%);
      color: white;
      border-radius: 10px;
    }
    
    .logo {
      width: 150px;
      margin-bottom: 10px;
    }
    
    h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 300;
      letter-spacing: 1px;
    }
    
    h2 {
      color: #FF6B35;
      font-size: 24px;
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #FF6B35;
    }
    
    h3 {
      color: #333;
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .bio-age-display {
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
      border-radius: 15px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .age-number {
      font-size: 72px;
      font-weight: bold;
      color: ${ageDeviation <= 0 ? '#4CAF50' : ageDeviation <= 5 ? '#FFC107' : '#F44336'};
      margin: 0;
    }
    
    .age-label {
      font-size: 18px;
      color: #666;
      margin-top: 10px;
    }
    
    .deviation {
      font-size: 24px;
      margin-top: 15px;
      color: ${ageDeviation <= 0 ? '#4CAF50' : ageDeviation <= 5 ? '#FFC107' : '#F44336'};
    }
    
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .score-card {
      background: #f9f9f9;
      border-radius: 10px;
      padding: 15px;
      border-left: 4px solid #00CED1;
    }
    
    .score-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .score-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    
    .score-status {
      font-size: 12px;
      margin-top: 5px;
    }
    
    .optimal { color: #4CAF50; }
    .warning { color: #FFC107; }
    .danger { color: #F44336; }
    
    .biomarker-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .biomarker-table th {
      background: #FF6B35;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 500;
    }
    
    .biomarker-table td {
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .biomarker-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .value-optimal { color: #4CAF50; font-weight: bold; }
    .value-normal { color: #333; }
    .value-risk { color: #F44336; font-weight: bold; }
    
    .recommendations {
      background: #f0f8ff;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #00CED1;
    }
    
    .recommendation-item {
      margin: 10px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .recommendation-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #00CED1;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .chart-placeholder {
      background: #f5f5f5;
      height: 200px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <!-- Page 1: Overview -->
  <div class="header">
    <h1>PRAXIOM HEALTH</h1>
    <p style="margin: 0; font-size: 16px;">Personal Vitality Roadmap</p>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <p style="margin: 5px 0;"><strong>Assessment Date:</strong> ${new Date(assessmentDate).toLocaleDateString()}</p>
    <p style="margin: 5px 0;"><strong>Assessment Tier:</strong> ${data.assessmentTier || 'Foundation'}</p>
  </div>
  
  <div class="bio-age-display">
    <div class="age-number">${bioAge.toFixed(1)}</div>
    <div class="age-label">Biological Age (years)</div>
    <div class="deviation">
      ${ageDeviation > 0 ? '+' : ''}${ageDeviation.toFixed(1)} years ${ageDeviation > 0 ? 'older' : 'younger'} than chronological age
    </div>
    <div style="margin-top: 10px; font-size: 14px;">
      Risk Category: <span class="${riskCategory.toLowerCase()}">${riskCategory}</span>
    </div>
  </div>
  
  <h2>Health Scores Overview</h2>
  <div class="scores-grid">
    <div class="score-card">
      <div class="score-title">Oral Health Score</div>
      <div class="score-value ${this.getScoreClass(scores.oralHealthScore)}">${scores.oralHealthScore.toFixed(1)}%</div>
      <div class="score-status ${this.getScoreClass(scores.oralHealthScore)}">
        ${this.getScoreStatus(scores.oralHealthScore)}
      </div>
    </div>
    
    <div class="score-card">
      <div class="score-title">Systemic Health Score</div>
      <div class="score-value ${this.getScoreClass(scores.systemicHealthScore)}">${scores.systemicHealthScore.toFixed(1)}%</div>
      <div class="score-status ${this.getScoreClass(scores.systemicHealthScore)}">
        ${this.getScoreStatus(scores.systemicHealthScore)}
      </div>
    </div>
    
    <div class="score-card">
      <div class="score-title">Vitality Index</div>
      <div class="score-value ${this.getScoreClass(scores.vitalityIndex)}">${scores.vitalityIndex.toFixed(1)}%</div>
      <div class="score-status ${this.getScoreClass(scores.vitalityIndex)}">
        ${this.getScoreStatus(scores.vitalityIndex)}
      </div>
    </div>
    
    ${scores.fitnessScore !== null ? `
    <div class="score-card">
      <div class="score-title">Fitness Score</div>
      <div class="score-value ${this.getScoreClass(scores.fitnessScore)}">${scores.fitnessScore.toFixed(1)}%</div>
      <div class="score-status ${this.getScoreClass(scores.fitnessScore)}">
        ${this.getScoreStatus(scores.fitnessScore)}
      </div>
    </div>
    ` : ''}
  </div>
  
  <div class="page-break"></div>
  
  <!-- Page 2: Biomarker Details -->
  <h2>Tier 1: Foundation Biomarkers</h2>
  <table class="biomarker-table">
    <thead>
      <tr>
        <th>Biomarker</th>
        <th>Your Value</th>
        <th>Optimal Range</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Salivary pH</td>
        <td class="${this.getValueClass(tier1Data.salivaryPH, 6.5, 7.2, 6.0, 7.5)}">${tier1Data.salivaryPH || 'N/A'}</td>
        <td>6.5-7.2</td>
        <td>${this.getValueStatus(tier1Data.salivaryPH, 6.5, 7.2, 6.0, 7.5)}</td>
      </tr>
      <tr>
        <td>MMP-8 (ng/mL)</td>
        <td class="${this.getValueClass(tier1Data.mmp8, 0, 60, 60, 100)}">${tier1Data.mmp8 || 'N/A'}</td>
        <td>&lt;60</td>
        <td>${this.getValueStatus(tier1Data.mmp8, 0, 60, 60, 100)}</td>
      </tr>
      <tr>
        <td>Flow Rate (mL/min)</td>
        <td class="${this.getValueClass(tier1Data.flowRate, 1.5, 999, 1.0, 1.5)}">${tier1Data.flowRate || 'N/A'}</td>
        <td>&gt;1.5</td>
        <td>${this.getValueStatus(tier1Data.flowRate, 1.5, 999, 1.0, 1.5)}</td>
      </tr>
      <tr>
        <td>hs-CRP (mg/L)</td>
        <td class="${this.getValueClass(tier1Data.hsCRP, 0, 1.0, 1.0, 3.0)}">${tier1Data.hsCRP || 'N/A'}</td>
        <td>&lt;1.0</td>
        <td>${this.getValueStatus(tier1Data.hsCRP, 0, 1.0, 1.0, 3.0)}</td>
      </tr>
      <tr>
        <td>Omega-3 Index (%)</td>
        <td class="${this.getValueClass(tier1Data.omega3Index, 8.0, 999, 6.0, 8.0)}">${tier1Data.omega3Index || 'N/A'}</td>
        <td>&gt;8.0</td>
        <td>${this.getValueStatus(tier1Data.omega3Index, 8.0, 999, 6.0, 8.0)}</td>
      </tr>
      <tr>
        <td>HbA1c (%)</td>
        <td class="${this.getValueClass(tier1Data.hba1c, 0, 5.7, 5.7, 6.4)}">${tier1Data.hba1c || 'N/A'}</td>
        <td>&lt;5.7</td>
        <td>${this.getValueStatus(tier1Data.hba1c, 0, 5.7, 5.7, 6.4)}</td>
      </tr>
      <tr>
        <td>GDF-15 (pg/mL)</td>
        <td class="${this.getValueClass(tier1Data.gdf15, 0, 1200, 1200, 1800)}">${tier1Data.gdf15 || 'N/A'}</td>
        <td>&lt;1200</td>
        <td>${this.getValueStatus(tier1Data.gdf15, 0, 1200, 1200, 1800)}</td>
      </tr>
      <tr>
        <td>Vitamin D (ng/mL)</td>
        <td class="${this.getValueClass(tier1Data.vitaminD, 40, 60, 30, 40)}">${tier1Data.vitaminD || 'N/A'}</td>
        <td>40-60</td>
        <td>${this.getValueStatus(tier1Data.vitaminD, 40, 60, 30, 40)}</td>
      </tr>
      ${tier1Data.hrv ? `
      <tr>
        <td>HRV (ms)</td>
        <td>${tier1Data.hrv}</td>
        <td>Age-adjusted</td>
        <td>${scores.hrvScore > 75 ? 'Optimal' : scores.hrvScore > 60 ? 'Good' : 'Needs Improvement'}</td>
      </tr>
      ` : ''}
    </tbody>
  </table>
  
  ${tier2Data && Object.values(tier2Data).some(v => v !== null) ? `
  <h2>Tier 2: Personalization Biomarkers</h2>
  <div class="chart-placeholder">Advanced biomarker data available - see detailed report</div>
  ` : ''}
  
  ${tier3Data && Object.values(tier3Data).some(v => v !== null) ? `
  <h2>Tier 3: Optimization Metrics</h2>
  <div class="chart-placeholder">Epigenetic and proteomic data available - see detailed report</div>
  ` : ''}
  
  <div class="page-break"></div>
  
  <!-- Page 3: Recommendations -->
  <h2>Personalized Recommendations</h2>
  
  ${this.generateRecommendationsHTML(scores, tier1Data, ageDeviation)}
  
  <h2>Next Steps</h2>
  <div class="recommendations">
    ${this.generateNextStepsHTML(scores, tier1Data)}
  </div>
  
  <h2>Follow-Up Schedule</h2>
  <table class="biomarker-table">
    <thead>
      <tr>
        <th>Timeline</th>
        <th>Assessment Focus</th>
        <th>Expected Outcome</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>6 Weeks</td>
        <td>Biomarker recheck</td>
        <td>Early response tracking</td>
      </tr>
      <tr>
        <td>3 Months</td>
        <td>Full Tier 1 reassessment</td>
        <td>Bio-Age & Vitality shift</td>
      </tr>
      <tr>
        <td>6 Months</td>
        <td>Tier review</td>
        <td>Protocol upgrade if needed</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p><strong>Praxiom Health</strong> | Bio-Age Longevity Protocol</p>
    <p>This report is for informational purposes only and does not constitute medical advice.</p>
    <p>Please consult with your healthcare provider before making any changes to your health regimen.</p>
    <p style="margin-top: 10px;">Report generated: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false,
      });
      
      // Save with custom filename
      const filename = `PraxiomHealth_BioAge_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const newUri = FileSystem.documentDirectory + filename;
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Bio-Age Report',
        });
      }
      
      return {
        success: true,
        uri: newUri,
        filename,
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate Personal Vitality Roadmap (Summary Report)
   */
  async generateVitalityRoadmap(data) {
    const {
      userProfile,
      bioAge,
      chronologicalAge,
      scores,
      immediateActions,
      targetBioAge,
    } = data;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      background: linear-gradient(135deg, #FF6B35 0%, #00CED1 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    h1 { margin: 0; font-size: 28px; }
    h2 { color: #FF6B35; margin-top: 30px; }
    
    .bio-age-summary {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 10px;
    }
    
    .age-item {
      text-align: center;
    }
    
    .age-value {
      font-size: 36px;
      font-weight: bold;
      color: #333;
    }
    
    .age-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    
    .action-plan {
      background: #f0f8ff;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    
    .action-item {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    
    .action-item:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #00CED1;
      font-weight: bold;
    }
    
    .commitment {
      border: 2px solid #FF6B35;
      border-radius: 10px;
      padding: 20px;
      margin-top: 30px;
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 1px solid #333;
      width: 200px;
      display: inline-block;
      margin: 0 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PERSONAL VITALITY ROADMAP</h1>
    <p style="margin: 10px 0 0 0;">Your Path to Optimal Biological Age</p>
  </div>
  
  <div class="bio-age-summary">
    <div class="age-item">
      <div class="age-value">${chronologicalAge}</div>
      <div class="age-label">Chronological Age</div>
    </div>
    <div class="age-item">
      <div class="age-value" style="color: ${bioAge < chronologicalAge ? '#4CAF50' : '#F44336'}">
        ${bioAge.toFixed(1)}
      </div>
      <div class="age-label">Current Bio-Age</div>
    </div>
    <div class="age-item">
      <div class="age-value" style="color: #00CED1">${targetBioAge || (bioAge - 5).toFixed(1)}</div>
      <div class="age-label">Target Bio-Age</div>
    </div>
  </div>
  
  <h2>Your Current Status</h2>
  <p>Based on your assessment, your biological age is <strong>${bioAge.toFixed(1)} years</strong>, 
  which is <strong>${Math.abs(bioAge - chronologicalAge).toFixed(1)} years 
  ${bioAge > chronologicalAge ? 'older' : 'younger'}</strong> than your chronological age.</p>
  
  <h2>Immediate Action Plan (Next 3 Months)</h2>
  <div class="action-plan">
    ${this.generateActionPlanHTML(scores, data.tier1Data)}
  </div>
  
  <h2>Key Focus Areas</h2>
  ${this.generateFocusAreasHTML(scores)}
  
  <h2>Your Commitment to Vitality</h2>
  <div class="commitment">
    <p><strong>I commit to following this roadmap to achieve my optimal biological age and healthspan.</strong></p>
    <p style="margin-top: 30px;">
      Signature: <span class="signature-line"></span>
      Date: <span class="signature-line"></span>
    </p>
  </div>
  
  <p style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
    Generated on ${new Date().toLocaleDateString()} | Praxiom Health © 2025
  </p>
</body>
</html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      
      const filename = `Vitality_Roadmap_${new Date().toISOString().split('T')[0]}.pdf`;
      const newUri = FileSystem.documentDirectory + filename;
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Vitality Roadmap',
        });
      }
      
      return {
        success: true,
        uri: newUri,
        filename,
      };
    } catch (error) {
      console.error('Error generating roadmap:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper functions
  getRiskCategory(deviation) {
    if (deviation <= -5) return 'Exceptional';
    if (deviation <= 2) return 'Optimal';
    if (deviation <= 5) return 'Moderate';
    return 'Elevated';
  }

  getScoreClass(score) {
    if (score >= 85) return 'optimal';
    if (score >= 75) return 'warning';
    return 'danger';
  }

  getScoreStatus(score) {
    if (score >= 85) return 'Optimal';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  getValueClass(value, optimalMin, optimalMax, normalMin, normalMax) {
    if (!value) return '';
    if (value >= optimalMin && value <= optimalMax) return 'value-optimal';
    if (value >= normalMin && value <= normalMax) return 'value-normal';
    return 'value-risk';
  }

  getValueStatus(value, optimalMin, optimalMax, normalMin, normalMax) {
    if (!value) return 'Not Tested';
    if (value >= optimalMin && value <= optimalMax) return 'Optimal';
    if (value >= normalMin && value <= normalMax) return 'Normal';
    return 'Risk';
  }

  generateRecommendationsHTML(scores, biomarkers, ageDeviation) {
    let html = '<div class="recommendations">';
    
    if (scores.oralHealthScore < 75) {
      html += `
        <h3>Oral Health Optimization</h3>
        <div class="recommendation-item">pH rinse twice daily with alkaline water</div>
        <div class="recommendation-item">Probiotic lozenges (L. reuteri DSM 17938)</div>
        <div class="recommendation-item">Professional dental cleaning every 3 months</div>
      `;
    }
    
    if (scores.systemicHealthScore < 75) {
      html += `
        <h3>Systemic Health Improvement</h3>
        <div class="recommendation-item">Omega-3 supplementation: 2-3g EPA+DHA daily</div>
        <div class="recommendation-item">Mediterranean-style diet implementation</div>
        <div class="recommendation-item">Anti-inflammatory protocol with curcumin</div>
      `;
    }
    
    if (biomarkers.gdf15 > 1500) {
      html += `
        <h3>Mitochondrial Support</h3>
        <div class="recommendation-item">NAD+ precursors (NMN 300-500mg or NR 500-1000mg daily)</div>
        <div class="recommendation-item">Time-restricted eating (16:8 protocol)</div>
        <div class="recommendation-item">High-intensity interval training 2x weekly</div>
      `;
    }
    
    if (scores.fitnessScore && scores.fitnessScore < 75) {
      html += `
        <h3>Fitness Enhancement</h3>
        <div class="recommendation-item">Structured exercise program 150 min/week moderate intensity</div>
        <div class="recommendation-item">Resistance training 3x weekly</div>
        <div class="recommendation-item">Balance and flexibility work daily</div>
      `;
    }
    
    if (ageDeviation > 5) {
      html += `
        <h3>Accelerated Aging Intervention</h3>
        <div class="recommendation-item">Consider senolytic therapy consultation</div>
        <div class="recommendation-item">Comprehensive metabolic panel review</div>
        <div class="recommendation-item">Sleep optimization assessment</div>
        <div class="recommendation-item">Stress management program enrollment</div>
      `;
    }
    
    html += '</div>';
    return html;
  }

  generateNextStepsHTML(scores, biomarkers) {
    const steps = [];
    
    if (scores.oralHealthScore < 75 || scores.systemicHealthScore < 75) {
      steps.push('Schedule Tier 2 comprehensive assessment');
    }
    
    if (biomarkers.gdf15 > 1800) {
      steps.push('Urgent: Schedule mitochondrial function panel');
    }
    
    if (biomarkers.mmp8 > 100 && biomarkers.hsCRP > 3) {
      steps.push('Begin immediate anti-inflammatory intervention');
    }
    
    steps.push('Retest key biomarkers in 6 weeks');
    steps.push('Track daily health metrics via wearables');
    steps.push('Schedule follow-up consultation in 3 months');
    
    return steps.map(step => `<div class="recommendation-item">${step}</div>`).join('');
  }

  generateActionPlanHTML(scores, biomarkers) {
    const actions = [];
    
    // Priority 1: Critical interventions
    if (biomarkers.gdf15 > 1800) {
      actions.push('<strong>PRIORITY 1:</strong> Start NAD+ supplementation immediately');
    }
    
    if (biomarkers.mmp8 > 100) {
      actions.push('<strong>PRIORITY 1:</strong> Begin oral health protocol with antimicrobial rinse');
    }
    
    // Priority 2: Important interventions
    if (scores.systemicHealthScore < 85) {
      actions.push('Begin Omega-3 supplementation (2-3g EPA+DHA daily)');
      actions.push('Implement Mediterranean diet principles');
    }
    
    if (biomarkers.vitaminD < 40) {
      actions.push(`Vitamin D supplementation: ${biomarkers.vitaminD < 30 ? '5000' : '2000'} IU daily`);
    }
    
    // Priority 3: Lifestyle optimizations
    actions.push('Sleep optimization: Target 7.5+ hours nightly');
    actions.push('Stress management: 20 minutes daily meditation or HRV biofeedback');
    actions.push('Hydration: 35ml per kg body weight daily');
    
    if (scores.fitnessScore && scores.fitnessScore < 75) {
      actions.push('Exercise: 150 min/week moderate + 2x strength training');
    }
    
    return actions.map(action => `<div class="action-item">${action}</div>`).join('');
  }

  generateFocusAreasHTML(scores) {
    let html = '<ul>';
    
    const areas = [];
    
    if (scores.oralHealthScore < 85) {
      areas.push({
        name: 'Oral Health',
        priority: scores.oralHealthScore < 75 ? 'HIGH' : 'MEDIUM',
        actions: ['Daily pH monitoring', 'Antimicrobial protocol', 'Quarterly dental assessments'],
      });
    }
    
    if (scores.systemicHealthScore < 85) {
      areas.push({
        name: 'Systemic Inflammation',
        priority: scores.systemicHealthScore < 75 ? 'HIGH' : 'MEDIUM',
        actions: ['Anti-inflammatory diet', 'Omega-3 optimization', 'Stress reduction'],
      });
    }
    
    if (scores.fitnessScore && scores.fitnessScore < 85) {
      areas.push({
        name: 'Physical Fitness',
        priority: scores.fitnessScore < 75 ? 'HIGH' : 'MEDIUM',
        actions: ['Structured exercise program', 'HRV training', 'Mobility work'],
      });
    }
    
    areas.forEach(area => {
      html += `
        <li>
          <strong>${area.name}</strong> (Priority: ${area.priority})
          <ul>
            ${area.actions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </li>
      `;
    });
    
    html += '</ul>';
    return html;
  }

  /**
   * Generate trend analysis report from history
   */
  async generateTrendReport(history) {
    if (!history || history.length < 2) {
      throw new Error('Insufficient data for trend analysis (need at least 2 assessments)');
    }

    // Sort history by date (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const latest = sortedHistory[0];
    const previous = sortedHistory[1];
    
    // Calculate trends
    const bioAgeTrend = latest.biologicalAge - previous.biologicalAge;
    const oralHealthTrend = latest.scores.oralHealthScore - previous.scores.oralHealthScore;
    const systemicHealthTrend = latest.scores.systemicHealthScore - previous.scores.systemicHealthScore;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Include same styles as above */
  </style>
</head>
<body>
  <h1>Progress Trend Report</h1>
  
  <h2>Bio-Age Trend</h2>
  <p>Your biological age has ${bioAgeTrend < 0 ? 'improved' : 'increased'} by 
  ${Math.abs(bioAgeTrend).toFixed(1)} years since your last assessment.</p>
  
  <h2>Score Improvements</h2>
  <ul>
    <li>Oral Health: ${oralHealthTrend > 0 ? '+' : ''}${oralHealthTrend.toFixed(1)}%</li>
    <li>Systemic Health: ${systemicHealthTrend > 0 ? '+' : ''}${systemicHealthTrend.toFixed(1)}%</li>
  </ul>
  
  <!-- Add charts here if needed -->
</body>
</html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    return { uri };
  }
}

export default new PDFReportService();
