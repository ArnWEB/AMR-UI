import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { 
    Grid, Maximize2, Minimize2, 
    Video, Radio, Battery, Navigation,
    Signal, Wifi
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
    const initializedAmrsRef = useRef<Set<string>>(new Set());

    // Initialize camera states for all AMRs
    useEffect(() => {
        amrs.forEach(amr => {
            if (!initializedAmrsRef.current.has(amr.id)) {
                initializedAmrsRef.current.add(amr.id);
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
        
        // Modern dark background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Grid floor effect
        if (showGrid) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
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
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
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
        
        // Perspective lines
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
        ctx.beginPath();
        ctx.moveTo(width / 2, height);
        ctx.lineTo(width / 2 - 100, 0);
        ctx.moveTo(width / 2, height);
        ctx.lineTo(width / 2 + 100, 0);
        ctx.stroke();
        
        // Simulated obstacles/shelves based on AMR status
        if (status === 'moving') {
            // Draw moving obstacles with modern styling
            const obstacleOffset = (t * 30) % 200;
            ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
            ctx.fillRect(100, 200 - obstacleOffset, 80, 60);
            ctx.fillRect(420, 250 - obstacleOffset, 100, 80);
            ctx.fillRect(200, 320 - obstacleOffset, 60, 40);
            
            // Warning indicator
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
            ctx.beginPath();
            ctx.moveTo(100, 200 - obstacleOffset);
            ctx.lineTo(140, 200 - obstacleOffset);
            ctx.lineTo(120, 180 - obstacleOffset);
            ctx.closePath();
            ctx.fill();
        }
        
        // Center reticle/crosshair - modern blue
        ctx.strokeStyle = status === 'moving' ? '#fbbf24' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 20, height / 2);
        ctx.lineTo(width / 2 + 20, height / 2);
        ctx.moveTo(width / 2, height / 2 - 20);
        ctx.lineTo(width / 2, height / 2 + 20);
        ctx.stroke();
        
        // OSD overlays with modern styling
        ctx.font = '14px ui-monospace, monospace';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`CAM-${amrId.replace('AMR-', '')}`, 20, 35);
        
        ctx.font = '12px ui-monospace, monospace';
        ctx.fillStyle = status === 'moving' ? '#fbbf24' : '#22c55e';
        ctx.fillText(`${status.toUpperCase()}`, 20, 55);
        
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`BAT: ${Math.floor(Math.random() * 20 + 70)}%`, 20, 75);
        
        // Timestamp
        const now = new Date();
        ctx.textAlign = 'right';
        ctx.fillStyle = '#64748b';
        ctx.fillText(now.toLocaleTimeString(), width - 20, 35);
        
        // Motion indicator
        if (status === 'moving') {
            // Scanning line effect
            const scanY = (t * 100) % 360 - 180;
            const gradientY = ctx.createLinearGradient(0, height / 2 + scanY - 50, 0, height / 2 + scanY + 50);
            gradientY.addColorStop(0, 'rgba(59, 130, 246, 0)');
            gradientY.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
            gradientY.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = gradientY;
            ctx.fillRect(0, height / 2 + scanY - 50, width, 100);
        }
        
        // Corner brackets - modern blue
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        const bracketSize = 25;
        ctx.beginPath();
        ctx.moveTo(15, 15 + bracketSize);
        ctx.lineTo(15, 15);
        ctx.lineTo(15 + bracketSize, 15);
        ctx.moveTo(width - 15 - bracketSize, 15);
        ctx.lineTo(width - 15, 15);
        ctx.lineTo(width - 15, 15 + bracketSize);
        ctx.moveTo(15, height - 15 - bracketSize);
        ctx.lineTo(15, height - 15);
        ctx.lineTo(15 + bracketSize, height - 15);
        ctx.moveTo(width - 15 - bracketSize, height - 15);
        ctx.lineTo(width - 15, height - 15);
        ctx.lineTo(width - 15, height - 15 - bracketSize);
        ctx.stroke();
        
        // Recording indicator
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(width - 35, 30, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('REC', width - 60, 34);
        
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
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900">
            {/* Header with AMR selector - Modern card style */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* AMR Feed Selector */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Video size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Camera Feed</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">AMR surveillance system</p>
                            </div>
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                        
                        <select
                            value={selectedAMR}
                            onChange={(e) => setSelectedAMR(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {amrs.map(amr => (
                                <option key={amr.id} value={amr.id}>
                                    {amr.id} • {amr.status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center gap-3">
                        {selectedCameraState?.isConnected && (
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Signal size={12} />
                                    <span>{selectedCameraState.latency}ms</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Radio size={12} />
                                    <span>{selectedCameraState.fps}fps</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Wifi size={12} />
                                    <span>{selectedCameraState.bitrate}Mbps</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                        
                        {/* Controls */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowGrid(!showGrid)}
                                className={`p-2 rounded-lg transition-colors ${
                                    showGrid 
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                                title="Toggle Grid"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setExpandedAMR(expandedAMR ? null : selectedAMR)}
                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title={expandedAMR ? 'Exit Fullscreen' : 'Fullscreen'}
                            >
                                {expandedAMR ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Video Feed */}
            <div className={`flex-1 relative ${expandedAMR ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}>
                <canvas
                    ref={canvasRef}
                    width={expandedAMR ? window.innerWidth : 800}
                    height={expandedAMR ? window.innerHeight - 120 : 400}
                    className={`w-full ${expandedAMR ? 'h-full' : 'h-[400px]'}`}
                />
                
                {/* AMR Info Overlay */}
                {selectedAmrData && (
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                                selectedAmrData.status === 'moving' ? 'bg-amber-500 animate-pulse' :
                                selectedAmrData.status === 'loading' ? 'bg-blue-500' :
                                selectedAmrData.status === 'unloading' ? 'bg-purple-500' :
                                'bg-green-500'
                            }`} />
                            <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-white">{selectedAmrData.id}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{selectedAmrData.status}</div>
                            </div>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Battery size={12} />
                                <span>{selectedAmrData.battery}%</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Navigation size={12} />
                                <span>({Math.floor(selectedAmrData.position.x)}, {Math.floor(selectedAmrData.position.y)})</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Connection Status Badge */}
                <div className="absolute top-4 right-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                        selectedCameraState?.isConnected 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedCameraState?.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {selectedCameraState?.isConnected ? 'LIVE' : 'OFFLINE'}
                    </div>
                </div>

                {/* Expanded mode close button */}
                {expandedAMR && (
                    <button
                        onClick={() => setExpandedAMR(null)}
                        className="absolute top-20 right-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
                    >
                        Exit Fullscreen
                    </button>
                )}
            </div>

            {/* Minimized Feed Strip */}
            <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
                <div className="flex items-center gap-2">
                    {amrs.map(amr => {
                        const state = cameraStates[amr.id];
                        const isSelected = selectedAMR === amr.id;
                        
                        return (
                            <button
                                key={amr.id}
                                onClick={() => setSelectedAMR(amr.id)}
                                className={`
                                    relative flex-shrink-0 rounded-lg overflow-hidden transition-all border-2
                                    ${isSelected 
                                        ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                    }
                                `}
                                style={{ width: '120px', height: '68px' }}
                            >
                                {/* Mini canvas for preview */}
                                <canvas
                                    id={`mini-${amr.id}`}
                                    width={120}
                                    height={68}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                
                                {/* AMR ID */}
                                <div className="absolute bottom-1 left-2 text-xs font-medium text-white">
                                    {amr.id}
                                </div>
                                
                                {/* Status indicator */}
                                <div className="absolute top-1 right-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                        state?.isConnected 
                                            ? amr.status === 'moving' ? 'bg-amber-500 animate-pulse' 
                                            : 'bg-green-500' 
                                            : 'bg-red-500'
                                    }`} />
                                </div>
                                
                                {/* Status badge */}
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-900/60 rounded text-[8px] text-white capitalize">
                                    {amr.status.slice(0, 3)}
                                </div>
                                
                                {/* Selected indicator */}
                                {isSelected && (
                                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg" />
                                )}
                            </button>
                        );
                    })}
                    
                    {/* Summary */}
                    <div className="flex-shrink-0 ml-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-500 dark:text-slate-400">
                        {amrs.length} AMRs
                    </div>
                </div>
            </div>
        </div>
    );
};
