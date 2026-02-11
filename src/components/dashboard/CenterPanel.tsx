import React, { useState } from 'react';
import { CenterMap } from './CenterMap';
import { LiveFeed } from './LiveFeed';
import { Map, Video } from 'lucide-react';

export const CenterPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'map' | 'video'>('map');

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
            {/* Tab Switcher */}
            <div className="h-12 border-b bg-card flex items-center px-4 justify-between shrink-0 z-20 shadow-sm relative">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'map'
                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Map size={14} />
                        <span>Map View</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'video'
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
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <CenterMap />
                </div>
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'video' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <LiveFeed />
                </div>
            </div>
        </div>
    );
};
