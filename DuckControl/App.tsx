/**
 * DuckControl — React Native app for XGO Duck robot control.
 * Connects to the robot's FastAPI server (port 9527) via HTTP.
 */

import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useRobotStore} from './src/store/robotStore';
import {ControlScreen} from './src/screens/ControlScreen';

function App(): React.JSX.Element {
  const loadConnection = useRobotStore(s => s.loadConnection);

  // Load saved connection config on startup
  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  return (
    <SafeAreaProvider>
      <ControlScreen />
    </SafeAreaProvider>
  );
}

export default App;
