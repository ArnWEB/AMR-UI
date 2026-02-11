export interface Position {
    x: number;
    y: number;
}

export interface AMR {
    id: string;
    status: 'idle' | 'moving' | 'loading' | 'unloading' | 'charging' | 'error';
    position: Position;
    battery: number;
    path: Position[]; // Queue of target positions
    currentTask?: string;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'error';
}

export interface Task {
    id: string;
    type: 'move' | 'pickup' | 'dropoff';
    status: 'pending' | 'active' | 'completed';
    targetId: string;
}
