import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Grid, Radio, CameraOff, Maximize2 } from 'lucide-react';
import { AMRId, CameraAngle, ROS_CONFIG } from '@/config/rosConfig';

interface CameraViewProps {
    amrId: string;
    angle: CameraAngle;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ amrId, angle, label, isActive, onClick }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReceiving, setIsReceiving] = useState(false);
    const [fps, setFps] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const streamBaseUrl = 'http://localhost:8080/stream';
    const fpsCounterRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });

    const amrIdMap: Record<string, AMRId> = {
        'AMR-1': 'amr1',
        'AMR-2': 'amr2',
        'AMR-3': 'amr3',
    };

    const rosAmrId = amrIdMap[amrId];
    const topicName = rosAmrId ? ROS_CONFIG.topics[rosAmrId]?.[angle] : null;
    const streamUrl = topicName ? `${streamBaseUrl}/topic/${topicName}/webp` : '';

    useEffect(() => {
        fpsCounterRef.current = { count: 0, lastTime: Date.now() };
    }, [amrId, angle]);

    useEffect(() => {
        if (!streamUrl || !canvasRef.current) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        let animationId: number;
        let lastTime = 0;
        const targetFps = 30;
        const frameInterval = 1000 / targetFps;

        const draw = (timestamp: number) => {
            if (!canvasRef.current || !isActive) return;

            if (timestamp - lastTime >= frameInterval) {
                lastTime = timestamp;

                if (img.complete && img.naturalWidth !== 0) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        setIsReceiving(true);
                        
                        fpsCounterRef.current.count++;
                        const now = Date.now();
                        if (now - fpsCounterRef.current.lastTime >= 1000) {
                            setFps(fpsCounterRef.current.count);
                            fpsCounterRef.current.count = 0;
                            fpsCounterRef.current.lastTime = now;
                        }
                    }
                }
            }
            animationId = requestAnimationFrame(draw);
        };

        img.onload = () => {
            setIsReceiving(true);
            animationId = requestAnimationFrame(draw);
        };

        img.onerror = () => {
            setIsReceiving(false);
        };

        img.src = streamUrl;

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [streamUrl, isActive]);

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div 
            className={`relative bg-slate-900 rounded-lg overflow-hidden cursor-pointer transition-all ${isExpanded ? 'fixed inset-4 z-50' : ''}`}
            onClick={onClick}
        >
            {/* Camera Feed */}
            <canvas
                ref={canvasRef}
                width={isExpanded ? 1280 : 320}
                height={isExpanded ? 720 : 180}
                className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isReceiving ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-white text-xs font-medium">{amrId}</span>
                        <span className="text-white/60 text-xs">•</span>
                        <span className="text-white/60 text-xs capitalize">{label}</span>
                    </div>
                    <button 
                        onClick={toggleExpand}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                        <Maximize2 size={14} className="text-white" />
                    </button>
                </div>
            </div>

            {/* FPS Counter */}
            <div className="absolute bottom-2 right-2">
                <span className="text-white/60 text-xs font-mono">{fps} FPS</span>
            </div>

            {/* No Signal Overlay */}
            {!isReceiving && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                    <CameraOff size={32} className="text-slate-500 mb-2" />
                    <span className="text-slate-500 text-xs">No Signal</span>
                </div>
            )}
        </div>
    );
};

interface CameraGridProps {
    amrIds?: string[];
    angles?: CameraAngle[];
}

export const CameraGrid: React.FC<CameraGridProps> = ({ 
    amrIds = ['AMR-1', 'AMR-2'], 
    angles = ['left', 'right'] 
}) => {
    const store = useSimulationStore();
    const activeAmrs = store.amrs.length > 0 ? store.amrs.map(a => a.id) : amrIds;
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

    const angleLabels: Record<string, string> = {
        left: 'Left View',
        right: 'Right View',
    };

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Grid size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-white">Camera Grid</span>
                </div>
                <div className="flex items-center gap-2">
                    <Radio size={14} className="text-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400">Live</span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 p-2 overflow-auto">
                <div className="grid grid-cols-2 gap-2 h-full auto-rows-fr">
                    {activeAmrs.flatMap(amrId => 
                        angles.map(angle => (
                            <CameraView
                                key={`${amrId}-${angle}`}
                                amrId={amrId}
                                angle={angle}
                                label={angleLabels[angle] || angle}
                                isActive={selectedCamera === `${amrId}-${angle}` || !selectedCamera}
                                onClick={() => setSelectedCamera(
                                    selectedCamera === `${amrId}-${angle}` ? null : `${amrId}-${angle}`
                                )}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
