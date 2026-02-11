import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Battery, Activity, AlertCircle, Clock, X, Package } from 'lucide-react';

export const RightPanel: React.FC = () => {
    const { 
        amrs, 
        logs, 
        workflowTasks,
        selectedAmrId, 
        selectAMR, 
        toggleAMRHealth,
        getAMRCurrentTask,
        cargos 
    } = useSimulationStore();

    // Calculate workflow stats
    const loadingCount = amrs.filter(a => a.status === 'loading').length;
    const unloadingCount = amrs.filter(a => a.status === 'unloading').length;
    
    // Task stats
    const pendingTasks = workflowTasks.filter(t => t.status === 'pending').length;
    const activeTasks = workflowTasks.filter(t => t.status === 'active').length;
    const completedTasks = workflowTasks.filter(t => t.status === 'completed').length;
    const cargoInTransit = cargos.filter(c => c.status === 'in_transit').length;
    const cargoStored = cargos.filter(c => c.status === 'stored').length;

    const selectedAmr = amrs.find(a => a.id === selectedAmrId);
    const selectedTask = selectedAmrId ? getAMRCurrentTask(selectedAmrId) : undefined;

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'moving': return 'bg-blue-100 text-blue-700';
            case 'loading': return 'bg-amber-100 text-amber-700';
            case 'unloading': return 'bg-purple-100 text-purple-700';
            case 'idle': return 'bg-green-100 text-green-700';
            case 'error': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getStatusDot = (status: string) => {
        switch(status) {
            case 'moving': return 'bg-blue-500';
            case 'loading': return 'bg-amber-500';
            case 'unloading': return 'bg-purple-500';
            case 'idle': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Workflow Status</h2>
                <p className="text-sm text-muted-foreground">Inbound → Storage Operations</p>
            </div>

            {selectedAmr ? (
                /* Selected AMR View */
                <div className="flex flex-col gap-4 flex-1">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg relative">
                        <button
                            onClick={() => selectAMR(null)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                        <div className="text-xs text-blue-600 font-medium uppercase mb-1">Selected Robot</div>
                        <div className="text-3xl font-bold text-blue-900 mb-1">{selectedAmr.id}</div>
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-sm text-blue-700">
                                <div className={`w-2 h-2 rounded-full ${getStatusDot(selectedAmr.status)}`} />
                                <span className="uppercase font-bold">{selectedAmr.status}</span>
                            </div>
                            
                            <button 
                                onClick={() => toggleAMRHealth(selectedAmr.id)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                    selectedAmr.status === 'error' 
                                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                }`}
                            >
                                {selectedAmr.status === 'error' ? 'Resolve Fault' : 'Simulate Fault'}
                            </button>
                        </div>
                    </div>

                    {/* Current Task Info */}
                    {selectedTask && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="text-xs text-amber-600 font-medium uppercase mb-2">Current Task</div>
                            <div className="text-sm font-bold text-amber-900 mb-1">{selectedTask.type.toUpperCase()}</div>
                            
                            {/* Step Progress */}
                            <div className="space-y-1">
                                {selectedTask.steps.map((step, idx) => {
                                    const isCurrent = idx === selectedTask.currentStepIndex;
                                    const isCompleted = idx < selectedTask.currentStepIndex;
                                    
                                    return (
                                        <div 
                                            key={step.id} 
                                            className={`flex items-center gap-2 text-xs ${
                                                isCurrent ? 'text-amber-900 font-medium' :
                                                isCompleted ? 'text-green-700' : 'text-slate-400'
                                            }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                isCurrent ? 'bg-amber-500 animate-pulse' :
                                                isCompleted ? 'bg-green-500' : 'bg-slate-300'
                                            }`} />
                                            <span>{step.description}</span>
                                            {isCompleted && <span className="text-green-600">✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg">
                            <div className="text-xs text-muted-foreground uppercase">Battery</div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                {selectedAmr.battery}%
                                <Battery size={16} className={selectedAmr.battery < 20 ? 'text-red-500' : 'text-green-500'} />
                            </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <div className="text-xs text-muted-foreground uppercase">Has Cargo</div>
                            <div className="text-xl font-bold">
                                {cargos.some(c => c.location === selectedAmr.id) ? '✓ Yes' : '✗ No'}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Default Dashboard View */
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-500/10 border border-blue-200 rounded-lg">
                            <div className="text-xs text-blue-600 font-medium uppercase mb-1">Active Tasks</div>
                            <div className="text-2xl font-bold text-blue-700">{activeTasks}</div>
                            <div className="text-[10px] text-blue-500">{pendingTasks} pending</div>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-200 rounded-lg">
                            <div className="text-xs text-green-600 font-medium uppercase mb-1">Completed</div>
                            <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
                            <div className="text-[10px] text-green-500">{cargoStored} stored</div>
                        </div>
                        <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-lg">
                            <div className="text-xs text-amber-600 font-medium uppercase mb-1">Cargo</div>
                            <div className="text-2xl font-bold text-amber-700">{cargoInTransit}</div>
                            <div className="text-[10px] text-amber-500">in transit</div>
                        </div>
                        <div className="p-3 bg-purple-500/10 border border-purple-200 rounded-lg">
                            <div className="text-xs text-purple-600 font-medium uppercase mb-1">Operations</div>
                            <div className="text-2xl font-bold text-purple-700">{loadingCount + unloadingCount}</div>
                            <div className="text-[10px] text-purple-500">{loadingCount} loading, {unloadingCount} unloading</div>
                        </div>
                    </div>

                    {/* Active AMRs List */}
                    <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Activity size={14} /> Fleet Status
                        </h3>

                        <div className="overflow-y-auto pr-2 space-y-2 flex-1">
                            {amrs.map(amr => {
                                const task = getAMRCurrentTask(amr.id);
                                return (
                                    <div
                                        key={amr.id}
                                        onClick={() => selectAMR(amr.id)}
                                        className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{amr.id}</span>
                                                {cargos.some(c => c.location === amr.id) && (
                                                    <Package size={12} className="text-green-600" />
                                                )}
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${getStatusColor(amr.status)}`}>
                                                {amr.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Battery size={12} className={amr.battery < 20 ? 'text-red-500' : 'text-green-500'} />
                                                <span>{amr.battery}%</span>
                                            </div>
                                            {task && (
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>Step {task.currentStepIndex + 1}/{task.steps.length}</span>
                                                </div>
                                            )}
                                        </div>
                                        {task && (
                                            <div className="mt-1 text-[10px] text-slate-500 truncate">
                                                {task.steps[task.currentStepIndex]?.description || 'Task completed'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Logs - Always visible */}
            <div className={`flex flex-col border-t pt-4 ${selectedAmr ? 'h-48' : 'h-1/3'}`}>
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <AlertCircle size={14} /> System Logs
                </h3>
                <div className="bg-slate-950 text-slate-300 p-3 rounded-lg text-xs font-mono h-full overflow-y-auto custom-scrollbar">
                    {logs.length === 0 && <div className="text-slate-600 italic">No events recorded.</div>}
                    {logs.map(log => (
                        <div key={log.id} className="mb-1 border-l-2 border-slate-700 pl-2 opacity-80 hover:opacity-100">
                            <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                            <span className={log.type === 'error' ? 'text-red-400' : 'text-slate-300'}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <>
                            <div className="mb-1 border-l-2 border-green-500/50 pl-2"><span className="text-slate-500">[12:00:00]</span> Workflow system initialized</div>
                            <div className="mb-1 border-l-2 border-slate-700 pl-2"><span className="text-slate-500">[12:00:01]</span> Ready for inbound operations</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
