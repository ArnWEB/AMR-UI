import React, { useState } from 'react';
import { Video, Radio, CameraOff, Maximize2, Minimize2 } from 'lucide-react';
import { ROS_CONFIG } from '@/config/rosConfig';

interface CameraViewProps {
    topic: string;
    name: string;
    onClick?: () => void;
}

const CameraPane: React.FC<CameraViewProps> = ({ topic, name, onClick }) => {
    const [isReceiving, setIsReceiving] = useState(false);
    const streamUrl = topic ? `http://localhost:8080/stream?topic=${topic}` : '';

    return (
        <div 
            className="relative bg-slate-900 rounded-lg overflow-hidden cursor-pointer group"
            onClick={onClick}
        >
            <div className="relative w-full aspect-video bg-slate-800">
                {/* Native img tag — browser handles MJPEG streaming without CORS canvas issues */}
                {streamUrl && (
                    <img
                        src={streamUrl}
                        alt={name}
                        className="w-full h-full object-contain"
                        onLoad={() => setIsReceiving(true)}
                        onError={() => setIsReceiving(false)}
                    />
                )}
                {!isReceiving && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                        <CameraOff size={32} className="text-slate-500 mb-2" />
                        <span className="text-xs text-slate-500">{name}</span>
                    </div>
                )}
            </div>

            {/* Overlay */}
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium">{name}</span>
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${isReceiving ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-white/60 text-xs">{isReceiving ? 'LIVE' : 'OFF'}</span>
                    </div>
                </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
};

export const SimulationCamera: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const cameras = ROS_CONFIG.warehouseCameras;

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="h-14 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Video size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-white">Warehouse Camera Views</span>
                    <div className="flex items-center gap-1.5 ml-2">
                        <Radio size={12} className="text-green-500 animate-pulse" />
                        <span className="text-xs text-green-500 font-medium">LIVE</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{cameras.length} Cameras</span>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded hover:bg-slate-700 transition-colors"
                    >
                        {isExpanded ? <Minimize2 size={16} className="text-slate-400" /> : <Maximize2 size={16} className="text-slate-400" />}
                    </button>
                </div>
            </div>

            {/* Camera Grid */}
            <div className={`flex-1 p-4 overflow-auto ${isExpanded ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}>
                {isExpanded && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-16 right-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg z-50"
                    >
                        Exit Fullscreen
                    </button>
                )}
                <div className={`grid gap-4 ${isExpanded ? 'h-full' : ''} ${cameras.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-2'}`}>
                    {cameras.map((camera) => (
                        <CameraPane
                            key={camera.id}
                            topic={camera.topic}
                            name={camera.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
