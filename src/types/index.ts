export type AMRStatus = 'idle' | 'moving' | 'loading' | 'unloading' | 'error';

export interface Position {
    x: number;
    y: number;
}

export interface AMR {
    id: string;
    status: AMRStatus;
    position: Position;
    battery: number;
    currentTask?: string;
    path: Position[];
    targetNodeId?: string;
}

export interface Task {
    id: string;
    description: string;
    assignedTo?: string;
    status: 'pending' | 'in-progress' | 'completed';
}

export interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'error';
}
