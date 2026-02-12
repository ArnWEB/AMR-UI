import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Path } from 'react-konva';

import { useSimulationStore } from '@/store/useSimulationStore';
import { Html } from 'react-konva-utils';
import { WAREHOUSE_GRAPH, findPath, findNearestNode } from '@/utils/pathfinding';

// Detailed Storage Rack Component (like in the image)
const DetailedRack: React.FC<{ x: number; y: number; rows: number; cols: number; color?: 'blue' | 'green' }> = ({
    x, y, rows, cols, color = 'blue'
}) => {
    const cellWidth = 10;
    const cellHeight = 6;
    const gap = 1;

    const bgColor = color === 'green' ? '#d1fae5' : '#dbeafe';
    const cellColor = color === 'green' ? '#86efac' : '#93c5fd';
    const borderColor = color === 'green' ? '#34d399' : '#60a5fa';

    return (
        <Group x={x} y={y}>
            <Rect
                width={cols * (cellWidth + gap) + gap}
                height={rows * (cellHeight + gap) + gap}
                fill={bgColor}
                cornerRadius={2}
            />
            {Array.from({ length: rows }).map((_, r) => (
                Array.from({ length: cols }).map((_, c) => (
                    <Rect
                        key={`${r}-${c}`}
                        x={gap + c * (cellWidth + gap)}
                        y={gap + r * (cellHeight + gap)}
                        width={cellWidth}
                        height={cellHeight}
                        fill={cellColor}
                        stroke={borderColor}
                        strokeWidth={0.3}
                        cornerRadius={0.5}
                    />
                ))
            ))}
        </Group>
    );
};

// Charging Station
const ChargingStation: React.FC<{ x: number; y: number }> = ({ x, y }) => (
    <Group x={x} y={y}>
        <Rect x={-15} y={-15} width={30} height={30} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={1.5} cornerRadius={4} />
        <Path
            data="M -6 -8 L -2 0 L -6 0 L -4 8 L 2 0 L 6 0 L 4 -8 Z"
            fill="#10b981"
            stroke="#059669"
            strokeWidth={0.5}
        />
    </Group>
);

