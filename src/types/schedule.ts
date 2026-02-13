export type ScheduleType = 'inbound' | 'outbound' | 'processing' | 'storage' | 'maintenance' | 'charging' | 'cross_dock';

export type ScheduleStatus = 'scheduled' | 'active' | 'completed' | 'skipped' | 'failed' | 'overdue';

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface TimeWindow {
    start: string; // Format: "HH:MM" (24-hour)
    end: string;   // Format: "HH:MM" (24-hour)
}

export interface ScheduleExecutionRecord {
    timestamp: string;      // ISO timestamp
    amrId: string;         // Which AMR executed this
    action: string;        // Description of action
    duration: number;      // Actual duration in minutes
    success: boolean;      // Whether execution succeeded
    notes?: string;        // Any notes or errors
}

export interface ScheduleEntry {
    id: string;
    title: string;
    description?: string;
    type: ScheduleType;
    timeWindow: TimeWindow;
    days: WeekDay[];
    
    // AMR Assignment
    targetAMRs?: string[];  // null or empty = all available AMRs
    autoAssign: boolean;    // If true, scheduler picks best AMR
    
    // Priority & Scheduling
    priority: number;       // 1 (highest) to 10 (lowest)
    recurring: boolean;     // Is this a recurring schedule?
    
    // Task Details
    cargoCount?: number;    // Number of items to process
    sourceZone?: string;    // Source zone ID
    targetZone?: string;    // Target zone ID
    estimatedDuration: number; // Estimated duration in minutes
    
    // Status Tracking
    status: ScheduleStatus;
    createdAt: string;
    scheduledDate?: string; // For non-recurring schedules
    executionLog?: ScheduleExecutionRecord[];
    
    // Dependencies
    dependsOn?: string[];   // IDs of schedules that must complete first
}

export interface DailySchedule {
    date: string;           // ISO date string
    entries: ScheduleEntry[];
    summary: {
        totalTasks: number;
        completedTasks: number;
        activeTasks: number;
        overdueTasks: number;
        totalUtilization: number; // Percentage
    };
}

export interface WeeklySchedule {
    weekStart: string;      // ISO date string (Monday)
    days: DailySchedule[];
}

export interface ScheduleTemplate {
    id: string;
    name: string;
    description: string;
    entries: ScheduleEntry[];
    applicableDays: WeekDay[];
}

// Schedule Configuration
export interface ScheduleConfig {
    enabled: boolean;
    autoExecute: boolean;           // Auto-start scheduled tasks
    conflictResolution: 'skip' | 'alert' | 'reschedule';
    bufferTime: number;             // Minutes between tasks
    maxOverdueMinutes: number;      // Before marking as failed
    notifyOnConflict: boolean;
}

// Helper functions for schedule operations
export const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getScheduleTypeLabel = (type: ScheduleType): string => {
    const labels: Record<ScheduleType, string> = {
        inbound: 'Receiving',
        outbound: 'Shipping',
        processing: 'Processing',
        storage: 'Storage',
        maintenance: 'Maintenance',
        charging: 'Charging',
        cross_dock: 'Cross-Dock'
    };
    return labels[type];
};

export const getScheduleTypeColor = (type: ScheduleType): string => {
    const colors: Record<ScheduleType, string> = {
        inbound: '#3b82f6',      // Blue
        outbound: '#22c55e',     // Green
        processing: '#f59e0b',   // Amber
        storage: '#8b5cf6',      // Purple
        maintenance: '#ef4444',  // Red
        charging: '#06b6d4',     // Cyan
        cross_dock: '#f97316'    // Orange
    };
    return colors[type];
};

export const getStatusColor = (status: ScheduleStatus): string => {
    const colors: Record<ScheduleStatus, string> = {
        scheduled: '#6b7280',    // Gray
        active: '#3b82f6',       // Blue
        completed: '#22c55e',    // Green
        skipped: '#f59e0b',      // Amber
        failed: '#ef4444',       // Red
        overdue: '#dc2626'       // Dark Red
    };
    return colors[status];
};

export const isTimeInWindow = (time: string, window: TimeWindow): boolean => {
    const timeMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(window.start);
    const endMinutes = timeToMinutes(window.end);
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getWeekDayLabel = (day: WeekDay): string => {
    const labels: Record<WeekDay, string> = {
        mon: 'Monday',
        tue: 'Tuesday',
        wed: 'Wednesday',
        thu: 'Thursday',
        fri: 'Friday',
        sat: 'Saturday',
        sun: 'Sunday'
    };
    return labels[day];
};
