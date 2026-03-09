import React, { useState } from 'react';
import { X, PanelLeft, PanelRight } from 'lucide-react';
import { Header } from './Header';
import { CenterPanel } from '../dashboard/CenterPanel';

type CenterTab = 'map' | 'video' | 'monitoring' | 'schedule' | 'inventory';

interface MainLayoutProps {
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ leftPanel, rightPanel }) => {
    const [activeTab, setActiveTab] = useState<CenterTab>('map');
    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);

    return (
        <div className="flex flex-col h-screen w-full bg-transparent overflow-hidden">
            <Header 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                onMenuToggle={() => setShowLeftPanel(!showLeftPanel)}
            />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Panel Overlays */}
                {showLeftPanel && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setShowLeftPanel(false)}
                    />
                )}
                
                {showRightPanel && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setShowRightPanel(false)}
                    />
                )}

                {/* Left Panel - Controls */}
                <aside className={`
                    fixed lg:relative inset-y-0 left-0 z-50 lg:z-10
                    w-72 lg:w-64 xl:w-80 
                    border-r border-border bg-card/95 lg:bg-card/80 backdrop-blur-md 
                    p-4 flex flex-col gap-4 
                    overflow-y-auto 
                    transform transition-transform duration-300 ease-in-out
                    ${showLeftPanel ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    lg:transform-none
                    m-2 lg:m-4 mr-0 lg:mr-0
                    rounded-xl lg:rounded-3xl
                    top-14 lg:top-0
                    h-[calc(100vh-3.5rem)] lg:h-auto
                `}>
                    <button 
                        className="lg:hidden absolute top-2 right-2 p-1 hover:bg-muted rounded"
                        onClick={() => setShowLeftPanel(false)}
                    >
                        <X size={18} />
                    </button>
                    {leftPanel}
                </aside>

                {/* Mobile Toggle Buttons */}
                <div className="lg:hidden fixed bottom-4 z-30 flex gap-2">
                    <button
                        onClick={() => setShowLeftPanel(!showLeftPanel)}
                        className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <PanelLeft size={20} />
                    </button>
                    <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <PanelRight size={20} />
                    </button>
                </div>

                {/* Center Panel - Map */}
                <main className="flex-1 relative bg-transparent overflow-hidden flex flex-col min-w-0">
                    <CenterPanel activeTab={activeTab} />
                </main>

                {/* Right Panel - Stats */}
                <aside className={`
                    fixed lg:relative inset-y-0 right-0 z-50 lg:z-10
                    w-80 lg:w-72 xl:w-96 
                    border-l border-border bg-card/95 lg:bg-card/80 backdrop-blur-md 
                    p-4 flex flex-col gap-4 
                    overflow-y-auto 
                    transform transition-transform duration-300 ease-in-out
                    ${showRightPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    lg:transform-none
                    m-2 lg:m-4 ml-0 lg:ml-0
                    rounded-xl lg:rounded-3xl
                    top-14 lg:top-0
                    h-[calc(100vh-3.5rem)] lg:h-auto
                `}>
                    <button 
                        className="lg:hidden absolute top-2 right-2 p-1 hover:bg-muted rounded"
                        onClick={() => setShowRightPanel(false)}
                    >
                        <X size={18} />
                    </button>
                    {rightPanel}
                </aside>
            </div>
        </div>
    );
};
