import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import {
    Grid, Maximize2, Minimize2,
    Video, Radio, Battery, Navigation,
    RefreshCw, CameraOff
} from 'lucide-react';
import { AMRId, CameraAngle, ROS_CONFIG } from '@/config/rosConfig';

interface AMRCameraState {
    amrId: string;
    isReceiving: boolean;
    fps: number;
    lastFrameTime: number;
}

const AMR_ID_MAP: Record<string, AMRId> = {
    'AMR-1': 'amr1',
    'AMR-2': 'amr2',
    'AMR-3': 'amr3',
};

const CAMERA_ANGLES: CameraAngle[] = ['left', 'right'];
const CAMERA_ANGLE_LABELS: Record<CameraAngle, string> = {
    left: 'Left',
    right: 'Right',
};

export const LiveFeed: React.FC = () => {
    const { amrs } = useSimulationStore();
    const [selectedAMR, setSelectedAMR] = useState<string>('AMR-1');
    const [selectedAngle, setSelectedAngle] = useState<CameraAngle>('left');
    const [expandedAMR, setExpandedAMR] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(false);
    const [useSimulated, setUseSimulated] = useState(false);
    const [streamErrors, setStreamErrors] = useState<Record<string, boolean>>({});
    const [streamNonce, setStreamNonce] = useState(Date.now());

    const [cameraStates, setCameraStates] = useState<Record<string, AMRCameraState>>({});
    const fpsCountersRef = useRef<Record<string, { count: number; lastTime: number }>>({});
    const streamBaseUrl = 'http://localhost:8080/stream';

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);
    const initializedAmrsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        amrs.forEach(amr => {
            if (!initializedAmrsRef.current.has(amr.id)) {
                initializedAmrsRef.current.add(amr.id);
                setCameraStates(prev => ({
                    ...prev,
                    [amr.id]: {
                        amrId: amr.id,
                        isReceiving: false,
                        fps: 0,
                        lastFrameTime: Date.now(),
                    }
                }));
                fpsCountersRef.current = {
                    ...fpsCountersRef.current,
                    [amr.id]: { count: 0, lastTime: Date.now() }
                };
            }
        });
    }, [amrs]);

    const getTopicName = useCallback((amrLabel: string, angle: CameraAngle): string | null => {
        const rosAmrId = AMR_ID_MAP[amrLabel];
        if (!rosAmrId) {
            return null;
        }
        return ROS_CONFIG.topics[rosAmrId][angle];
    }, []);

    const getStreamUrl = useCallback((amrLabel: string, angle: CameraAngle): string => {
        const topicName = getTopicName(amrLabel, angle);
        if (!topicName) {
            return '';
        }

        // Verified server contract: /stream?topic=<full_topic_path>
        return `${streamBaseUrl}?topic=${topicName}`;
    }, [getTopicName]);

    const markStreamFrame = useCallback((amrLabel: string) => {
        const counter = fpsCountersRef.current[amrLabel] || { count: 0, lastTime: Date.now() };
        const now = Date.now();
        const nextCount = counter.count + 1;
        const elapsed = now - counter.lastTime;

        if (elapsed >= 1000) {
            setCameraStates(cameraPrev => ({
                ...cameraPrev,
                [amrLabel]: {
                    ...cameraPrev[amrLabel],
                    fps: Math.round((nextCount * 1000) / elapsed),
                    isReceiving: true,
                    lastFrameTime: now,
                }
            }));

            fpsCountersRef.current = {
                ...fpsCountersRef.current,
                [amrLabel]: { count: 0, lastTime: now }
            };
            return;
        }

        fpsCountersRef.current = {
            ...fpsCountersRef.current,
            [amrLabel]: { count: nextCount, lastTime: counter.lastTime }
        };

        setCameraStates(cameraPrev => ({
            ...cameraPrev,
            [amrLabel]: {
                ...cameraPrev[amrLabel],
                isReceiving: true,
                lastFrameTime: now,
            }
        }));
    }, []);

    const selectedAmrData = amrs.find(a => a.id === selectedAMR);
    const selectedCameraState = cameraStates[selectedAMR];
    const selectedStreamKey = `${selectedAMR}:${selectedAngle}`;
    const currentStreamUrl = getStreamUrl(selectedAMR, selectedAngle);
    const streamUrlWithNonce = currentStreamUrl
        ? `${currentStreamUrl}${currentStreamUrl.includes('?') ? '&' : '?'}_=${streamNonce}`
        : '';
    const hasStreamError = Boolean(streamErrors[selectedStreamKey]);

    useEffect(() => {
        setStreamErrors(prev => ({ ...prev, [selectedStreamKey]: false }));
        setStreamNonce(Date.now());
    }, [selectedAMR, selectedAngle, selectedStreamKey]);

    useEffect(() => {
        if (useSimulated || !hasStreamError) {
            return;
        }

        // Back off retries so the page does not hammer the stream server.
        const retryTimer = window.setTimeout(() => {
            setStreamErrors(prev => ({ ...prev, [selectedStreamKey]: false }));
            setStreamNonce(Date.now());
        }, 3000);

        return () => window.clearTimeout(retryTimer);
    }, [useSimulated, hasStreamError, selectedStreamKey]);

    const renderSimulatedFeed = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, amrId: string, status: string) => {
        timeRef.current += 0.016;
        const t = timeRef.current;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        if (showGrid) {
            ctx.strokeStyle = 'rgba(242, 204, 13, 0.08)';
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

        ctx.strokeStyle = 'rgba(242, 204, 13, 0.05)';
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

        ctx.strokeStyle = 'rgba(242, 204, 13, 0.04)';
        ctx.beginPath();
        ctx.moveTo(width / 2, height);
        ctx.lineTo(width / 2 - 100, 0);
        ctx.moveTo(width / 2, height);
        ctx.lineTo(width / 2 + 100, 0);
        ctx.stroke();

        if (status === 'moving') {
            const obstacleOffset = (t * 30) % 200;
            ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
            ctx.fillRect(100, 200 - obstacleOffset, 80, 60);
            ctx.fillRect(420, 250 - obstacleOffset, 100, 80);
            ctx.fillRect(200, 320 - obstacleOffset, 60, 40);
        }

        ctx.strokeStyle = status === 'moving' ? '#fbbf24' : '#F2CC0D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 20, height / 2);
        ctx.lineTo(width / 2 + 20, height / 2);
        ctx.moveTo(width / 2, height / 2 - 20);
        ctx.lineTo(width / 2, height / 2 + 20);
        ctx.stroke();

        ctx.font = '14px ui-monospace, monospace';
        ctx.fillStyle = '#F2CC0D';
        ctx.fillText(`CAM-${amrId.replace('AMR-', '')}`, 20, 35);

        ctx.font = '12px ui-monospace, monospace';
        ctx.fillStyle = status === 'moving' ? '#fbbf24' : '#22c55e';
        ctx.fillText(`${status.toUpperCase()}`, 20, 55);

        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`BAT: ${Math.floor(Math.random() * 20 + 70)}%`, 20, 75);

        const now = new Date();
        ctx.textAlign = 'right';
        ctx.fillStyle = '#64748b';
        ctx.fillText(now.toLocaleTimeString(), width - 20, 35);

        if (status === 'moving') {
            const scanY = (t * 100) % 360 - 180;
            const gradientY = ctx.createLinearGradient(0, height / 2 + scanY - 50, 0, height / 2 + scanY + 50);
            gradientY.addColorStop(0, 'rgba(242, 204, 13, 0)');
            gradientY.addColorStop(0.5, 'rgba(242, 204, 13, 0.15)');
            gradientY.addColorStop(1, 'rgba(242, 204, 13, 0)');
            ctx.fillStyle = gradientY;
            ctx.fillRect(0, height / 2 + scanY - 50, width, 100);
        }

        ctx.strokeStyle = '#F2CC0D';
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

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(width - 35, 30, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('REC', width - 60, 34);

    }, [showGrid]);

    useEffect(() => {
        if (!hasStreamError || useSimulated) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = 0;
            }
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const amrData = amrs.find(a => a.id === selectedAMR);
            const status = amrData?.status || 'idle';
            renderSimulatedFeed(ctx, canvas.width, canvas.height, selectedAMR, status);
            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [hasStreamError, useSimulated, selectedAMR, amrs, renderSimulatedFeed]);

    const isLive = !useSimulated && !hasStreamError;

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-brand-light-yellow rounded-lg">
                                <Video size={16} className="text-brand-yellow" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Camera Feed</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {useSimulated ? 'Simulated Mode' : hasStreamError ? 'Stream Offline' : 'HTTP Stream Active'}
                                </p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

                        <select
                            value={selectedAMR}
                            onChange={(e) => setSelectedAMR(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                        >
                            {amrs.map(amr => (
                                <option key={amr.id} value={amr.id}>
                                    {amr.id} • {amr.status}
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-1">
                            {CAMERA_ANGLES.map((angle) => (
                                <button
                                    key={angle}
                                    onClick={() => setSelectedAngle(angle)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        selectedAngle === angle
                                            ? 'bg-brand-yellow text-black'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {CAMERA_ANGLE_LABELS[angle]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isLive && (
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Radio size={12} />
                                    <span>{selectedCameraState?.fps || 0}fps</span>
                                </div>
                            </div>
                        )}

                        {hasStreamError && !useSimulated && (
                            <button
                                onClick={() => setUseSimulated(true)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded"
                            >
                                <CameraOff size={12} />
                                Use Sim
                            </button>
                        )}

                        {(isLive || useSimulated) && (
                            <button
                                onClick={() => {
                                    setUseSimulated(false);
                                    setStreamNonce(Date.now());
                                    setStreamErrors(prev => ({
                                        ...prev,
                                        [selectedStreamKey]: false
                                    }));
                                }}
                                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${isLive
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                }`}
                            >
                                <RefreshCw size={12} />
                                Retry Stream
                            </button>
                        )}

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

                        <div className="flex items-center gap-1">
                            {useSimulated && (
                                <button
                                    onClick={() => setShowGrid(!showGrid)}
                                    className={`p-2 rounded-lg transition-colors ${showGrid
                                            ? 'bg-brand-light-yellow text-black'
                                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    title="Toggle Grid"
                                >
                                    <Grid size={16} />
                                </button>
                            )}
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

            <div className={`flex-1 relative flex items-center justify-center overflow-hidden ${expandedAMR ? 'fixed inset-0 z-50 bg-slate-900' : 'h-[60vh]'}`}>
                {!useSimulated && !hasStreamError ? (
                    <img
                        src={streamUrlWithNonce}
                        alt={`${selectedAMR} ${selectedAngle} camera feed`}
                        className={`w-full object-contain bg-black`}
                        style={{ height: '100%' }}
                        onLoad={() => {
                            setStreamErrors(prev => ({
                                ...prev,
                                [selectedStreamKey]: false
                            }));
                            markStreamFrame(selectedAMR);
                        }}
                        onError={() => {
                            setStreamErrors(prev => ({
                                ...prev,
                                [selectedStreamKey]: true
                            }));
                            setCameraStates(prev => ({
                                ...prev,
                                [selectedAMR]: {
                                    ...prev[selectedAMR],
                                    isReceiving: false,
                                }
                            }));
                        }}
                    />
                ) : useSimulated ? (
                    <canvas
                        ref={canvasRef}
                        width={expandedAMR ? window.innerWidth : 800}
                        height={expandedAMR ? window.innerHeight - 120 : 400}
                        className={`w-full object-contain bg-black`}
                        style={{ height: '100%' }}
                    />
                ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-slate-200">
                            <div className="text-sm font-medium">
                                Reconnecting stream...
                            </div>
                            <div className="text-xs text-slate-400">
                                {currentStreamUrl || `${selectedAMR} ${CAMERA_ANGLE_LABELS[selectedAngle]} stream`}
                            </div>
                        </div>
                    </div>
                )}

                {selectedAmrData && (
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${selectedAmrData.status === 'moving' ? 'bg-brand-yellow animate-pulse' :
                                    selectedAmrData.status === 'loading' ? 'bg-amber-500' :
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

                <div className="absolute top-4 right-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isLive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : useSimulated
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 
                                useSimulated ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                        {isLive ? 'LIVE' : useSimulated ? 'SIMULATED' : 'OFFLINE'}
                    </div>
                </div>

                {expandedAMR && (
                    <button
                        onClick={() => setExpandedAMR(null)}
                        className="absolute top-20 right-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
                    >
                        Exit Fullscreen
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-4">
                <div className="flex items-center gap-3">
                    {CAMERA_ANGLES.map((angle) => {
                        const state = cameraStates[selectedAMR];
                        const isSelected = selectedAngle === angle;

                        return (
                            <button
                                key={`${selectedAMR}:${angle}`}
                                onClick={() => setSelectedAngle(angle)}
                                className={`
                                    relative flex-shrink-0 rounded-lg overflow-hidden transition-all border-2
                                    ${isSelected
                                        ? 'border-brand-yellow shadow-lg shadow-brand-yellow/20'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                    }
                                `}
                                style={{ width: '160px', height: '90px' }}
                            >
                                <canvas
                                    id={`mini-${selectedAMR}-${angle}`}
                                    width={160}
                                    height={90}
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                                <div className="absolute bottom-1 left-2 text-xs font-medium text-white">
                                    {CAMERA_ANGLE_LABELS[angle]}
                                </div>

                                <div className="absolute top-1 right-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                            useSimulated 
                                                ? 'bg-amber-500'
                                                : state?.isReceiving
                                                    ? selectedAmrData?.status === 'moving' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
                                                    : 'bg-red-500'
                                        }`} />
                                </div>

                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-900/60 rounded text-[8px] text-white capitalize">
                                    {selectedAmrData?.status?.slice(0, 3) || 'unk'}
                                </div>

                                {isSelected && (
                                    <div className="absolute inset-0 border-2 border-brand-yellow rounded-lg" />
                                )}
                            </button>
                        );
                    })}

                    <div className="flex-shrink-0 ml-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-500 dark:text-slate-400">
                        {selectedAMR} • 2 Angles
                    </div>
                </div>
            </div>
        </div>
    );
};
