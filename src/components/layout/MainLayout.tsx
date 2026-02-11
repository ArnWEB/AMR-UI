import React from 'react';

interface MainLayoutProps {
    leftPanel: React.ReactNode;
    centerPanel: React.ReactNode;
    rightPanel: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ leftPanel, centerPanel, rightPanel }) => {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Left Panel - Controls */}
            <aside className="w-80 border-r border-border bg-card p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-sm">
                {leftPanel}
            </aside>

            {/* Center Panel - Map */}
            <main className="flex-1 relative bg-muted/30 overflow-hidden flex flex-col">
                {centerPanel}
            </main>

            {/* Right Panel - Stats */}
            <aside className="w-96 border-l border-border bg-card p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-sm">
                {rightPanel}
            </aside>
        </div>
    );
};