export const CenterMap: React.FC = () => {
    const { amrs, isRunning, selectAMR, selectedAmrId, showHeatmap } = useSimulationStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);



    const w = dimensions.width;
    const h = dimensions.height;

    // Handle node click - use pathfinding to navigate
    const handleNodeClick = (nodeId: string) => {
        if (!selectedAmrId) return;

        const selectedAmr = amrs.find(a => a.id === selectedAmrId);
        if (!selectedAmr) return;

        // Find nearest node to current position
        const startNode = findNearestNode(selectedAmr.position);

        // Calculate path using A*
        const path = findPath(startNode, nodeId);

        if (path.length > 0) {
            useSimulationStore.getState().queueWaypoints(selectedAmrId, path);
            useSimulationStore.getState().addLog(`${selectedAmrId} navigating to ${nodeId}`, 'info');
        }
    };

    return (
        <div className="flex-1 w-full h-full bg-white relative overflow-hidden" ref={containerRef}>
            <Stage
                width={w}
                height={h}
                onClick={(e) => {
                    // Only deselect if clicking on background
                    if (e.target === e.target.getStage()) {
                        selectAMR(null);
                    }
                }}
            >
                <Layer>
                    {/* Background */}
                    <Rect x={0} y={0} width={w} height={h} fill="#fafafa" />

                    {/* Grid pattern */}
                    {Array.from({ length: Math.ceil(w / 40) }).map((_, i) => (
                        Array.from({ length: Math.ceil(h / 40) }).map((_, j) => (
                            <Circle
                                key={`${i}-${j}`}
                                x={i * 40}
                                y={j * 40}
                                radius={1}
                                fill="#e2e8f0"
                            />
                        ))
                    ))}

                    {/* PATHWAYS - Graph edges */}
                    <Group>
                        {Object.values(WAREHOUSE_GRAPH).map(node =>
                            node.neighbors.map(neighborId => {
                                const neighbor = WAREHOUSE_GRAPH[neighborId];
                                return (
                                    <Line
                                        key={`${node.id}-${neighborId}`}
                                        points={[node.position.x, node.position.y, neighbor.position.x, neighbor.position.y]}
                                        stroke="#cbd5e1"
                                        strokeWidth={4}
                                        lineCap="round"
                                    />
                                );
                            })
                        )}
                    </Group>

                    {/* STORAGE RACKS - Detailed like in image */}
                    {/* Top row - Blue racks */}
                    <DetailedRack x={110} y={40} rows={20} cols={8} color="blue" />
                    <DetailedRack x={240} y={40} rows={20} cols={8} color="blue" />
                    <DetailedRack x={430} y={40} rows={20} cols={8} color="blue" />

                    {/* Bottom row - Blue racks */}
                    <DetailedRack x={110} y={340} rows={20} cols={8} color="blue" />
                    <DetailedRack x={240} y={340} rows={20} cols={8} color="blue" />
                    <DetailedRack x={430} y={340} rows={20} cols={8} color="blue" />

                    {/* Right side - Green racks */}
                    <DetailedRack x={w - 150} y={40} rows={20} cols={8} color="green" />
                    <DetailedRack x={w - 150} y={340} rows={20} cols={8} color="green" />

                    {/* CHARGING STATION */}
                    <ChargingStation x={700} y={300} />

                    {/* GRAPH NODES - Interactive waypoint markers */}
                    {Object.entries(WAREHOUSE_GRAPH).map(([nodeId, node]) => {
                        const isStartNode = ['L1', 'L2', 'L3', 'L4', 'L5'].includes(nodeId);
                        return (
                            <Group
                                key={nodeId}
                                x={node.position.x}
                                y={node.position.y}
                                onClick={(e) => {
                                    e.cancelBubble = true;
                                    handleNodeClick(nodeId);
                                }}
                                onMouseEnter={(e) => {
                                    const container = e.target.getStage()?.container();
                                    if (container) {
                                        container.style.cursor = selectedAmrId ? 'pointer' : 'default';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const container = e.target.getStage()?.container();
                                    if (container) {
                                        container.style.cursor = 'default';
                                    }
                                }}
                            >
                                {/* Outer ring for start nodes */}
                                {isStartNode && (
                                    <Circle
                                        radius={12}
                                        fill="#1e40af"
                                        opacity={0.3}
                                    />
                                )}
                                <Circle
                                    radius={8}
                                    fill={isStartNode ? '#2563eb' : (selectedAmrId ? '#10b981' : '#94a3b8')}
                                    opacity={0.9}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                />
                                <Circle
                                    radius={3}
                                    fill="#ffffff"
                                />
                                <Text
                                    x={12}
                                    y={-6}
                                    text={nodeId}
                                    fontSize={8}
                                    fill={isStartNode ? '#1e40af' : '#059669'}
                                    fontStyle="bold"
                                />
                                {/* START label for L nodes */}
                                {isStartNode && (
                                    <Text
                                        x={-10}
                                        y={14}
                                        text="START"
                                        fontSize={6}
                                        fill="#1e40af"
                                        fontStyle="bold"
                                    />
                                )}
                            </Group>
                        );
                    })}

                    {/* Heatmap */}
                    {showHeatmap && (
                        <Group>
                            <Circle x={400} y={300} radius={120} fillRadialGradientStartPoint={{ x: 0, y: 0 }} fillRadialGradientStartRadius={0} fillRadialGradientEndPoint={{ x: 0, y: 0 }} fillRadialGradientEndRadius={120} fillRadialGradientColorStops={[0, 'rgba(239, 68, 68, 0.3)', 1, 'rgba(0,0,0,0)']} />
                        </Group>
                    )}
                </Layer>

                {/* AMRs Layer */}
                <Layer>
                    {amrs.map((amr) => {
                        const isSelected = selectedAmrId === amr.id;
                        const hasCargo = amr.status === 'loading' || amr.status === 'unloading' || 
                            (amr.currentTask && ['loading', 'unloading'].includes(amr.status) === false);
                        
                        // Status colors
                        const getStatusColor = () => {
                            switch(amr.status) {
                                case 'error': return '#ef4444';
                                case 'loading': return '#f59e0b'; // amber
                                case 'unloading': return '#8b5cf6'; // purple
                                case 'moving': return '#3b82f6'; // blue
                                default: return '#22c55e'; // green
                            }
                        };
                        
                        const statusColor = getStatusColor();
                        
                        return (
                            <Group key={amr.id}>
                                {isSelected && amr.path.length > 0 && (
                                    <Line
                                        points={[
                                            amr.position.x, amr.position.y,
                                            ...amr.path.flatMap(p => [p.x, p.y])
                                        ]}
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dash={[8, 4]}
                                        opacity={0.6}
                                    />
                                )}

                                <Group
                                    x={amr.position.x}
                                    y={amr.position.y}
                                    onClick={(e) => {
                                        e.cancelBubble = true;
                                        selectAMR(amr.id);
                                    }}
                                    onTap={() => selectAMR(amr.id)}
                                >
                                    {isSelected && (
                                        <Group>
                                            <Circle radius={20} stroke="#3b82f6" strokeWidth={1.5} opacity={0.4} dash={[6, 4]} />
                                            <Circle radius={16} stroke="#3b82f6" strokeWidth={2} opacity={0.7} />
                                        </Group>
                                    )}
                                    
                                    {/* Loading/Unloading indicator */}
                                    {(amr.status === 'loading' || amr.status === 'unloading') && (
                                        <Group>
                                            <Circle radius={18} stroke={statusColor} strokeWidth={2} opacity={0.3} dash={[4, 4]} />
                                            <Circle radius={22} stroke={statusColor} strokeWidth={1} opacity={0.2} dash={[4, 4]} rotation={45} />
                                        </Group>
                                    )}
                                    
                                    <Group>
                                        <Rect
                                            x={-10}
                                            y={-10}
                                            width={20}
                                            height={20}
                                            cornerRadius={3}
                                            fill={amr.status === 'error' ? '#fee2e2' : '#ffffff'}
                                            stroke={isSelected ? '#3b82f6' : statusColor}
                                            strokeWidth={2}
                                            shadowColor="black"
                                            shadowBlur={8}
                                            shadowOpacity={0.2}
                                            shadowOffset={{ x: 2, y: 2 }}
                                        />
                                        <Circle x={0} y={0} radius={5} fill="#1e293b" />
                                        <Circle
                                            x={0}
                                            y={0}
                                            radius={2}
                                            fill={statusColor}
                                            shadowColor={statusColor}
                                            shadowBlur={4}
                                        />
                                        <Rect x={8} y={-6} width={2} height={12} fill={amr.status === 'moving' ? '#fbbf24' : '#94a3b8'} cornerRadius={1} />
                                    </Group>
                                    
                                    {/* Cargo box on AMR */}
                                    {hasCargo && (
                                        <Group y={-18}>
                                            <Rect
                                                x={-6}
                                                y={-6}
                                                width={12}
                                                height={12}
                                                fill="#22c55e"
                                                stroke="#166534"
                                                strokeWidth={1}
                                                cornerRadius={1}
                                                shadowColor="black"
                                                shadowBlur={4}
                                                shadowOpacity={0.3}
                                                shadowOffset={{ x: 1, y: 1 }}
                                            />
                                            <Rect
                                                x={-4}
                                                y={-4}
                                                width={8}
                                                height={2}
                                                fill="#166534"
                                            />
                                        </Group>
                                    )}
                                    
                                    <Html>
                                        <div
                                            className={`
                                                text-[9px] px-1.5 py-0.5 rounded-md text-white font-bold pointer-events-none transform -translate-x-1/2 mt-4 whitespace-nowrap shadow-md
                                                ${amr.status === 'error' ? 'bg-red-600' : 
                                                  amr.status === 'loading' ? 'bg-amber-500' :
                                                  amr.status === 'unloading' ? 'bg-purple-500' :
                                                  'bg-slate-800'}
                                            `}
                                        >
                                            {amr.id}
                                            {amr.status === 'loading' && ' 📦'}
                                            {amr.status === 'unloading' && ' 📤'}
                                        </div>
                                    </Html>
                                </Group>
                            </Group>
                        );
                    })}
                </Layer>

            </Stage>

            {/* Overlay UI */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-lg border shadow-md text-xs font-medium text-slate-700 z-10 pointer-events-none flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isRunning ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="font-semibold">{isRunning ? 'Workflow Active' : 'Ready to Start'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{amrs.filter(a => a.status === 'moving').length} Moving</span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-600">{amrs.filter(a => a.status === 'loading').length} Loading</span>
                <span className="text-slate-400">•</span>
                <span className="text-purple-600">{amrs.filter(a => a.status === 'unloading').length} Unloading</span>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg shadow-md text-[10px] text-blue-900 z-10 pointer-events-none max-w-xs">
                <div className="font-bold mb-1">📦 Inbound → Storage Workflow</div>
                <div className="text-blue-700">
                    1. Start simulation to auto-assign tasks<br />
                    2. AMR picks up cargo at Pallet Zone<br />
                    3. Delivers to Storage Rack<br />
                    4. Returns to Dock for next task
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg border shadow-md text-[10px] text-slate-600 z-10 pointer-events-none space-y-1">
                <div className="font-bold text-xs mb-2">Workflow Legend</div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded-sm"></div>
                    <span>Storage Racks</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-slate-300 rounded"></div>
                    <span>Graph Paths</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Dock (Start)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <span>Cargo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span>Loading</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Unloading</span>
                </div>
            </div>
        </div>
    );
};
