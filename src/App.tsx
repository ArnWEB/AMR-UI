import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { LeftPanel } from './components/dashboard/LeftPanel';
import { CenterPanel } from './components/dashboard/CenterPanel';
import { RightPanel } from './components/dashboard/RightPanel';
import { useSimulationStore } from './store/useSimulationStore';
import { connectWebSocket } from './services/rosBridge';

function App() {
  const initializeAMRs = useSimulationStore(state => state.initializeAMRs);

  useEffect(() => {
    initializeAMRs(3);
    connectWebSocket().catch(err => {
      console.log('Could not connect to bridge server:', err);
    });
  }, [initializeAMRs]);

  return (
    <MainLayout
      leftPanel={<LeftPanel />}
      centerPanel={<CenterPanel />}
      rightPanel={<RightPanel />}
    />
  );
}

export default App;
