import React, { useEffect } from 'react';
import { CenterMap } from './CenterMap';
import { MonitoringDashboard } from './MonitoringDashboard';
import { ScheduleViewer } from './ScheduleViewer';
import { CargoInventory } from './CargoInventory';
import Warehouse3D from '../warehouse/Warehouse3D';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Map, Box } from 'lucide-react';

const LiveFeed = React.lazy(() =>
    import('./LiveFeed').then((module) => ({ default: module.LiveFeed }))
);

type CenterTab = 'map' | 'video' | 'monitoring' | 'schedule' | 'inventory';

interface CenterPanelProps {
    activeTab?: CenterTab;
    onTabChange?: (tab: CenterTab) => void;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({ activeTab: externalActiveTab }) => {
    const [viewMode, setViewMode] = React.useState<'2d' | '3d'>('3d');
    const activeTab = externalActiveTab || 'map';
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

                    // Phase 2: Check for collision
                    if (store.collisionAvoidanceEnabled && store.checkCollision?.(amr.id, newPosition)) {
                        return;
                    }

                    updateAMRPosition(amr.id, newPosition);
                }
            });
        }, 30);

        return () => clearInterval(interval);
    }, [isRunning, speed, updateAMRPosition]);

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
            {/* 2D/3D Toggle - Only visible on Map tab */}
            {activeTab === 'map' && (
                <div className="absolute top-2 right-2 z-30 flex items-center gap-1 px-1 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-md">
                    <button
                        onClick={() => setViewMode('2d')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === '2d'
                                ? 'bg-white dark:bg-slate-700 shadow text-primary'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        <span className="flex items-center gap-1">
                            <Map size={12} />
                            2D
                        </span>
                    </button>
                    <button
                        onClick={() => setViewMode('3d')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === '3d'
                                ? 'bg-white dark:bg-slate-700 shadow text-primary'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        <span className="flex items-center gap-1">
                            <Box size={12} />
                            3D
                        </span>
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Map View - 2D or 3D */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}>
                    {viewMode === '2d' ? <CenterMap /> : <Warehouse3D />}
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
