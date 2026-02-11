import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { WAREHOUSE_GRAPH } from '@/utils/pathfinding';
import { Position } from '@/types';
import { useSimulationStore } from '@/store/useSimulationStore';

// Helper to find node ID from position
const getNodeIdFromPosition = (position: Position): string => {
    for (const [nodeId, node] of Object.entries(WAREHOUSE_GRAPH)) {
        if (node.position.x === position.x && node.position.y === position.y) {
            return nodeId;
        }
    }
    return 'L1'; // Default
};

export const LeftPanel: React.FC = () => {
    const store = useSimulationStore();

    return (
        <div className="flex flex-col gap-6 h-full">
            <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Control Panel</h2>
                <p className="text-sm text-muted-foreground">Manage simulation state</p>
            </div>

            {/* Simulation Controls */}
            <div className="space-y-4 border rounded-lg p-4 bg-secondary/20">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Simulation</h3>

                <div className="flex items-center justify-between gap-2">
                    <button
                        onClick={store.toggleSimulation}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${store.isRunning
                            ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border border-orange-200'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                    >
                        {store.isRunning ? <Pause size={18} /> : <Play size={18} />}
                        {store.isRunning ? 'Pause' : 'Start'}
                    </button>

                    <button
                        onClick={() => store.initializeAMRs(3)}
                        className="p-2 rounded-md border border-input hover:bg-accent text-accent-foreground"
                        title="Reset Simulation"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span>Speed</span>
                        <span className="font-mono">{store.speed}x</span>
                    </div>
                    <div className="flex gap-1 bg-secondary rounded-md p-1">
                        {[0.5, 1, 2, 5].map((s) => (
                            <button
                                key={s}
                                onClick={() => store.setSpeed(s)}
                                className={`flex-1 text-xs py-1 rounded-sm transition-all ${store.speed === s
                                    ? 'bg-background shadow-sm font-medium text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* AMR Controls */}
            <div className="space-y-4 border rounded-lg p-4 bg-secondary/20">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Fleet Config</h3>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-sm">Active AMRs</label>
                        <select
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            onChange={(e) => store.initializeAMRs(Number(e.target.value))}
                            defaultValue={3}
                        >
                            <option value="1">1 Robot</option>
                            <option value="2">2 Robots</option>
                            <option value="3">3 Robots</option>
                            <option value="5">5 Robots</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                        <input
                            type="checkbox"
                            id="heatmap"
                            checked={store.showHeatmap}
                            onChange={store.toggleHeatmap}
                            className="rounded border-input text-primary focus:ring-ring"
                        />
                        <label htmlFor="heatmap" className="text-sm cursor-pointer select-none">Show Traffic Heatmap</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="autoAssign"
                            checked={store.autoAssignTasks}
                            onChange={store.toggleAutoAssign}
                            className="rounded border-input text-primary focus:ring-ring"
                        />
                        <label htmlFor="autoAssign" className="text-sm cursor-pointer select-none">Auto-assign Tasks</label>
                    </div>
                </div>
            </div>

            {/* Spawn Node Configuration */}
            {store.amrs.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Spawn Positions</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {store.amrs.map((amr) => (
                            <div key={amr.id} className="flex items-center gap-2 text-xs">
                                <span className={`font-mono font-semibold w-16 ${amr.status === 'error' ? 'text-red-600' : 'text-slate-700'}`}>
                                    {amr.id}
                                </span>
                                <select
                                    value={getNodeIdFromPosition(amr.position)}
                                    onChange={(e) => {
                                        console.log(`Changing ${amr.id} spawn to:`, e.target.value);
                                        store.setAMRSpawnNode(amr.id, e.target.value);
                                    }}
                                    disabled={store.isRunning}
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {Object.keys(WAREHOUSE_GRAPH).map((nodeId) => (
                                        <option key={nodeId} value={nodeId}>
                                            {nodeId} ({WAREHOUSE_GRAPH[nodeId].position.x}, {WAREHOUSE_GRAPH[nodeId].position.y})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    {store.isRunning && (
                        <p className="text-[10px] text-amber-600 italic">⚠️ Stop simulation to change spawn positions</p>
                    )}
                </div>
            )}

            {/* Manual Actions */}
            <div className="space-y-4 border rounded-lg p-4 bg-secondary/20 flex-1">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Manual Override</h3>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => {
                            if (store.selectedAmrId) {
                                store.sendAMRToDock(store.selectedAmrId);
                            }
                        }}
                        disabled={!store.selectedAmrId}
                        className="px-3 py-2 text-xs border rounded hover:bg-accent text-left disabled:opacity-50"
                    >
                        Send to Dock
                    </button>
                    <button
                        onClick={() => {
                            if (store.selectedAmrId) {
                                store.sendAMRToCharging(store.selectedAmrId);
                            }
                        }}
                        disabled={!store.selectedAmrId}
                        className="px-3 py-2 text-xs border rounded hover:bg-accent text-left disabled:opacity-50"
                    >
                        Send to Charge
                    </button>
                    <button
                        onClick={store.emergencyStop}
                        className="px-3 py-2 text-xs border rounded bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20 text-left col-span-2 flex items-center justify-between"
                    >
                        <span>Emergency Stop</span>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </button>
                </div>
                {!store.selectedAmrId && (
                    <p className="text-[10px] text-muted-foreground italic">Select a robot to enable overrides</p>
                )}
            </div>

        </div>
    );
};
