import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Battery, Activity, AlertCircle, Clock, X } from 'lucide-react';
import { ProcessFlow } from './ProcessFlow';


export const RightPanel: React.FC = () => {
    const { amrs, logs, selectedAmrId, selectAMR, toggleAMRHealth } = useSimulationStore();


    // Calculate simple stats
    const activeCount = amrs.filter(a => a.status === 'moving').length;
    const idleCount = amrs.length - activeCount;

    const selectedAmr = amrs.find(a => a.id === selectedAmrId);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Status Overview</h2>
                <p className="text-sm text-muted-foreground">Real-time metrics & logs</p>
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
                                <div className={`w-2 h-2 rounded-full ${selectedAmr.status === 'moving' ? 'bg-blue-500' : 
                                    selectedAmr.status === 'error' ? 'bg-red-500' : 'bg-green-500'
                                    }`} />
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


                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg">
                            <div className="text-xs text-muted-foreground uppercase">Battery</div>
                            <div className="text-xl font-bold flex items-center gap-2">
                                {selectedAmr.battery}%
                                <Battery size={16} className={selectedAmr.battery < 20 ? 'text-red-500' : 'text-green-500'} />
                            </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <div className="text-xs text-muted-foreground uppercase">Tasks Done</div>
                            <div className="text-xl font-bold">12</div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <ProcessFlow />
                    </div>
                </div>
            ) : (
                /* Default Dashboard View */
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-500/10 border border-blue-200 rounded-lg">
                            <div className="text-xs text-blue-600 font-medium uppercase mb-1">Active AMRs</div>
                            <div className="text-2xl font-bold text-blue-700">{activeCount}</div>
                        </div>
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                            <div className="text-xs text-slate-500 font-medium uppercase mb-1">Idle</div>
                            <div className="text-2xl font-bold text-slate-700">{idleCount}</div>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-200 rounded-lg col-span-2">
                            <div className="text-xs text-green-600 font-medium uppercase mb-1">System Efficiency</div>
                            <div className="text-2xl font-bold text-green-700">98.5%</div>
                        </div>
                    </div>

                    {/* Active AMRs List */}
                    <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Activity size={14} /> Fleet Status
                        </h3>

                        <div className="overflow-y-auto pr-2 space-y-2 flex-1">
                            {amrs.map(amr => (
                                <div
                                    key={amr.id}
                                    onClick={() => selectAMR(amr.id)}
                                    className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-sm">{amr.id}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${amr.status === 'moving' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {amr.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Battery size={12} className={amr.battery < 20 ? 'text-red-500' : 'text-green-500'} />
                                            <span>{amr.battery}%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>2m ago</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                    {/* Fake logs just to populate if empty */}
                    {logs.length === 0 && (
                        <>
                            <div className="mb-1 border-l-2 border-green-500/50 pl-2"><span className="text-slate-500">[12:00:00]</span> System initialized</div>
                            <div className="mb-1 border-l-2 border-slate-700 pl-2"><span className="text-slate-500">[12:00:01]</span> Map loaded successfully</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
