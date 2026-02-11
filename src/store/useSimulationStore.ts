import { create } from 'zustand';
import { AMR, LogEntry, Position } from '@/types';
import { WorkflowTask, TaskStep, Cargo } from '@/types/tasks';
import { WAREHOUSE_GRAPH, findPath, findNearestNode } from '@/utils/pathfinding';
import { ZONES, getFirstAvailableNode, findBestProcessingNode, findBestStorageNode } from '@/data/zones';

interface SimulationState {
    isRunning: boolean;
    speed: number;
    amrs: AMR[];
    logs: LogEntry[];
    selectedAmrId: string | null;
    showHeatmap: boolean;
    
    // Workflow state
    workflowTasks: WorkflowTask[];
    cargos: Cargo[];
    autoAssignTasks: boolean;
    
    // Actions
    toggleSimulation: () => void;
    setSpeed: (speed: number) => void;
    updateAMRPosition: (id: string, position: Position) => void;
    addLog: (message: string, type?: 'info' | 'warning' | 'error') => void;
    initializeAMRs: (count: number) => void;
    updateAMRStatus: (id: string, status: AMR['status']) => void;
    selectAMR: (id: string | null) => void;
    toggleHeatmap: () => void;
    toggleAMRHealth: (id: string) => void;
    queueWaypoints: (id: string, waypoints: Position[]) => void;
    shiftWaypoint: (id: string) => void;
    emergencyStop: () => void;
    setAMRSpawnNode: (id: string, nodeId: string) => void;
    
    // Workflow actions
    createInboundTask: () => string | null;
    assignTaskToAMR: (amrId: string, taskId: string) => void;
    executeNextStep: (amrId: string) => void;
    completeCurrentStep: (amrId: string) => void;
    toggleAutoAssign: () => void;
    sendAMRToDock: (id: string) => void;
    sendAMRToCharging: (id: string) => void;
    getAMRCurrentTask: (amrId: string) => WorkflowTask | undefined;
}

const INITIAL_POSITIONS = [
    { x: 80, y: 100 },   // L1 - Dock entrance
    { x: 80, y: 200 },   // L2 - Dock area
    { x: 200, y: 100 },  // T1 - Top aisle
    { x: 400, y: 300 },  // M2 - Central junction
    { x: 600, y: 300 },  // R3 - Right aisle
];

