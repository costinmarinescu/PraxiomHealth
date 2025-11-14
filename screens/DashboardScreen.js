// Add this import at the top
import WearableService from '../services/WearableService';

// Add this button inside your render() method, near the watch connection status

{/* 🔧 DIAGNOSTIC: Manual Send to Watch Button */}
{state.watchConnected && state.biologicalAge && (
  <TouchableOpacity
    onPress={async () => {
      try {
        console.log('🧪 MANUAL TEST: Sending Bio-Age to watch:', state.biologicalAge);
        
        await WearableService.sendBioAge({
          praxiomAge: state.biologicalAge
        });
        
        Alert.alert(
          '✅ Sent to Watch!',
          `Bio-Age ${state.biologicalAge} sent successfully.\n\nCheck if watch display changed to green.`,
          [{ text: 'OK' }]
        );
        
        console.log('✅ Manual send completed');
      } catch (error) {
        console.error('❌ Manual send failed:', error);
        Alert.alert(
          '❌ Send Failed',
          `Error: ${error.message}\n\nCheck console logs for details.`,
          [{ text: 'OK' }]
        );
      }
    }}
    style={{
      backgroundColor: '#4ade80',
      padding: 15,
      borderRadius: 10,
      margin: 20,
      alignItems: 'center',
    }}>
    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
      📤 Test: Send Bio-Age to Watch
    </Text>
    <Text style={{ color: 'white', fontSize: 12, marginTop: 5 }}>
      Manually trigger BLE transmission
    </Text>
  </TouchableOpacity>
)}

{/* Show current Bio-Age value for debugging */}
{state.biologicalAge && (
  <View style={{
    backgroundColor: '#f3f4f6',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  }}>
    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 5 }}>
      🔍 Debug Info:
    </Text>
    <Text style={{ fontSize: 12, color: '#374151' }}>
      Bio-Age in State: {state.biologicalAge}
    </Text>
    <Text style={{ fontSize: 12, color: '#374151' }}>
      Watch Connected: {state.watchConnected ? 'Yes ✅' : 'No ❌'}
    </Text>
    <Text style={{ fontSize: 12, color: '#374151' }}>
      Oral Score: {state.oralHealthScore}%
    </Text>
    <Text style={{ fontSize: 12, color: '#374151' }}>
      Systemic Score: {state.systemicHealthScore}%
    </Text>
  </View>
)}
