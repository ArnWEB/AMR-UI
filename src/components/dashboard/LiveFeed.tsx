import React, { useState, useRef } from 'react';

import { Camera, Wifi, WifiOff } from 'lucide-react';

export const LiveFeed: React.FC = () => {
    const [streamUrl, setStreamUrl] = useState('ws://localhost:8899');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    // Mock connection function for POC (replace with actual WebRTC signaling)
    const connectToStream = () => {
        setIsConnecting(true);
        setIsConnected(false);

        // Simulate connection delay
        setTimeout(() => {
            setIsConnecting(false);
            // Just for POC - we don't actually connect to Isaac Sim without a real backend
            // In a real scenario, this would initiate the WebRTC handshake
            setIsConnected(true);
        }, 1500);
    };

    const handleDisconnect = () => {
        setIsConnected(false);
        if (peerConnection.current) {
            peerConnection.current.close();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden">
            {/* Header/Controls */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-auto">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs font-mono uppercase tracking-wider">
                        {isConnected ? 'Live Feed Active' : 'Disconnected'}
                    </span>
                </div>

                <div className="bg-black/50 backdrop-blur p-1 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-auto">
                    <input
                        type="text"
                        value={streamUrl}
                        onChange={(e) => setStreamUrl(e.target.value)}
                        className="bg-transparent border-none text-xs w-48 focus:ring-0 px-2 font-mono text-slate-300"
                        placeholder="ws://ip:port"
                    />
                    <button
                        onClick={isConnected ? handleDisconnect : connectToStream}
                        disabled={isConnecting}
                        className={`p-1.5 rounded-md transition-colors ${isConnected
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            }`}
                    >
                        {isConnected ? <WifiOff size={14} /> : <Wifi size={14} />}
                    </button>
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 flex items-center justify-center bg-black relative">
                {/* Placeholder / Video Element */}
                {isConnected ? (
                    <div className="w-full h-full relative">
                        {/* In a real app, this video tag would receive the WebRTC stream */}
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {/* Simulation of a feed for visual effect if no real stream */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                            <div className="text-center">
                                <ActivityRings />
                                <p className="mt-4 text-sm text-slate-500 font-mono">Waiting for Video Stream...</p>
                                <p className="text-xs text-slate-600">(Ensure Isaac Sim WebRTC server is running)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-600">
                        <Camera size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-slate-400">No Signal</h3>
                        <p className="text-sm">Connect to a camera feed to view operations</p>
                    </div>
                )}

                {/* Loading State */}
                {isConnecting && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium text-blue-400">Connecting...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Metadata Overlay */}
            {isConnected && (
                <div className="absolute bottom-4 left-4 z-10 font-mono text-[10px] text-green-500/80 bg-black/80 px-2 py-1 rounded border border-green-900/30">
                    <div>LATENCY: 24ms</div>
                    <div>FPS: 60</div>
                    <div>BITRATE: 4.5 Mbps</div>
                </div>
            )}
        </div>
    );
};

const ActivityRings = () => (
    <div className="relative w-23 h-24 flex items-center justify-center">
        <div className="absolute w-full h-full border-4 border-slate-800 rounded-full animate-ping opacity-20" />
        <div className="absolute w-16 h-16 border-4 border-slate-700 rounded-full animate-pulse" />
    </div>
);
