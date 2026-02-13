import React, { useState, useEffect } from 'react';
import { CenterMap } from './CenterMap';
import { LiveFeed } from './LiveFeed';
import { MonitoringDashboard } from './MonitoringDashboard';
import { ScheduleViewer } from './ScheduleViewer';
import Warehouse3D from '../warehouse/Warehouse3D';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Map, Video, BarChart2, Box, Calendar } from 'lucide-react';

export const CenterPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'map' | 'video' | 'monitoring' | 'schedule'>('map');
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    
    // Global simulation loop - runs regardless of which view is active
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
            {/* Tab Switcher */}
            <div className="h-12 border-b bg-card flex items-center px-4 justify-between shrink-0 z-20 shadow-sm relative">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            activeTab === 'map'
                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Map size={14} />
                        <span>Map View</span>
                    </button>
                    
                    {/* 2D/3D Toggle - Only visible on Map tab */}
                    {activeTab === 'map' && (
                        <div className="flex items-center gap-1 ml-2 px-1 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <button
                                onClick={() => setViewMode('2d')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                    viewMode === '2d'
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
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                    viewMode === '3d'
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
                    
                    <button
                        onClick={() => setActiveTab('monitoring')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            activeTab === 'monitoring'
                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <BarChart2 size={14} />
                        <span>Monitoring</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            activeTab === 'schedule'
                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Calendar size={14} />
                        <span>Schedule</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            activeTab === 'video'
                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Video size={14} />
                        <span>Live Feed</span>
                    </button>
                </div>

                <div className="text-xs text-muted-foreground font-mono">
                    System Status: <span className="text-green-600 font-bold">ONLINE</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Map View - 2D or 3D */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}>
                    {viewMode === '2d' ? <CenterMap /> : <Warehouse3D />}
                </div>
                
                {/* Monitoring Dashboard */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    activeTab === 'monitoring' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}>
                    <MonitoringDashboard />
                </div>
                
                {/* Schedule Viewer */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    activeTab === 'schedule' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}>
                    <ScheduleViewer />
                </div>
                
                {/* Live Feed */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    activeTab === 'video' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}>
                    <LiveFeed />
                </div>
            </div>
        </div>
    );
};
