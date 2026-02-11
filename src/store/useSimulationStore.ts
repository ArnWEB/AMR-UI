import { create } from 'zustand';
import { AMR, Task, LogEntry, Position } from '@/types';

interface SimulationState {
    isRunning: boolean;
    speed: number;
    amrs: AMR[];
    logs: LogEntry[];
    tasks: Task[];
    selectedAmrId: string | null;
    showHeatmap: boolean;

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
}

const INITIAL_POSITIONS = [
    { x: 100, y: 100 },
    { x: 100, y: 300 },
    { x: 100, y: 500 },
];

export const useSimulationStore = create<SimulationState>((set, get) => ({
    isRunning: false,
    speed: 1,
    amrs: [],
    logs: [],
    tasks: [],
    selectedAmrId: null,
    showHeatmap: false,

    toggleSimulation: () => set((state) => {
        const newIsRunning = !state.isRunning;
        return {
            isRunning: newIsRunning,
            amrs: state.amrs.map(amr =>
                amr.status === 'error' ? amr :
                    { ...amr, status: newIsRunning ? 'moving' : 'idle' }
            )
        };
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
        const newAMRs: AMR[] = Array.from({ length: count }).map((_, i) => ({
            id: `AMR-${i + 1}`,
            status: isRunning ? 'moving' : 'idle',
            position: INITIAL_POSITIONS[i % INITIAL_POSITIONS.length] || { x: 50, y: 50 },
            battery: 100,
            path: []
        }));
        set({ amrs: newAMRs });
        get().addLog(`Initialized ${count} AMRs`, 'info');
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
}));
