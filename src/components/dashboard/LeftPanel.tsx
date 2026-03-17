import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Send, Rocket, Truck, Plus, X, Check, Package, Map, List } from 'lucide-react';
import { WAREHOUSE_GRAPH } from '@/utils/pathfinding';
import { Position } from '@/types';
import { useSimulationStore } from '@/store/useSimulationStore';
import { SAMPLE_SCENARIOS, getScenarioNames } from '@/data/sampleOrders';
import { getNodeName } from '@/data/nodeMapping';

const getNodeIdFromPosition = (position: Position): string => {
    for (const [nodeId, node] of Object.entries(WAREHOUSE_GRAPH)) {
        if (node.position.x === position.x && node.position.y === position.y) {
            return nodeId;
        }
    }
    return 'L1';
};

const PlanModePanel: React.FC = () => {
    const store = useSimulationStore();
    const sampleOptions = getScenarioNames();

    const handleSampleChange = (sampleId: string) => {
        const scenario = SAMPLE_SCENARIOS.find(s => s.id === sampleId);
        if (scenario) {
            store.addSampleOrders(scenario.orders, sampleId);
        }
    };

    const handleClearSample = () => {
        store.clearPendingOrders();
    };

    const handleStartSimulation = () => {
        store.setAppMode('simulation');
        if (store.amrs.length === 0) {
            store.initializeAMRs(3);
        }
    };

    const handleDispatchOrder = () => {
        alert('Dispatch Order feature coming soon!');
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Configuration</h2>
                <p className="text-sm text-muted-foreground">Plan your warehouse operations</p>
            </div>

            {/* Sample Orders Dropdown */}
            <div className="space-y-2 border rounded-lg p-4 bg-secondary/20">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Sample Orders</h3>
                <select
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={store.selectedSampleId || ''}
                    onChange={(e) => handleSampleChange(e.target.value)}
                >
                    <option value="" disabled>Select a sample...</option>
                    {sampleOptions.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                            {scenario.name}
                        </option>
                    ))}
                </select>
                
                {store.pendingOrders.length > 0 && (
                    <div className="flex items-center justify-between text-xs bg-green-50 p-2 rounded border border-green-200">
                        <div className="flex items-center gap-1 text-green-700">
                            <Check size={12} />
                            <span>{store.pendingOrders.length} orders loaded</span>
                        </div>
                        <button 
                            onClick={handleClearSample}
                            className="text-red-500 hover:text-red-700"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Add Custom Orders */}
            <div className="space-y-2 border rounded-lg p-4 bg-secondary/20">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Custom Orders</h3>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors">
                    <Plus size={16} />
                    Add Order
                </button>
            </div>

            {/* Fleet Configuration */}
            <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Fleet Config</h3>
                
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
                        id="autoAssign"
                        checked={store.autoAssignTasks}
                        onChange={store.toggleAutoAssign}
                        className="rounded border-input text-primary focus:ring-ring"
                    />
                    <label htmlFor="autoAssign" className="text-sm cursor-pointer select-none">Auto-assign Tasks</label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="collisionAvoidance"
                        checked={store.collisionAvoidanceEnabled}
                        onChange={store.toggleCollisionAvoidance}
                        className="rounded border-input text-primary focus:ring-ring"
                    />
                    <label htmlFor="collisionAvoidance" className="text-sm cursor-pointer select-none">Collision Avoidance</label>
                </div>
            </div>

            {/* Spawn Positions */}
            {store.amrs.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Spawn Positions</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {store.amrs.map((amr) => (
                            <div key={amr.id} className="flex items-center gap-2 text-xs">
                                <span className={`font-mono font-semibold w-16 ${amr.status === 'error' ? 'text-red-600' : 'text-slate-700'}`}>
                                    {amr.id}
                                </span>
                                <select
                                    value={getNodeIdFromPosition(amr.position)}
                                    onChange={(e) => store.setAMRSpawnNode(amr.id, e.target.value)}
                                    disabled={store.isRunning}
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-white disabled:opacity-50"
                                >
                                    {Object.keys(WAREHOUSE_GRAPH).map((nodeId) => (
                                        <option key={nodeId} value={nodeId}>
                                            {nodeId}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 mt-auto">
                <button
                    onClick={() => store.addLog('Orders sent to CuOpt', 'info')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    <Send size={18} />
                    Send to CuOpt
                </button>

                <button
                    onClick={handleStartSimulation}
                    disabled={store.pendingOrders.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Rocket size={18} />
                    Start Simulation
                </button>

                <button
                    onClick={handleDispatchOrder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium border border-input hover:bg-accent transition-colors"
                >
                    <Truck size={18} />
                    Dispatch Order
                </button>
            </div>
        </div>
    );
};

const SimulationModePanel: React.FC = () => {
    const store = useSimulationStore();
    const [showScheduler, setShowScheduler] = useState(false);
    const [activeSection, setActiveSection] = useState<'orders' | 'amrs'>('orders');

    const handleStopSimulation = () => {
        store.setAppMode('plan');
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Simulation</h2>
                <p className="text-sm text-muted-foreground">Active simulation controls</p>
            </div>

            {/* Section Toggle */}
            <div className="flex border rounded-md overflow-hidden">
                <button
                    onClick={() => setActiveSection('orders')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${activeSection === 'orders'
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                >
                    <List size={14} />
                    Orders
                </button>
                <button
                    onClick={() => setActiveSection('amrs')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${activeSection === 'amrs'
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                >
                    <Map size={14} />
                    AMRs
                </button>
            </div>

            {/* Simulation Controls */}
            <div className="space-y-4 border rounded-lg p-4 bg-secondary/20">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Controls</h3>

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
                        onClick={() => store.initializeAMRs(store.amrs.length || 3)}
                        className="p-2 rounded-md border border-input hover:bg-accent text-accent-foreground"
                        title="Reset"
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

            {/* Orders Section */}
            {activeSection === 'orders' && (
                <div className="space-y-3 border rounded-lg p-4 bg-secondary/20 flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        Active Orders ({store.pendingOrders.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto flex-1">
                        {store.pendingOrders.map((order, idx) => (
                            <div 
                                key={idx} 
                                className="flex items-center justify-between p-2 rounded bg-background text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    <Package size={12} className="text-brand-yellow" />
                                    <span className="font-medium">Order {idx + 1}</span>
                                </div>
                                <div className="text-muted-foreground text-[10px]">
                                    {getNodeName(order.pickup_location)} → {getNodeName(order.delivery_location)}
                                </div>
                            </div>
                        ))}
                        {store.pendingOrders.length === 0 && (
                            <p className="text-xs text-muted-foreground">No orders loaded</p>
                        )}
                    </div>

                    {/* View Scheduler Toggle */}
                    <div className="pt-2 border-t">
                        <button
                            onClick={() => setShowScheduler(!showScheduler)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border rounded hover:bg-accent transition-colors"
                        >
                            {showScheduler ? 'Hide Scheduler' : 'View Full Schedule'}
                        </button>
                    </div>
                </div>
            )}

            {/* AMRs Section */}
            {activeSection === 'amrs' && (
                <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        Active AMRs ({store.amrs.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {store.amrs.map((amr) => (
                            <div 
                                key={amr.id} 
                                className="flex items-center justify-between p-2 rounded bg-background text-xs cursor-pointer hover:bg-accent"
                                onClick={() => store.selectAMR(amr.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                        amr.status === 'moving' ? 'bg-yellow-500' :
                                        amr.status === 'idle' ? 'bg-green-500' :
                                        amr.status === 'error' ? 'bg-red-500' :
                                        amr.status === 'loading' ? 'bg-amber-500' :
                                        amr.status === 'unloading' ? 'bg-purple-500' : 'bg-slate-400'
                                    }`} />
                                    <span className="font-medium">{amr.id}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase ${
                                        amr.status === 'error' ? 'text-red-600' : 'text-muted-foreground'
                                    }`}>
                                        {amr.status}
                                    </span>
                                    <span className={`${amr.battery < 20 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {amr.battery}%
                                    </span>
                                </div>
                            </div>
                        ))}
                        {store.amrs.length === 0 && (
                            <p className="text-xs text-muted-foreground">No AMRs initialized</p>
                        )}
                    </div>
                </div>
            )}

            {/* Return to Plan Mode */}
            <button
                onClick={handleStopSimulation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium border border-input hover:bg-accent transition-colors mt-auto"
            >
                Back to Planning
            </button>
        </div>
    );
};

export const LeftPanel: React.FC = () => {
    const appMode = useSimulationStore((state) => state.appMode);

    return appMode === 'simulation' ? <SimulationModePanel /> : <PlanModePanel />;
};