// Generate an inbound storage task
function generateInboundTask(startNodeId?: string): WorkflowTask {
    const dockZone = ZONES['DOCK_LEFT'];
    
    // Use smart node selection based on AMR's current position
    const processingNode = startNodeId ? findBestProcessingNode(startNodeId) : 'M3';
    const storageNode = startNodeId ? findBestStorageNode(processingNode) : 'B3';
    const dockNode = startNodeId || getFirstAvailableNode(dockZone) || 'L1';
    
    const steps: TaskStep[] = [
        {
            id: crypto.randomUUID(),
            action: 'move',
            targetNodeId: processingNode,
            description: 'Navigate to Pallet Pickup Zone',
            duration: 0
        },
        {
            id: crypto.randomUUID(),
            action: 'load',
            targetNodeId: processingNode,
            description: 'Loading cargo at Pallet Pickup Zone',
            duration: 2000 // 2 seconds for loading
        },
        {
            id: crypto.randomUUID(),
            action: 'move',
            targetNodeId: storageNode,
            description: `Transport cargo to Storage`,
            duration: 0
        },
        {
            id: crypto.randomUUID(),
            action: 'unload',
            targetNodeId: storageNode,
            description: 'Unloading cargo at Storage',
            duration: 2000 // 2 seconds for unloading
        },
        {
            id: crypto.randomUUID(),
            action: 'move',
            targetNodeId: dockNode,
            description: 'Return to Dock',
            duration: 0
        }
    ];
    
    return {
        id: crypto.randomUUID(),
        type: 'inbound',
        steps,
        currentStepIndex: 0,
        status: 'pending',
        priority: 1,
        createdAt: new Date().toISOString()
    };
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
    isRunning: false,
    speed: 1,
    amrs: [],
    logs: [],
    selectedAmrId: null,
    showHeatmap: false,
    workflowTasks: [],
    cargos: [],
    autoAssignTasks: true,

    toggleSimulation: () => set((state) => {
        const newIsRunning = !state.isRunning;
        
        // Create new state object
        const newState: Partial<SimulationState> = {
            isRunning: newIsRunning
        };
        
        // Track which AMRs need tasks for execution
        const amrsNeedingTasks: string[] = [];
        
        // If starting and auto-assign is enabled, assign tasks
        if (newIsRunning && state.autoAssignTasks) {
            const newTasks: WorkflowTask[] = [];
            const updatedAmrs = state.amrs.map((amr) => {
                if (amr.status !== 'error' && !amr.currentTask) {
                    // Get AMR's current position as start node
                    const startNodeId = findNearestNode(amr.position);
                    // Create task inline with smart node selection
                    const task = generateInboundTask(startNodeId);
                    task.assignedTo = amr.id;
                    task.status = 'active';
                    task.startedAt = new Date().toISOString();
                    newTasks.push(task);
                    amrsNeedingTasks.push(amr.id);
                    
                    // Assign task to AMR
                    return {
                        ...amr,
                        currentTask: task.id
                    };
                }
                return amr;
            });
            
            newState.amrs = updatedAmrs;
            newState.workflowTasks = [...state.workflowTasks, ...newTasks];
            
            // Execute first step for each AMR after state update
            setTimeout(() => {
                amrsNeedingTasks.forEach((amrId) => {
                    get().executeNextStep(amrId);
                });
            }, 100);
        }
        
        return newState;
    }),

    setSpeed: (speed) => set({ speed }),

    updateAMRPosition: (id, position) => set((state) => ({
        amrs: state.amrs.map((amr) =>
            amr.id === id ? { ...amr, position } : amr
        )
    })),

    updateAMRStatus: (id, status) => set((state) => ({
        amrs: state.amrs.map((amr) =>
            amr.id === id ? { ...amr, status } : amr
        )
    })),

    addLog: (message, type = 'info') => set((state) => {
        const newLog: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };
        return { logs: [newLog, ...state.logs].slice(0, 50) };
    }),

    initializeAMRs: (count) => {
        const isRunning = get().isRunning;

        const newAMRs: AMR[] = Array.from({ length: count }).map((_, i) => {
            const startPos = INITIAL_POSITIONS[i % INITIAL_POSITIONS.length] || { x: 50, y: 50 };

            return {
                id: `AMR-${i + 1}`,
                status: 'idle',
                position: startPos,
                battery: 100,
                path: []
            };
        });
        
        // Auto-assign tasks if running
        if (isRunning) {
            const newTasks: WorkflowTask[] = [];
            newAMRs.forEach(amr => {
                const startNodeId = findNearestNode(amr.position);
                const task = generateInboundTask(startNodeId);
                task.assignedTo = amr.id;
                task.status = 'active';
                task.startedAt = new Date().toISOString();
                newTasks.push(task);
                amr.currentTask = task.id;
            });
            
            set({ amrs: newAMRs, workflowTasks: newTasks });
            get().addLog(`Initialized ${count} AMRs with active workflow tasks`, 'info');
            
            // Execute first steps after state update
            setTimeout(() => {
                newAMRs.forEach(amr => {
                    get().executeNextStep(amr.id);
                });
            }, 100);
        } else {
            set({ amrs: newAMRs, workflowTasks: [] });
            get().addLog(`Initialized ${count} AMRs ready for workflow tasks`, 'info');
        }
    },

    selectAMR: (id) => set({ selectedAmrId: id }),
    
    toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),

    toggleAMRHealth: (id) => set((state) => {
        const amr = state.amrs.find(a => a.id === id);
        if (!amr) return {};

        const newStatus = amr.status === 'error' ? 'idle' : 'error';
        get().addLog(`AMR ${id} is now ${newStatus}`, newStatus === 'error' ? 'error' : 'info');

        return {
            amrs: state.amrs.map((a) =>
                a.id === id ? { ...a, status: newStatus } : a
            )
        };
    }),

    queueWaypoints: (id: string, waypoints: Position[]) => set((state) => ({
        amrs: state.amrs.map(amr =>
            amr.id === id ? {
                ...amr,
                path: [...amr.path, ...waypoints],
                status: 'moving'
            } : amr
        )
    })),

    shiftWaypoint: (id: string) => set((state) => {
        const amr = state.amrs.find(a => a.id === id);
        if (!amr) return {};
        
        const newPath = amr.path.slice(1);
        
        // Check if current task has more steps
        if (newPath.length === 0 && amr.currentTask) {
            // Current move step completed
            get().completeCurrentStep(id);
        }
        
        return {
            amrs: state.amrs.map((a) =>
                a.id === id ? { ...a, path: newPath, status: newPath.length > 0 ? 'moving' : a.status } : a
            )
        };
    }),

    emergencyStop: () => set((state) => ({
        isRunning: false,
        amrs: state.amrs.map(amr => ({ ...amr, status: 'error', path: [] }))
    })),

    setAMRSpawnNode: (id: string, nodeId: string) => {
        if (!WAREHOUSE_GRAPH[nodeId]) {
            console.error(`Invalid node: ${nodeId}`);
            return;
        }

        const newPosition = { ...WAREHOUSE_GRAPH[nodeId].position };

        set((state) => ({
            amrs: state.amrs.map(amr =>
                amr.id === id ? {
                    ...amr,
                    position: newPosition,
                    path: [],
                    status: 'idle'
                } : amr
            )
        }));

        get().addLog(`${id} spawned at node ${nodeId}`, 'info');
    },

    // Workflow Actions
    createInboundTask: () => {
        const task = generateInboundTask();
        set((state) => ({
            workflowTasks: [...state.workflowTasks, task]
        }));
        get().addLog(`New inbound task created: ${task.id}`, 'info');
        return task.id;
    },

    assignTaskToAMR: (amrId: string, taskId: string) => {
        set((state) => ({
            workflowTasks: state.workflowTasks.map(t =>
                t.id === taskId ? { ...t, assignedTo: amrId, status: 'active', startedAt: new Date().toISOString() } : t
            ),
            amrs: state.amrs.map(amr =>
                amr.id === amrId ? { ...amr, currentTask: taskId } : amr
            )
        }));
        get().addLog(`Task ${taskId} assigned to ${amrId}`, 'info');
    },

    executeNextStep: (amrId: string) => {
        const state = get();
        const amr = state.amrs.find(a => a.id === amrId);
        if (!amr || !amr.currentTask) return;

        const task = state.workflowTasks.find(t => t.id === amr.currentTask);
        if (!task || task.status !== 'active') return;

        const currentStep = task.steps[task.currentStepIndex];
        if (!currentStep) {
            // Task completed
            set((s) => ({
                workflowTasks: s.workflowTasks.map(t =>
                    t.id === task.id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
                ),
                amrs: s.amrs.map(a =>
                    a.id === amrId ? { ...a, currentTask: undefined, status: 'idle' } : a
                )
            }));
            get().addLog(`${amrId} completed task ${task.id}`, 'info');
            
            // Auto-assign new task if enabled
            if (state.autoAssignTasks && state.isRunning) {
                setTimeout(() => {
                    const newTaskId = get().createInboundTask();
                    if (newTaskId) {
                        get().assignTaskToAMR(amrId, newTaskId);
                        get().executeNextStep(amrId);
                    }
                }, 1000);
            }
            return;
        }

        // Execute the step
        if (currentStep.action === 'move') {
            const currentNode = findNearestNode(amr.position);
            const path = findPath(currentNode, currentStep.targetNodeId);
            if (path.length > 0) {
                get().queueWaypoints(amrId, path);
                get().updateAMRStatus(amrId, 'moving');
                get().addLog(`${amrId} moving to ${currentStep.targetNodeId}`, 'info');
            } else {
                get().addLog(`${amrId}: No path found to ${currentStep.targetNodeId}`, 'error');
            }
        } else if (currentStep.action === 'load') {
            get().updateAMRStatus(amrId, 'loading');
            get().addLog(`${amrId} loading cargo...`, 'info');
            
            // Simulate loading time
            setTimeout(() => {
                const loadingAmr = get().amrs.find(a => a.id === amrId);
                if (loadingAmr && loadingAmr.currentTask) {
                    // Create cargo
                    const cargo: Cargo = {
                        id: crypto.randomUUID(),
                        type: 'pallet',
                        weight: Math.floor(Math.random() * 500) + 100,
                        status: 'in_transit',
                        location: amrId
                    };
                    set((s) => ({ cargos: [...s.cargos, cargo] }));
                    get().completeCurrentStep(amrId);
                }
            }, currentStep.duration || 2000);
        } else if (currentStep.action === 'unload') {
            get().updateAMRStatus(amrId, 'unloading');
            get().addLog(`${amrId} unloading cargo...`, 'info');
            
            // Simulate unloading time
            setTimeout(() => {
                const unloadingAmr = get().amrs.find(a => a.id === amrId);
                if (unloadingAmr && unloadingAmr.currentTask) {
                    // Update cargo status
                    set((s) => ({
                        cargos: s.cargos.map(c =>
                            c.location === amrId ? { ...c, status: 'stored', location: currentStep.targetNodeId } : c
                        )
                    }));
                    get().completeCurrentStep(amrId);
                }
            }, currentStep.duration || 2000);
        }
    },

    completeCurrentStep: (amrId: string) => {
        const state = get();
        const amr = state.amrs.find(a => a.id === amrId);
        if (!amr || !amr.currentTask) return;

        const task = state.workflowTasks.find(t => t.id === amr.currentTask);
        if (!task) return;

        const nextIndex = task.currentStepIndex + 1;
        
        set((s) => ({
            workflowTasks: s.workflowTasks.map(t =>
                t.id === task.id ? { ...t, currentStepIndex: nextIndex } : t
            ),
            amrs: s.amrs.map(a =>
                a.id === amrId ? { ...a, status: 'idle' } : a
            )
        }));

        // Execute next step
        setTimeout(() => {
            get().executeNextStep(amrId);
        }, 100);
    },

    toggleAutoAssign: () => set((state) => ({ autoAssignTasks: !state.autoAssignTasks })),

    sendAMRToDock: (id: string) => {
        const amr = get().amrs.find(a => a.id === id);
        if (!amr) return;

        const startNode = findNearestNode(amr.position);
        const dockNode = 'L1';
        const path = findPath(startNode, dockNode);

        if (path.length > 0) {
            set((state) => ({
                amrs: state.amrs.map(a =>
                    a.id === id ? { ...a, path, status: 'moving' } : a
                )
            }));
            get().addLog(`${id} navigating to dock via graph`, 'info');
        }
    },

    sendAMRToCharging: (id: string) => {
        const amr = get().amrs.find(a => a.id === id);
        if (!amr) return;

        const startNode = findNearestNode(amr.position);
        const chargeNode = 'CHARGE';
        const path = findPath(startNode, chargeNode);

        if (path.length > 0) {
            set((state) => ({
                amrs: state.amrs.map(a =>
                    a.id === id ? { ...a, path, status: 'moving' } : a
                )
            }));
            get().addLog(`${id} navigating to charging station via graph`, 'info');
        }
    },

    getAMRCurrentTask: (amrId: string) => {
        const state = get();
        const amr = state.amrs.find(a => a.id === amrId);
        if (!amr || !amr.currentTask) return undefined;
        return state.workflowTasks.find(t => t.id === amr.currentTask);
    }
}));
