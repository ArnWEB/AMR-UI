import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { LeftPanel } from './components/dashboard/LeftPanel';
import { CenterPanel } from './components/dashboard/CenterPanel';
import { RightPanel } from './components/dashboard/RightPanel';
import { useSimulationStore } from './store/useSimulationStore';

function App() {
  const initializeAMRs = useSimulationStore(state => state.initializeAMRs);

  useEffect(() => {
    // Initialize with 3 robots on load
    initializeAMRs(3);
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
