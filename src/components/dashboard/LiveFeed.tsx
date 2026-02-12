import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { 
    Monitor, Grid, Maximize2, Minimize2 
} from 'lucide-react';

interface AMRCameraState {
    amrId: string;
    isConnected: boolean;
    isConnecting: boolean;
    latency: number;
    fps: number;
    bitrate: number;
}

export const LiveFeed: React.FC = () => {
    const { amrs } = useSimulationStore();
    const [selectedAMR, setSelectedAMR] = useState<string>('AMR-1');
    const [expandedAMR, setExpandedAMR] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    
    // Track connection state for each AMR
    const [cameraStates, setCameraStates] = useState<Record<string, AMRCameraState>>({});
    
    // Refs for canvas and animation
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    // Initialize camera states for all AMRs
    useEffect(() => {
        amrs.forEach(amr => {
            if (!cameraStates[amr.id]) {
                setCameraStates(prev => ({
                    ...prev,
                    [amr.id]: {
                        amrId: amr.id,
                        isConnected: true,
                        isConnecting: false,
                        latency: Math.floor(Math.random() * 20 + 15),
                        fps: 60,
                        bitrate: Math.floor(Math.random() * 3 + 3)
                    }
                }));
            }
        });
    }, [amrs]);

    // Get selected AMR data
    const selectedAmrData = amrs.find(a => a.id === selectedAMR);
    const selectedCameraState = cameraStates[selectedAMR];

    // Simulated camera feed renderer
    const renderCameraFeed = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, amrId: string, status: string) => {
        timeRef.current += 0.016;
        const t = timeRef.current;
        
        // Background - warehouse floor simulation
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Grid floor effect
        if (showGrid) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            for (let j = 0; j < height; j += 40) {
                ctx.beginPath();
                ctx.moveTo(0, j);
                ctx.lineTo(width, j);
                ctx.stroke();
            }
        }
        
        // Moving floor lines to simulate forward motion
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.03)';
        const offset = (t * 50) % 40;
        for (let j = -40; j < height + 40; j += 40) {
            const y = j + offset;
            if (y >= 0 && y <= height) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
        }
        
        // Central perspective lines
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.02)';
        ctx.beginPath();
        ctx.moveTo(width / 2, height);
        ctx.lineTo(width / 2 - 100, 0);
        ctx.moveTo(width / 2, height);
        ctx.lineTo(width / 2 + 100, 0);
        ctx.stroke();
        
        // Simulated obstacles/shelves based on AMR status
        if (status === 'moving') {
            // Draw moving obstacles
            const obstacleOffset = (t * 30) % 200;
            ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
            ctx.fillRect(100, 200 - obstacleOffset, 80, 60);
            ctx.fillRect(420, 250 - obstacleOffset, 100, 80);
            ctx.fillRect(200, 320 - obstacleOffset, 60, 40);
            
            // Warning stripes
            ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
            ctx.beginPath();
            ctx.moveTo(100, 200 - obstacleOffset);
            ctx.lineTo(140, 200 - obstacleOffset);
            ctx.lineTo(120, 180 - obstacleOffset);
            ctx.closePath();
            ctx.fill();
        }
        
        // Center reticle/crosshair
        ctx.strokeStyle = status === 'moving' ? '#ffff00' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 20, height / 2);
        ctx.lineTo(width / 2 + 20, height / 2);
        ctx.moveTo(width / 2, height / 2 - 20);
        ctx.lineTo(width / 2, height / 2 + 20);
        ctx.stroke();
        
        // OSD overlays
        ctx.font = '16px monospace';
        ctx.fillStyle = '#00ff00';
        ctx.fillText(`CAM-${amrId.replace('AMR-', '')}`, 20, 30);
        
        ctx.font = '14px monospace';
        ctx.fillStyle = status === 'moving' ? '#ffff00' : '#00ff00';
        ctx.fillText(`STATUS: ${status.toUpperCase()}`, 20, 55);
        
        ctx.fillStyle = '#00ff00';
        ctx.fillText(`BATTERY: ${Math.floor(Math.random() * 20 + 70)}%`, 20, 80);
        
        // Timestamp
        const now = new Date();
        ctx.textAlign = 'right';
        ctx.fillText(now.toLocaleTimeString(), width - 20, 30);
        
        // Motion indicator
        if (status === 'moving') {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
            ctx.fill();
            
            // Scanning line effect
            const scanY = (t * 100) % 360 - 180;
            const gradientY = ctx.createLinearGradient(0, height / 2 + scanY - 50, 0, height / 2 + scanY + 50);
            gradientY.addColorStop(0, 'rgba(0, 255, 0, 0)');
            gradientY.addColorStop(0.5, 'rgba(0, 255, 0, 0.2)');
            gradientY.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = gradientY;
            ctx.fillRect(0, height / 2 + scanY - 50, width, 100);
        }
        
        // Corner brackets
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        const bracketSize = 30;
        ctx.beginPath();
        ctx.moveTo(10, 10 + bracketSize);
        ctx.lineTo(10, 10);
        ctx.lineTo(10 + bracketSize, 10);
        ctx.moveTo(width - 10 - bracketSize, 10);
        ctx.lineTo(width - 10, 10);
        ctx.lineTo(width - 10, 10 + bracketSize);
        ctx.moveTo(10, height - 10 - bracketSize);
        ctx.lineTo(10, height - 10);
        ctx.lineTo(10 + bracketSize, height - 10);
        ctx.moveTo(width - 10 - bracketSize, height - 10);
        ctx.lineTo(width - 10, height - 10);
        ctx.lineTo(width - 10, height - 10 - bracketSize);
        ctx.stroke();
        
        // Recording indicator
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(width - 30, 30, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('REC', width - 50, 34);
        
    }, [showGrid]);

    // Animation loop for main canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const render = () => {
            const amrData = amrs.find(a => a.id === selectedAMR);
            const status = amrData?.status || 'idle';
            renderCameraFeed(ctx, canvas.width, canvas.height, selectedAMR, status);
            animationFrameRef.current = requestAnimationFrame(render);
        };
        
        render();
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [selectedAMR, amrs, renderCameraFeed]);

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden">
            {/* Header with AMR selector */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
                {/* AMR Feed Selector */}
                <div className="bg-black/60 backdrop-blur px-3 py-2 rounded-lg border border-white/10 pointer-events-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Monitor size={14} className="text-blue-400" />
                        <span className="text-xs font-medium uppercase">Camera Feed</span>
                    </div>
                    <select
                        value={selectedAMR}
                        onChange={(e) => setSelectedAMR(e.target.value)}
                        className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                    >
                        {amrs.map(amr => (
                            <option key={amr.id} value={amr.id}>
                                {amr.id} - {amr.status}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Connection Status */}
                <div className="bg-black/60 backdrop-blur px-3 py-2 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedCameraState?.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-mono uppercase">
                            {selectedCameraState?.isConnected ? 'LIVE' : 'OFFLINE'}
                        </span>
                    </div>
                    {selectedCameraState?.isConnected && (
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                            <span>{selectedCameraState.latency}ms</span>
                            <span>{selectedCameraState.fps}fps</span>
                            <span>{selectedCameraState.bitrate}Mbps</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 rounded-lg border border-white/10 transition-colors ${
                            showGrid ? 'bg-blue-500/20 text-blue-400' : 'bg-black/40 text-slate-400 hover:bg-black/60'
                        }`}
                        title="Toggle Grid"
                    >
                        <Grid size={14} />
                    </button>
                    <button
                        onClick={() => {
                            if (expandedAMR) {
                                setExpandedAMR(null);
                            } else {
                                setExpandedAMR(selectedAMR);
                            }
                        }}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 text-slate-400 hover:bg-black/60 transition-colors"
                        title={expandedAMR ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {expandedAMR ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Main Video Feed */}
            <div className={`flex-1 relative ${expandedAMR ? 'fixed inset-0 z-50' : ''}`}>
                <canvas
                    ref={canvasRef}
                    width={expandedAMR ? window.innerWidth : 640}
                    height={expandedAMR ? window.innerHeight : 360}
                    className="w-full h-full"
                />
                
                {/* Expanded mode close button */}
                {expandedAMR && (
                    <button
                        onClick={() => setExpandedAMR(null)}
                        className="absolute top-20 right-4 z-50 px-3 py-1 bg-red-500/80 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    >
                        Exit Fullscreen
                    </button>
                )}
            </div>

            {/* Minimized Feed Strip */}
            <div className="h-24 bg-black/80 border-t border-white/10 flex items-center px-4 gap-2 overflow-x-auto">
                {amrs.map(amr => {
                    const state = cameraStates[amr.id];
                    const isSelected = selectedAMR === amr.id;
                    
                    return (
                        <button
                            key={amr.id}
                            onClick={() => setSelectedAMR(amr.id)}
                            className={`
                                relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all
                                ${isSelected 
                                    ? 'border-blue-400 shadow-lg shadow-blue-400/20' 
                                    : 'border-white/10 hover:border-white/30'
                                }
                            `}
                        >
                            {/* Mini canvas for preview */}
                            <canvas
                                id={`mini-${amr.id}`}
                                width={128}
                                height={72}
                                className="w-full h-full"
                            />
                            
                            {/* Overlay info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            
                            {/* AMR ID */}
                            <div className="absolute bottom-1 left-2 text-[10px] font-mono font-bold text-white">
                                {amr.id}
                            </div>
                            
                            {/* Status indicator */}
                            <div className="absolute top-1 right-1 flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    state?.isConnected 
                                        ? amr.status === 'moving' ? 'bg-yellow-400 animate-pulse' 
                                        : 'bg-green-400' 
                                        : 'bg-red-400'
                                }`} />
                            </div>
                            
                            {/* Status text */}
                            <div className="absolute top-1 left-1 text-[8px] font-mono text-white/70">
                                {amr.status}
                            </div>
                            
                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute inset-0 border-2 border-blue-400 rounded-lg" />
                            )}
                        </button>
                    );
                })}
                
                {/* Add AMR info */}
                <div className="flex-shrink-0 flex items-center justify-center w-32 h-20 text-xs text-slate-500">
                    {amrs.length} AMRs Active
                </div>
            </div>

            {/* AMR Details Panel */}
            {selectedAmrData && (
                <div className="absolute bottom-28 left-4 z-20 bg-black/70 backdrop-blur px-4 py-3 rounded-lg border border-white/10 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{selectedAmrData.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            selectedAmrData.status === 'moving' ? 'bg-yellow-500/20 text-yellow-400' :
                            selectedAmrData.status === 'loading' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                        }`}>
                            {selectedAmrData.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                        <div>Battery: {selectedAmrData.battery}%</div>
                        <div>Position: ({Math.floor(selectedAmrData.position.x)}, {Math.floor(selectedAmrData.position.y)})</div>
                        {selectedAmrData.currentTask && (
                            <div className="col-span-2">Task: {selectedAmrData.currentTask.slice(0, 8)}...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Mini canvas renderer for feed previews
export const MiniCameraFeed: React.FC<{ amrId: string; status: string }> = ({ amrId, status }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let time = 0;
        const render = () => {
            time += 0.03;
            
            // Simple gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, 72);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 72);
            
            // Grid effect
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 128; i += 16) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 72);
                ctx.stroke();
            }
            for (let j = 0; j < 72; j += 16) {
                ctx.beginPath();
                ctx.moveTo(0, j);
                ctx.lineTo(128, j);
                ctx.stroke();
            }
            
            // Moving obstacle
            const offset = (time * 20) % 60;
            ctx.fillStyle = 'rgba(100, 100, 120, 0.5)';
            ctx.fillRect(40, 30 + offset, 30, 20);
            
            // Crosshair
            ctx.strokeStyle = status === 'moving' ? '#ffff00' : '#00ff00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(64, 30);
            ctx.lineTo(64, 42);
            ctx.moveTo(58, 36);
            ctx.lineTo(70, 36);
            ctx.stroke();
            
            // REC indicator
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(115, 10, 4, 0, Math.PI * 2);
            ctx.fill();
            
            animationFrameRef.current = requestAnimationFrame(render);
        };
        
        const animationFrameRef = { current: 0 };
        render();
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [amrId, status]);
    
    return <canvas ref={canvasRef} width={128} height={72} className="w-full h-full" />;
};
