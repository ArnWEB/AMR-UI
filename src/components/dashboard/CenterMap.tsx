import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Path } from 'react-konva';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Html } from 'react-konva-utils';

// Helper to draw a Rack Block (Grid of storage cells)
const RackBlock: React.FC<{ x: number; y: number; rows: number; cols: number; label: string }> = ({ x, y, rows, cols, label }) => {
    const cellWidth = 15;
    const cellHeight = 10;
    const gap = 2;

    const totalWidth = cols * (cellWidth + gap) + gap;
    const totalHeight = rows * (cellHeight + gap) + gap;

    return (
        <Group x={x} y={y}>
            {/* Label */}
            <Text
                x={0}
                y={-15}
                text={label}
                fontSize={10}
                fontStyle="bold"
                fill="#64748b"
                fontFamily="Inter, sans-serif"
            />

            {/* Base */}
            <Rect width={totalWidth} height={totalHeight} fill="#f1f5f9" cornerRadius={4} />

            {/* Cells */}
            {Array.from({ length: rows }).map((_, r) => (
                Array.from({ length: cols }).map((_, c) => (
                    <Rect
                        key={`${r}-${c}`}
                        x={gap + c * (cellWidth + gap)}
                        y={gap + r * (cellHeight + gap)}
                        width={cellWidth}
                        height={cellHeight}
                        fill="#cbd5e1" // Slate-300
                        cornerRadius={1}
                        stroke="#94a3b8"
                        strokeWidth={0.5}
                    />
                ))
            ))}

            {/* Side connectors (optional detail) */}
            <Rect x={-4} y={10} width={4} height={totalHeight - 20} fill="#bae6fd" cornerRadius={2} />
            <Rect x={totalWidth} y={10} width={4} height={totalHeight - 20} fill="#bae6fd" cornerRadius={2} />
        </Group>
    );
};

// Helper for Station Node
const StationNode: React.FC<{ x: number; y: number; id: string }> = ({ x, y, id }) => (
    <Group x={x} y={y}>
        <Circle radius={6} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
        <Circle radius={2} fill="#64748b" />
        <Text x={8} y={-4} text={id} fontSize={9} fill="#94a3b8" fontFamily="monospace" />
    </Group>
);

