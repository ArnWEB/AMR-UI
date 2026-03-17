import React, { useEffect } from 'react';
import { CenterMap } from './CenterMap';
import { MonitoringDashboard } from './MonitoringDashboard';
import { ScheduleViewer } from './ScheduleViewer';
import { CargoInventory } from './CargoInventory';
import Warehouse3D from '../warehouse/Warehouse3D';
import { SimulationCamera } from './SimulationCamera';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Map, Box, LayoutGrid, List } from 'lucide-react';

const LiveFeed = React.lazy(() =>
    import('./LiveFeed').then((module) => ({ default: module.LiveFeed }))
);

type CenterTab = 'map' | 'video' | 'monitoring' | 'schedule' | 'inventory';

interface CenterPanelProps {
    activeTab?: CenterTab;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({ activeTab: externalActiveTab }) => {
    const [viewMode, setViewMode] = React.useState<'2d' | '3d'>('2d');
    const [simView, setSimView] = React.useState<'camera' | 'schedule'>('camera');
    const activeTab = externalActiveTab || 'map';
    const appMode = useSimulationStore((state) => state.appMode);
    const isRunning = useSimulationStore((state) => state.isRunning);
    const speed = useSimulationStore((state) => state.speed);
    const updateAMRPosition = useSimulationStore((state) => state.updateAMRPosition);

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const store = useSimulationStore.getState();
            const currentAmrs = store.amrs;

            currentAmrs.forEach(amr => {
                if (amr.status === 'error') return;
                if (!amr.path || amr.path.length === 0) return;

                const target = amr.path[0];
                const dx = target.x - amr.position.x;
                const dy = target.y - amr.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const stepSize = 2 * speed;

                if (distance < stepSize) {
                    updateAMRPosition(amr.id, target);
                    store.shiftWaypoint(amr.id);
                } else {
                    const vx = (dx / distance) * stepSize;
                    const vy = (dy / distance) * stepSize;

                    const newPosition = {
                        x: amr.position.x + vx,
                        y: amr.position.y + vy
                    };

                    if (store.collisionAvoidanceEnabled && store.checkCollision?.(amr.id, newPosition)) {
                        return;
                    }

                    updateAMRPosition(amr.id, newPosition);
                }
            });
        }, 30);

        return () => clearInterval(interval);
    }, [isRunning, speed, updateAMRPosition]);

    // Simulation Mode: Tabbed view (Camera or Schedule)
    if (appMode === 'simulation') {
        return (
            <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
                {/* View Toggle for Simulation Mode */}
                <div className="h-12 border-b bg-card flex items-center px-4 justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSimView('camera')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${simView === 'camera'
                                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <LayoutGrid size={14} />
                            <span>Cameras</span>
                        </button>
                        <button
                            onClick={() => setSimView('schedule')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${simView === 'schedule'
                                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <List size={14} />
                            <span>Schedule</span>
                        </button>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                        <span className="text-green-600 font-bold">●</span> SIMULATION ACTIVE
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 relative overflow-hidden">
                    {simView === 'camera' && (
                        <div className="absolute inset-0 w-full h-full">
                            <SimulationCamera />
                        </div>
                    )}

                    {simView === 'schedule' && (
                        <div className="absolute inset-0 w-full h-full">
                            <ScheduleViewer />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Plan Mode: Tab-based views
    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Map View - 2D or 3D - styled like LiveFeed */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}>
                    <div className="h-full flex flex-col">
                        {/* Map Header */}
                        <div className="h-12 border-b bg-card flex items-center px-4 justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                {viewMode === '2d' ? <Map size={14} className="text-muted-foreground" /> : <Box size={14} className="text-muted-foreground" />}
                                <span className="text-sm font-medium">{viewMode === '2d' ? '2D Map' : '3D View'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* 2D/3D Toggle */}
                                <div className="flex items-center gap-1 px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('2d')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${viewMode === '2d'
                                                ? 'bg-white dark:bg-slate-700 shadow text-primary'
                                                : 'text-slate-500'
                                            }`}
                                    >
                                        2D
                                    </button>
                                    <button
                                        onClick={() => setViewMode('3d')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${viewMode === '3d'
                                                ? 'bg-white dark:bg-slate-700 shadow text-primary'
                                                : 'text-slate-500'
                                            }`}
                                    >
                                        3D
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Map Content */}
                        <div className="flex-1 relative">
                            {viewMode === '2d' ? <CenterMap /> : <Warehouse3D />}
                        </div>
                    </div>
                </div>

                {/* Monitoring Dashboard */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'monitoring' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}>
                    <MonitoringDashboard />
                </div>

                {/* Schedule Viewer */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'schedule' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}>
                    <ScheduleViewer />
                </div>

                {/* Cargo Inventory */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}>
                    <CargoInventory />
                </div>

                {/* Live Feed */}
                {activeTab === 'video' && (
                    <div className="absolute inset-0 w-full h-full opacity-100 z-10">
                        <React.Suspense
                            fallback={
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Loading Live Feed...</div>
                                </div>
                            }
                        >
                            <LiveFeed />
                        </React.Suspense>
                    </div>
                )}
            </div>
        </div>
    );
};
