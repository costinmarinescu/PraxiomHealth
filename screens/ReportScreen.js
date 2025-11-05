import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ReportScreen() {
  const [latestData, setLatestData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const latest = await AsyncStorage.getItem('latest_biomarkers');
      const historyStr = await AsyncStorage.getItem('biomarkers_history');
      
      if (latest) setLatestData(JSON.parse(latest));
      if (historyStr) setHistory(JSON.parse(historyStr));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getStatusColor = (score) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FFC107';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getStatusText = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const generateHTMLReport = (data) => {
    const date = new Date(data.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Praxiom Health Personal Vitality Roadmap</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #00CFC1;
      margin-bottom: 10px;
    }
    h1 {
      color: #2c3e50;
      margin: 10px 0;
    }
    .date {
      color: #7f8c8d;
      font-size: 14px;
    }
    .section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 20px;
      border-bottom: 2px solid #00CFC1;
      padding-bottom: 10px;
    }
    .bio-age-card {
      background: linear-gradient(135deg, #00CFC1 0%, #00a89a 100%);
      color: white;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin-bottom: 20px;
    }
    .bio-age-number {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .score-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .score-value {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .score-excellent { color: #4CAF50; }
    .score-good { color: #FFC107; }
    .score-fair { color: #FF9800; }
    .score-poor { color: #F44336; }
    .biomarker-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .biomarker-table th,
    .biomarker-table td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .biomarker-table th {
      background: #f5f5f5;
      font-weight: 600;
    }
    .optimal { color: #4CAF50; }
    .warning { color: #FF9800; }
    .risk { color: #F44336; }
    .recommendation {
      background: #fff3cd;
      border-left: 4px solid #FFC107;
      padding: 15px;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PRAXIOM HEALTH</div>
    <h1>Personal Vitality Roadmap</h1>
    <p class="date">Generated: ${date}</p>
  </div>

  <div class="bio-age-card">
    <h2 style="margin:0">Your Praxiom Age</h2>
    <div class="bio-age-number">${data.praxiomAge} years</div>
    <p style="margin:5px 0">Chronological Age: ${data.chronologicalAge} years</p>
    <p style="margin:5px 0">Deviation: ${data.deviation > 0 ? '+' : ''}${data.deviation} years</p>
  </div>

  <div class="section">
    <h2 class="section-title">🎯 Bio-Age Score Summary</h2>
    <div class="score-grid">
      <div class="score-card">
        <p style="color:#666; margin:5px 0">Oral Health</p>
        <div class="score-value score-${getStatusText(data.oralHealthScore).toLowerCase()}">${data.oralHealthScore}%</div>
        <p style="color:#999; font-size:14px">${getStatusText(data.oralHealthScore)}</p>
      </div>
      <div class="score-card">
        <p style="color:#666; margin:5px 0">Systemic Health</p>
        <div class="score-value score-${getStatusText(data.systemicHealthScore).toLowerCase()}">${data.systemicHealthScore}%</div>
        <p style="color:#999; font-size:14px">${getStatusText(data.systemicHealthScore)}</p>
      </div>
      <div class="score-card">
        <p style="color:#666; margin:5px 0">Fitness Score</p>
        <div class="score-value score-${getStatusText(data.fitnessScore).toLowerCase()}">${data.fitnessScore}%</div>
        <p style="color:#999; font-size:14px">${getStatusText(data.fitnessScore)}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">🦷 Oral Health Biomarkers</h2>
    <table class="biomarker-table">
      <thead>
        <tr>
          <th>Biomarker</th>
          <th>Your Value</th>
          <th>Target</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Salivary pH</td>
          <td>${data.oral.salivaryPH}</td>
          <td>6.5–7.2</td>
          <td class="${data.oral.salivaryPH >= 6.5 && data.oral.salivaryPH <= 7.2 ? 'optimal' : 'warning'}">
            ${data.oral.salivaryPH >= 6.5 && data.oral.salivaryPH <= 7.2 ? '✓ Optimal' : '⚠ Adjust'}
          </td>
        </tr>
        <tr>
          <td>MMP-8</td>
          <td>${data.oral.mmp8} ng/mL</td>
          <td>&lt;60 ng/mL</td>
          <td class="${data.oral.mmp8 < 60 ? 'optimal' : data.oral.mmp8 < 100 ? 'warning' : 'risk'}">
            ${data.oral.mmp8 < 60 ? '✓ Optimal' : data.oral.mmp8 < 100 ? '⚠ Elevated' : '⛔ High Risk'}
          </td>
        </tr>
        <tr>
          <td>Flow Rate</td>
          <td>${data.oral.flowRate} mL/min</td>
          <td>&gt;1.5 mL/min</td>
          <td class="${data.oral.flowRate >= 1.5 ? 'optimal' : 'warning'}">
            ${data.oral.flowRate >= 1.5 ? '✓ Optimal' : '⚠ Low Flow'}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2 class="section-title">❤️ Systemic Health Biomarkers</h2>
    <table class="biomarker-table">
      <thead>
        <tr>
          <th>Biomarker</th>
          <th>Your Value</th>
          <th>Target</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>hs-CRP</td>
          <td>${data.systemic.hsCRP} mg/L</td>
          <td>&lt;1.0 mg/L</td>
          <td class="${data.systemic.hsCRP < 1.0 ? 'optimal' : data.systemic.hsCRP < 3.0 ? 'warning' : 'risk'}">
            ${data.systemic.hsCRP < 1.0 ? '✓ Optimal' : data.systemic.hsCRP < 3.0 ? '⚠ Elevated' : '⛔ High Risk'}
          </td>
        </tr>
        <tr>
          <td>Omega-3 Index</td>
          <td>${data.systemic.omega3}%</td>
          <td>&gt;8.0%</td>
          <td class="${data.systemic.omega3 >= 8.0 ? 'optimal' : data.systemic.omega3 >= 6.0 ? 'warning' : 'risk'}">
            ${data.systemic.omega3 >= 8.0 ? '✓ Optimal' : data.systemic.omega3 >= 6.0 ? '⚠ Improve' : '⛔ Low'}
          </td>
        </tr>
        <tr>
          <td>HbA1c</td>
          <td>${data.systemic.hba1c}%</td>
          <td>&lt;5.7%</td>
          <td class="${data.systemic.hba1c < 5.7 ? 'optimal' : data.systemic.hba1c < 6.5 ? 'warning' : 'risk'}">
            ${data.systemic.hba1c < 5.7 ? '✓ Optimal' : data.systemic.hba1c < 6.5 ? '⚠ Prediabetic' : '⛔ Diabetic'}
          </td>
        </tr>
        <tr>
          <td>GDF-15</td>
          <td>${data.systemic.gdf15} pg/mL</td>
          <td>&lt;1200 pg/mL</td>
          <td class="${data.systemic.gdf15 < 1200 ? 'optimal' : data.systemic.gdf15 < 1800 ? 'warning' : 'risk'}">
            ${data.systemic.gdf15 < 1200 ? '✓ Optimal' : data.systemic.gdf15 < 1800 ? '⚠ Elevated' : '⛔ High Aging Signal'}
          </td>
        </tr>
        <tr>
          <td>Vitamin D</td>
          <td>${data.systemic.vitaminD} ng/mL</td>
          <td>&gt;30 ng/mL</td>
          <td class="${data.systemic.vitaminD >= 30 ? 'optimal' : data.systemic.vitaminD >= 20 ? 'warning' : 'risk'}">
            ${data.systemic.vitaminD >= 30 ? '✓ Optimal' : data.systemic.vitaminD >= 20 ? '⚠ Insufficient' : '⛔ Deficient'}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  ${data.tierUpgrades && data.tierUpgrades.length > 0 ? `
  <div class="section">
    <h2 class="section-title">⚠️ Tier Upgrade Recommendations</h2>
    ${data.tierUpgrades.map(trigger => `
      <div class="recommendation">
        <strong>Tier ${trigger.tier} Recommended</strong>
        <p style="margin:5px 0">${trigger.reason}</p>
        <p style="margin:5px 0; color:#666">${trigger.action}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">📈 Immediate Action Plan (Next 3 Months)</h2>
    <h3>Oral Health Optimization:</h3>
    <ul>
      <li>pH-balancing rinse twice daily</li>
      <li>Probiotic lozenges (L. reuteri) nightly</li>
      <li>Targeted dental hygiene upgrades</li>
    </ul>
    
    <h3>Inflammation Reset:</h3>
    <ul>
      <li>Omega-3 supplement 2g/day</li>
      <li>Mediterranean-style meals</li>
      <li>Anti-inflammatory supplement (curcumin or equivalent)</li>
    </ul>
    
    <h3>Sleep & Recovery:</h3>
    <ul>
      <li>Sleep >7.5 hrs/night, HRV >70ms</li>
      <li>Magnesium 400mg at night</li>
      <li>Sauna (2-3x/week), cold exposure (1-2x/week)</li>
    </ul>
  </div>

  <div class="section">
    <h2 class="section-title">📅 Follow-Up Schedule</h2>
    <table class="biomarker-table">
      <thead>
        <tr>
          <th>Timeline</th>
          <th>Assessment Focus</th>
          <th>Outcome</th>
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
  </div>

  <div class="footer">
    <p><strong>Praxiom Health</strong> - Precision Longevity Medicine</p>
    <p>Report Generated: ${date}</p>
    <p>Assessment Tier: Foundation (Tier ${data.tier})</p>
  </div>
</body>
</html>
    `;
  };

  const handleExportHTML = async () => {
    if (!latestData) {
      Alert.alert('No Data', 'Please calculate your Bio-Age first');
      return;
    }

    setIsGenerating(true);

    try {
      const html = generateHTMLReport(latestData);
      const fileName = `Praxiom_Report_${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, html);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Share Your Praxiom Health Report',
        });
      } else {
        Alert.alert('Export Complete', `Report saved to: ${fileUri}`);
      }

      setIsGenerating(false);
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Export Failed', 'Could not generate report. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleShareText = async () => {
    if (!latestData) {
      Alert.alert('No Data', 'Please calculate your Bio-Age first');
      return;
    }

    const text = `
My Praxiom Health Report 🏥

Praxiom Age: ${latestData.praxiomAge} years
Chronological Age: ${latestData.chronologicalAge} years
Deviation: ${latestData.deviation > 0 ? '+' : ''}${latestData.deviation} years

Health Scores:
• Oral Health: ${latestData.oralHealthScore}% (${getStatusText(latestData.oralHealthScore)})
• Systemic Health: ${latestData.systemicHealthScore}% (${getStatusText(latestData.systemicHealthScore)})
• Fitness: ${latestData.fitnessScore}% (${getStatusText(latestData.fitnessScore)})

Generated: ${new Date(latestData.timestamp).toLocaleDateString()}
    `;

    try {
      await Share.share({
        message: text,
        title: 'My Praxiom Health Report',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewHistory = () => {
    if (history.length === 0) {
      Alert.alert('No History', 'No historical data available yet');
      return;
    }

    const historyText = history.map((entry, index) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      return `${index + 1}. ${date}\n   Bio-Age: ${entry.praxiomAge} (${entry.deviation > 0 ? '+' : ''}${entry.deviation})\n   OHS: ${entry.oralHealthScore}% | SHS: ${entry.systemicHealthScore}%`;
    }).join('\n\n');

    Alert.alert('History', historyText, [{ text: 'OK' }]);
  };

  if (!latestData) {
    return (
      <LinearGradient
        colors={['rgba(50, 50, 60, 1)', 'rgba(20, 20, 30, 1)']}
        style={styles.container}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Report Available</Text>
          <Text style={styles.emptyText}>
            Calculate your Bio-Age first to generate a report
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(50, 50, 60, 1)', 'rgba(20, 20, 30, 1)']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Report</Text>
        <Text style={styles.date}>
          Generated: {new Date(latestData.timestamp).toLocaleDateString()}
        </Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Praxiom Age</Text>
          <Text style={styles.summaryAge}>{latestData.praxiomAge}</Text>
          <Text style={styles.summaryLabel}>years</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryDetail}>
            Chronological: {latestData.chronologicalAge} years
          </Text>
          <Text style={styles.summaryDetail}>
            Deviation: {latestData.deviation > 0 ? '+' : ''}{latestData.deviation} years
          </Text>
        </View>

        {/* Scores Grid */}
        <View style={styles.scoresGrid}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Oral Health</Text>
            <Text style={[styles.scoreValue, { color: getStatusColor(latestData.oralHealthScore) }]}>
              {latestData.oralHealthScore}%
            </Text>
            <Text style={styles.scoreStatus}>{getStatusText(latestData.oralHealthScore)}</Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Systemic Health</Text>
            <Text style={[styles.scoreValue, { color: getStatusColor(latestData.systemicHealthScore) }]}>
              {latestData.systemicHealthScore}%
            </Text>
            <Text style={styles.scoreStatus}>{getStatusText(latestData.systemicHealthScore)}</Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Fitness Score</Text>
            <Text style={[styles.scoreValue, { color: getStatusColor(latestData.fitnessScore) }]}>
              {latestData.fitnessScore}%
            </Text>
            <Text style={styles.scoreStatus}>{getStatusText(latestData.fitnessScore)}</Text>
          </View>
        </View>

        {/* Tier Upgrades */}
        {latestData.tierUpgrades && latestData.tierUpgrades.length > 0 && (
          <View style={styles.tierCard}>
            <Text style={styles.tierTitle}>⚠️ Tier Upgrade Recommended</Text>
            {latestData.tierUpgrades.map((trigger, index) => (
              <View key={index} style={styles.tierItem}>
                <Text style={styles.tierReason}>{trigger.reason}</Text>
                <Text style={styles.tierAction}>{trigger.action}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Export Buttons */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportHTML}
          disabled={isGenerating}
        >
          <Text style={styles.exportButtonText}>
            {isGenerating ? 'Generating...' : '📄 Export Full Report (HTML)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareText}
        >
          <Text style={styles.shareButtonText}>📱 Share Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleViewHistory}
        >
          <Text style={styles.historyButtonText}>📊 View History ({history.length} entries)</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 207, 193, 0.15)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 207, 193, 0.3)',
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryAge: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  summaryLabel: {
    fontSize: 20,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  summaryDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  summaryDetail: {
    fontSize: 16,
    color: '#FFFFFF',
    marginVertical: 4,
  },
  scoresGrid: {
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  scoreStatus: {
    fontSize: 14,
    color: '#AAAAAA',
    minWidth: 80,
    textAlign: 'right',
  },
  tierCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    padding: 16,
    marginBottom: 20,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 12,
  },
  tierItem: {
    marginBottom: 12,
  },
  tierReason: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tierAction: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  exportButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