export const CenterMap: React.FC = () => {
    const { amrs, updateAMRPosition, isRunning, speed, selectAMR, selectedAmrId, showHeatmap } = useSimulationStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Handle resize
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

    // Simulation Loop
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            amrs.forEach(amr => {
                if (amr.status === 'error') return;

                // Simple constrained random movement loop for effect
                // In a real app, this would follow the paths exactly
                // For this visual upgrade, we'll keep movement simple but bounded to "aisles" roughly

                const moveX = (Math.random() - 0.5) * 5 * speed;
                const moveY = (Math.random() - 0.5) * 5 * speed;

                // Bounds relative to the map design
                let newX = Math.max(50, Math.min(dimensions.width - 50, amr.position.x + moveX));
                let newY = Math.max(50, Math.min(dimensions.height - 50, amr.position.y + moveY));

                updateAMRPosition(amr.id, { x: newX, y: newY });
            });
        }, 50);

        return () => clearInterval(interval);
    }, [isRunning, speed, amrs, updateAMRPosition, dimensions]);

    // Calculate grid centers based on dimensions
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    return (
        <div className="flex-1 w-full h-full bg-slate-50 relative overflow-hidden" ref={containerRef}>
            <Stage width={dimensions.width} height={dimensions.height}>
                <Layer>
                    {/* Background Grid Pattern (Dot Matrix) */}
                    {Array.from({ length: Math.ceil(dimensions.width / 40) }).map((_, i) => (
                        Array.from({ length: Math.ceil(dimensions.height / 40) }).map((_, j) => (
                            <Circle
                                key={`${i}-${j}`}
                                x={i * 40}
                                y={j * 40}
                                radius={1}
                                fill="#cbd5e1"
                            />
                        ))
                    ))}

                    {/* PATHWAYS - Smooth Curves */}
                    <Group opacity={0.5}>
                        {/* Outer Loop */}
                        <Path
                            data={`
                                M 80 100 
                                L ${dimensions.width - 80} 100 
                                Q ${dimensions.width - 50} 100 ${dimensions.width - 50} 130
                                L ${dimensions.width - 50} ${dimensions.height - 130}
                                Q ${dimensions.width - 50} ${dimensions.height - 100} ${dimensions.width - 80} ${dimensions.height - 100}
                                L 80 ${dimensions.height - 100}
                                Q 50 ${dimensions.height - 100} 50 ${dimensions.height - 130}
                                L 50 130
                                Q 50 100 80 100
                            `}
                            stroke="#94a3b8"
                            strokeWidth={3}
                            lineJoin="round"
                            lineCap="round"
                            tension={0.5}
                        />
                        {/* Central Aisle */}
                        <Line
                            points={[centerX, 100, centerX, dimensions.height - 100]}
                            stroke="#94a3b8"
                            strokeWidth={3}
                        />
                        {/* Cross Connectors */}
                        <Line points={[50, centerY, dimensions.width - 50, centerY]} stroke="#94a3b8" strokeWidth={2} dash={[5, 5]} />
                    </Group>


                    {/* ZONES - Highly Detailed Racks */}
                    {/* Top Left Block */}
                    <RackBlock x={80} y={130} rows={12} cols={8} label="ZONE A-1 (Inbound)" />
                    {/* Top Right Block */}
                    <RackBlock x={centerX + 40} y={130} rows={12} cols={8} label="ZONE B-1 (Storage)" />

                    {/* Bottom Left Block */}
                    <RackBlock x={80} y={centerY + 40} rows={12} cols={8} label="ZONE A-2 (Picking)" />
                    {/* Bottom Right Block */}
                    <RackBlock x={centerX + 40} y={centerY + 40} rows={12} cols={8} label="ZONE B-2 (Outbound)" />


                    {/* STATIONS / NODES */}
                    <StationNode x={60} y={120} id="S-01" />
                    <StationNode x={centerX} y={120} id="S-02" />
                    <StationNode x={dimensions.width - 60} y={120} id="S-03" />

                    <StationNode x={60} y={dimensions.height - 120} id="S-04" />
                    <StationNode x={centerX} y={dimensions.height - 120} id="S-05" />
                    <StationNode x={dimensions.width - 60} y={dimensions.height - 120} id="S-06" />

                    {/* Charging Stations */}
                    <Group x={dimensions.width - 40} y={centerY - 60}>
                        <Rect width={20} height={120} fill="#dcfce7" stroke="#22c55e" strokeWidth={1} cornerRadius={4} />
                        <Path data="M 10 30 L 10 90 M 5 40 L 15 40 M 5 80 L 15 80" stroke="#16a34a" strokeWidth={2} />
                        <Text x={-55} y={50} text="CHARGING" fontSize={9} fill="#16a34a" fontStyle="bold" rotation={-90} />
                    </Group>

                    {/* Heatmap Overlay */}
                    {showHeatmap && (
                        <Group>
                            <Circle x={centerX} y={centerY} radius={150} fillRadialGradientStartPoint={{ x: 0, y: 0 }} fillRadialGradientStartRadius={0} fillRadialGradientEndPoint={{ x: 0, y: 0 }} fillRadialGradientEndRadius={150} fillRadialGradientColorStops={[0, 'rgba(255, 99, 71, 0.3)', 1, 'rgba(0,0,0,0)']} />
                            <Circle x={80} y={130} radius={100} fillRadialGradientStartPoint={{ x: 0, y: 0 }} fillRadialGradientStartRadius={0} fillRadialGradientEndPoint={{ x: 0, y: 0 }} fillRadialGradientEndRadius={100} fillRadialGradientColorStops={[0, 'rgba(59, 130, 246, 0.2)', 1, 'rgba(0,0,0,0)']} />
                        </Group>
                    )}
                </Layer>

                {/* AMRs Layer */}
                <Layer>
                    {amrs.map((amr) => (
                        <Group
                            key={amr.id}
                            x={amr.position.x}
                            y={amr.position.y}
                            onClick={(e) => {
                                e.cancelBubble = true;
                                selectAMR(amr.id);
                            }}
                            onTap={() => selectAMR(amr.id)}
                        >
                            {/* Selection Ring */}
                            {selectedAmrId === amr.id && (
                                <Group>
                                    <Circle radius={30} stroke="#3b82f6" strokeWidth={1} opacity={0.5} dash={[5, 5]} />
                                    <Circle radius={25} stroke="#3b82f6" strokeWidth={2} opacity={0.8} />
                                </Group>
                            )}

                            {/* Robot Body - Realistic Shape */}
                            <Group rotation={amr.status === 'moving' ? 0 : 0}>
                                <Rect
                                    x={-18}
                                    y={-18}
                                    width={36}
                                    height={36}
                                    cornerRadius={8}
                                    fill={amr.status === 'error' ? '#fecaca' : '#f8fafc'}
                                    stroke={selectedAmrId === amr.id ? '#3b82f6' : amr.status === 'error' ? '#ef4444' : '#94a3b8'}
                                    strokeWidth={2}
                                    shadowColor="black"
                                    shadowBlur={15}
                                    shadowOpacity={0.15}
                                    shadowOffset={{ x: 4, y: 4 }}
                                />
                                <Circle x={0} y={0} radius={8} fill="#1e293b" />
                                <Circle
                                    x={0}
                                    y={0}
                                    radius={3}
                                    fill={amr.status === 'moving' ? '#3b82f6' : '#10b981'}
                                    shadowColor={amr.status === 'moving' ? '#3b82f6' : '#10b981'}
                                    shadowBlur={5}
                                />
                                <Rect x={14} y={-10} width={4} height={20} fill={amr.status === 'moving' ? '#fbbf24' : '#cbd5e1'} cornerRadius={1} />
                            </Group>


                            {/* Label */}
                            <Html>
                                <div
                                    className={`
                                        text-[9px] px-1.5 py-0.5 rounded-full text-white font-mono pointer-events-none transform -translate-x-1/2 mt-6 whitespace-nowrap shadow-sm border border-white/20
                                        ${amr.status === 'error' ? 'bg-red-600' : 'bg-slate-700'}
                                    `}
                                >
                                    {amr.id}
                                </div>
                            </Html>
                        </Group>
                    ))}
                </Layer>
            </Stage>

            {/* Overlay UI */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium text-slate-600 z-10 pointer-events-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Map • Warehouse A • {dimensions.width}x{dimensions.height}
            </div>
        </div>
    );
};
