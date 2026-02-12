import React, { useState } from 'react';
import { CenterMap } from './CenterMap';
import { LiveFeed } from './LiveFeed';
import { MonitoringDashboard } from './MonitoringDashboard';
import Warehouse3D from '../warehouse/Warehouse3D';
import { Map, Video, BarChart2, Box } from 'lucide-react';

export const CenterPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'map' | 'video' | 'monitoring'>('map');
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

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
