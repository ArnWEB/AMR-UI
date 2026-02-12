

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
    // Phase 3: Loading progress
    currentStepProgress?: number; // 0-100 percentage for loading/unloading
}

// Phase 3: Demo scenarios
export interface DemoScenario {
    id: string;
    name: string;
    description: string;
    amrCount: number;
    taskPattern: 'sequential' | 'parallel' | 'burst';
    speed: number;
    duration: number; // seconds
}

export interface Cargo {
    id: string;
    type: 'pallet' | 'box';
    weight: number; // kg
    status: 'waiting' | 'loading' | 'in_transit' | 'stored' | 'unloading';
    location: string; // nodeId or AMR ID
    assignedAMR?: string;
    pickupTime?: string;
    deliveryTime?: string;
    totalTransitTime?: number; // milliseconds
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
    occupiedBy?: string[]; // AMR IDs currently in zone
}

export interface PerformanceMetrics {
    totalTasksCompleted: number;
    totalCargoMoved: number;
    averageTaskCompletionTime: number; // milliseconds
    amrUtilization: Record<string, number>; // AMR ID -> percentage
    zoneUtilization: Record<string, number>; // Zone ID -> percentage
    throughputPerHour: number;
    systemEfficiency: number; // percentage
    startTime: string;
}
