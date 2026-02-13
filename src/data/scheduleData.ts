import { ScheduleEntry, ScheduleTemplate, WeekDay } from '@/types/schedule';

// Demo schedule for a standard Monday in the warehouse
export const generateMondaySchedule = (): ScheduleEntry[] => {
    const baseDate = new Date().toISOString();
    
    return [
        // Morning Receiving Block (08:00 - 10:30)
        {
            id: 'mon-rec-1',
            title: 'Morning Receiving - Dock A',
            description: 'Unload pallets from morning delivery truck',
            type: 'inbound',
            timeWindow: { start: '08:00', end: '09:30' },
            days: ['mon'],
            autoAssign: true,
            priority: 2,
            recurring: true,
            cargoCount: 8,
            sourceZone: 'DOCK_LEFT',
            targetZone: 'PROCESSING_CENTER',
            estimatedDuration: 90,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        {
            id: 'mon-rec-2',
            title: 'Morning Receiving - Dock B',
            description: 'Unload pallets from second delivery truck',
            type: 'inbound',
            timeWindow: { start: '09:00', end: '10:30' },
            days: ['mon'],
            autoAssign: true,
            priority: 2,
            recurring: true,
            cargoCount: 6,
            sourceZone: 'DOCK_LEFT',
            targetZone: 'PROCESSING_CENTER',
            estimatedDuration: 90,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        
        // Processing Block (10:30 - 12:00)
        {
            id: 'mon-proc-1',
            title: 'Inbound Processing',
            description: 'Sort, label, and QA check incoming cargo',
            type: 'processing',
            timeWindow: { start: '10:30', end: '12:00' },
            days: ['mon'],
            autoAssign: true,
            priority: 3,
            recurring: true,
            cargoCount: 14,
            sourceZone: 'PROCESSING_CENTER',
            targetZone: 'PROCESSING_CENTER',
            estimatedDuration: 90,
            status: 'scheduled',
            createdAt: baseDate,
            dependsOn: ['mon-rec-1', 'mon-rec-2'],
            executionLog: []
        },
        
        // Storage Operations (12:00 - 13:30)
        {
            id: 'mon-store-1',
            title: 'Put-away to Storage',
            description: 'Move processed cargo to storage racks',
            type: 'storage',
            timeWindow: { start: '12:00', end: '13:30' },
            days: ['mon'],
            autoAssign: true,
            priority: 4,
            recurring: true,
            cargoCount: 14,
            sourceZone: 'PROCESSING_CENTER',
            targetZone: 'STORAGE_TOP',
            estimatedDuration: 90,
            status: 'scheduled',
            createdAt: baseDate,
            dependsOn: ['mon-proc-1'],
            executionLog: []
        },
        
        // Lunch Break / Low Activity (13:30 - 14:00)
        
        // Peak Picking Block (14:00 - 16:00)
        {
            id: 'mon-pick-1',
            title: 'Peak Picking - Zone A',
            description: 'High-priority order fulfillment from Zone A',
            type: 'outbound',
            timeWindow: { start: '14:00', end: '15:00' },
            days: ['mon'],
            autoAssign: true,
            priority: 1,
            recurring: true,
            cargoCount: 20,
            sourceZone: 'STORAGE_TOP',
            targetZone: 'SHIPPING_DOCK',
            estimatedDuration: 60,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        {
            id: 'mon-pick-2',
            title: 'Peak Picking - Zone B',
            description: 'Order fulfillment from Zone B',
            type: 'outbound',
            timeWindow: { start: '14:30', end: '15:30' },
            days: ['mon'],
            autoAssign: true,
            priority: 2,
            recurring: true,
            cargoCount: 15,
            sourceZone: 'STORAGE_BOTTOM',
            targetZone: 'SHIPPING_DOCK',
            estimatedDuration: 60,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        
        // Replenishment (16:00 - 17:30)
        {
            id: 'mon-replenish-1',
            title: 'Replenishment Forward Pick',
            description: 'Restock forward pick areas from bulk storage',
            type: 'storage',
            timeWindow: { start: '16:00', end: '17:30' },
            days: ['mon'],
            autoAssign: true,
            priority: 5,
            recurring: true,
            cargoCount: 12,
            sourceZone: 'STORAGE_TOP',
            targetZone: 'FORWARD_PICK',
            estimatedDuration: 90,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        
        // Outbound Shipping (17:30 - 18:30)
        {
            id: 'mon-ship-1',
            title: 'Outbound Shipping',
            description: 'Stage and load orders for evening departure',
            type: 'outbound',
            timeWindow: { start: '17:30', end: '18:30' },
            days: ['mon'],
            autoAssign: true,
            priority: 2,
            recurring: true,
            cargoCount: 35,
            sourceZone: 'SHIPPING_DOCK',
            targetZone: 'SHIPPING_DOCK',
            estimatedDuration: 60,
            status: 'scheduled',
            createdAt: baseDate,
            dependsOn: ['mon-pick-1', 'mon-pick-2'],
            executionLog: []
        },
        
        // Maintenance Window (18:30 - 19:30)
        {
            id: 'mon-maint-1',
            title: 'Daily Maintenance Check',
            description: 'Sensor calibration and cleaning cycle',
            type: 'maintenance',
            timeWindow: { start: '18:30', end: '19:30' },
            days: ['mon'],
            autoAssign: true,
            priority: 6,
            recurring: true,
            estimatedDuration: 60,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        
        // Charging Block (22:00 - 06:00 next day)
        {
            id: 'mon-charge-1',
            title: 'Night Charging Cycle',
            description: 'All AMRs return to charging stations',
            type: 'charging',
            timeWindow: { start: '22:00', end: '06:00' },
            days: ['mon'],
            autoAssign: true,
            priority: 10,
            recurring: true,
            estimatedDuration: 480,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        }
    ];
};

// Tuesday schedule - Similar to Monday but with cross-dock operations
export const generateTuesdaySchedule = (): ScheduleEntry[] => {
    const baseDate = new Date().toISOString();
    
    return [
        ...generateMondaySchedule().map(entry => ({
            ...entry,
            id: entry.id.replace('mon', 'tue'),
            days: ['tue'] as WeekDay[]
        })),
        // Additional cross-dock operation for Tuesday
        {
            id: 'tue-cross-1',
            title: 'Cross-Dock Transfer',
            description: 'Direct transfer from receiving to shipping',
            type: 'cross_dock',
            timeWindow: { start: '11:00', end: '12:00' },
            days: ['tue'],
            autoAssign: true,
            priority: 1,
            recurring: true,
            cargoCount: 5,
            sourceZone: 'DOCK_LEFT',
            targetZone: 'SHIPPING_DOCK',
            estimatedDuration: 60,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        }
    ];
};

// Wednesday schedule - Heavy inbound day
export const generateWednesdaySchedule = (): ScheduleEntry[] => {
    const baseDate = new Date().toISOString();
    const mondaySchedule = generateMondaySchedule();
    
    return [
        ...mondaySchedule.map(entry => ({
            ...entry,
            id: entry.id.replace('mon', 'wed'),
            days: ['wed'] as WeekDay[]
        })),
        // Additional receiving shift for Wednesday
        {
            id: 'wed-rec-extra',
            title: 'Afternoon Receiving',
            description: 'Additional pallet delivery',
            type: 'inbound',
            timeWindow: { start: '14:00', end: '15:30' },
            days: ['wed'],
            autoAssign: true,
            priority: 2,
            recurring: true,
            cargoCount: 10,
            sourceZone: 'DOCK_LEFT',
            targetZone: 'PROCESSING_CENTER',
            estimatedDuration: 90,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        }
    ];
};

// Thursday schedule - Similar to Tuesday
export const generateThursdaySchedule = (): ScheduleEntry[] => {
    return generateTuesdaySchedule().map(entry => ({
        ...entry,
        id: entry.id.replace('tue', 'thu'),
        days: ['thu'] as WeekDay[]
    }));
};

// Friday schedule - End of week, cleanup and prep
export const generateFridaySchedule = (): ScheduleEntry[] => {
    const baseDate = new Date().toISOString();
    const mondaySchedule = generateMondaySchedule();
    
    return [
        ...mondaySchedule.map(entry => ({
            ...entry,
            id: entry.id.replace('mon', 'fri'),
            days: ['fri'] as WeekDay[]
        })),
        // Friday cleanup
        {
            id: 'fri-cleanup-1',
            title: 'End-of-Week Cleanup',
            description: 'Organize staging areas and prepare for weekend',
            type: 'storage',
            timeWindow: { start: '16:00', end: '17:30' },
            days: ['fri'],
            autoAssign: true,
            priority: 4,
            recurring: true,
            estimatedDuration: 90,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        }
    ];
};

// Weekend schedules - Maintenance and light operations
export const generateSaturdaySchedule = (): ScheduleEntry[] => {
    const baseDate = new Date().toISOString();
    
    return [
        {
            id: 'sat-maint-1',
            title: 'Weekly Deep Maintenance',
            description: 'Full system diagnostics, cleaning, and calibration',
            type: 'maintenance',
            timeWindow: { start: '09:00', end: '12:00' },
            days: ['sat'],
            autoAssign: true,
            priority: 1,
            recurring: true,
            estimatedDuration: 180,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        {
            id: 'sat-store-1',
            title: 'Weekend Receiving',
            description: 'Limited receiving operations',
            type: 'inbound',
            timeWindow: { start: '13:00', end: '15:00' },
            days: ['sat'],
            autoAssign: true,
            priority: 3,
            recurring: true,
            cargoCount: 4,
            sourceZone: 'DOCK_LEFT',
            targetZone: 'PROCESSING_CENTER',
            estimatedDuration: 120,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        {
            id: 'sat-charge-1',
            title: 'Extended Charging',
            description: 'Ensure full charge for Monday',
            type: 'charging',
            timeWindow: { start: '20:00', end: '08:00' },
            days: ['sat'],
            autoAssign: true,
            priority: 10,
            recurring: true,
            estimatedDuration: 720,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        }
    ];
};

export const generateSundaySchedule = (): ScheduleEntry[] => {
    const baseDate = new Date().toISOString();
    
    return [
        {
            id: 'sun-maint-1',
            title: 'Preventive Maintenance',
            description: 'Component inspection and replacement',
            type: 'maintenance',
            timeWindow: { start: '10:00', end: '14:00' },
            days: ['sun'],
            autoAssign: true,
            priority: 1,
            recurring: true,
            estimatedDuration: 240,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        {
            id: 'sun-prep-1',
            title: 'Monday Preparation',
            description: 'Stage areas and prepare for week start',
            type: 'processing',
            timeWindow: { start: '15:00', end: '17:00' },
            days: ['sun'],
            autoAssign: true,
            priority: 2,
            recurring: true,
            estimatedDuration: 120,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        },
        {
            id: 'sun-charge-1',
            title: 'Pre-Week Charging',
            description: 'Full charge before Monday operations',
            type: 'charging',
            timeWindow: { start: '18:00', end: '06:00' },
            days: ['sun'],
            autoAssign: true,
            priority: 10,
            recurring: true,
            estimatedDuration: 720,
            status: 'scheduled',
            createdAt: baseDate,
            executionLog: []
        }
    ];
};

// Generate full week schedule
export const generateWeekSchedule = (): ScheduleEntry[] => {
    return [
        ...generateMondaySchedule(),
        ...generateTuesdaySchedule(),
        ...generateWednesdaySchedule(),
        ...generateThursdaySchedule(),
        ...generateFridaySchedule(),
        ...generateSaturdaySchedule(),
        ...generateSundaySchedule()
    ];
};

// Schedule templates for quick setup
export const scheduleTemplates: ScheduleTemplate[] = [
    {
        id: 'template-standard',
        name: 'Standard Operations Week',
        description: 'Typical warehouse schedule with receiving, processing, storage, and shipping',
        entries: generateWeekSchedule(),
        applicableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    },
    {
        id: 'template-peak',
        name: 'Peak Season Schedule',
        description: 'High-volume schedule with extended hours and additional shifts',
        entries: [
            ...generateWeekSchedule(),
            // Add extra shifts
            {
                id: 'peak-extra-1',
                title: 'Evening Shift',
                description: 'Additional processing shift',
                type: 'processing',
                timeWindow: { start: '19:00', end: '22:00' },
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                autoAssign: true,
                priority: 3,
                recurring: true,
                cargoCount: 20,
                sourceZone: 'PROCESSING_CENTER',
                targetZone: 'STORAGE_TOP',
                estimatedDuration: 180,
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                executionLog: []
            }
        ],
        applicableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    },
    {
        id: 'template-maintenance',
        name: 'Maintenance Focus Week',
        description: 'Reduced operations with focus on maintenance and repairs',
        entries: [
            ...generateSaturdaySchedule(),
            ...generateSundaySchedule(),
            // Light Monday
            {
                id: 'maint-light-1',
                title: 'Light Receiving Only',
                description: 'Minimal operations',
                type: 'inbound',
                timeWindow: { start: '09:00', end: '12:00' },
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                autoAssign: true,
                priority: 5,
                recurring: true,
                cargoCount: 3,
                sourceZone: 'DOCK_LEFT',
                targetZone: 'PROCESSING_CENTER',
                estimatedDuration: 180,
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                executionLog: []
            }
        ],
        applicableDays: ['mon', 'tue', 'wed', 'thu', 'fri']
    }
];

// Get schedule for a specific day
export const getScheduleForDay = (day: string): ScheduleEntry[] => {
    const dayMap: Record<string, () => ScheduleEntry[]> = {
        'mon': generateMondaySchedule,
        'tue': generateTuesdaySchedule,
        'wed': generateWednesdaySchedule,
        'thu': generateThursdaySchedule,
        'fri': generateFridaySchedule,
        'sat': generateSaturdaySchedule,
        'sun': generateSundaySchedule
    };
    
    const generator = dayMap[day.toLowerCase()];
    return generator ? generator() : [];
};

// Get current day's schedule
export const getTodaySchedule = (): ScheduleEntry[] => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[new Date().getDay()];
    return getScheduleForDay(today);
};
