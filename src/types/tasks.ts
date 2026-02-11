

export type TaskStepAction = 'move' | 'load' | 'unload' | 'wait';

export interface TaskStep {
    id: string;
    action: TaskStepAction;
    targetNodeId: string;
    description: string;
    duration?: number; // milliseconds for loading/unloading
}

export type WorkflowType = 'inbound' | 'storage' | 'charging';

export interface WorkflowTask {
    id: string;
    type: WorkflowType;
    steps: TaskStep[];
    currentStepIndex: number;
    assignedTo?: string; // AMR ID
    status: 'pending' | 'active' | 'completed' | 'failed';
    priority: number; // 1 = highest, 10 = lowest
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
}

export interface Cargo {
    id: string;
    type: 'pallet' | 'box';
    weight: number; // kg
    status: 'waiting' | 'loading' | 'in_transit' | 'stored' | 'unloading';
    location: string; // nodeId or AMR ID
}

export interface Zone {
    id: string;
    name: string;
    type: 'dock' | 'processing' | 'storage' | 'charging';
    nodeIds: string[];
    capabilities: TaskStepAction[];
    capacity: number;
    currentLoad: number;
    color: string; // for visualization
}
