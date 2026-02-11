import { Zone } from '@/types/tasks';
import { getReachableNodes } from '@/utils/pathfinding';

export const ZONES: Record<string, Zone> = {
    // Dock zones - AMR starting positions
    'DOCK_LEFT': {
        id: 'DOCK_LEFT',
        name: 'Left Dock',
        type: 'dock',
        nodeIds: ['L1', 'L2', 'L3', 'L4', 'L5'],
        capabilities: ['move', 'load', 'wait'],
        capacity: 5,
        currentLoad: 0,
        color: '#3b82f6' // blue
    },
    // Processing zone - central pickup area (use M3 as primary - directly reachable from dock)
    'PROCESSING_CENTER': {
        id: 'PROCESSING_CENTER',
        name: 'Pallet Pickup Zone',
        type: 'processing',
        nodeIds: ['M3', 'V2', 'L3'], // M3 and V2 are reachable from dock
        capabilities: ['move', 'load', 'unload', 'wait'],
        capacity: 3,
        currentLoad: 0,
        color: '#f59e0b' // amber
    },
    // Storage zones - rack areas
    'STORAGE_TOP': {
        id: 'STORAGE_TOP',
        name: 'Top Storage Rack',
        type: 'storage',
        nodeIds: ['T2', 'T3', 'T4'],
        capabilities: ['move', 'unload', 'wait'],
        capacity: 3,
        currentLoad: 0,
        color: '#22c55e' // green
    },
    'STORAGE_BOTTOM': {
        id: 'STORAGE_BOTTOM',
        name: 'Bottom Storage Rack',
        type: 'storage',
        nodeIds: ['B2', 'B3', 'B4'],
        capabilities: ['move', 'unload', 'wait'],
        capacity: 3,
        currentLoad: 0,
        color: '#22c55e' // green
    },
    // Charging station
    'CHARGING': {
        id: 'CHARGING',
        name: 'Charging Station',
        type: 'charging',
        nodeIds: ['CHARGE'],
        capabilities: ['move', 'wait'],
        capacity: 1,
        currentLoad: 0,
        color: '#10b981' // emerald
    }
};

// Helper functions
export function getZoneByNodeId(nodeId: string): Zone | undefined {
    return Object.values(ZONES).find(zone => zone.nodeIds.includes(nodeId));
}

export function getZonesByType(type: Zone['type']): Zone[] {
    return Object.values(ZONES).filter(zone => zone.type === type);
}

export function getFirstAvailableNode(zone: Zone): string | null {
    // In a real system, check occupancy
    // For demo, return first node
    return zone.nodeIds[0] || null;
}

// Get nodes that are reachable from a specific start node
export function getReachableNodesFrom(startNodeId: string, zone: Zone): string[] {
    const reachable = getReachableNodes(startNodeId);
    return zone.nodeIds.filter(nodeId => reachable.includes(nodeId));
}

// Find the best processing node for a given dock position
export function findBestProcessingNode(startNodeId: string): string {
    const processingZone = ZONES['PROCESSING_CENTER'];
    const reachableNodes = getReachableNodesFrom(startNodeId, processingZone);
    
    // Return first reachable node, or fallback to M3 (most accessible)
    return reachableNodes[0] || 'M3';
}

// Find the best storage node for a given current position
export function findBestStorageNode(startNodeId: string): string {
    const storageZones = [ZONES['STORAGE_TOP'], ZONES['STORAGE_BOTTOM']];
    
    for (const zone of storageZones) {
        const reachableNodes = getReachableNodesFrom(startNodeId, zone);
        if (reachableNodes.length > 0) {
            return reachableNodes[0];
        }
    }
    
    // Fallback to B3
    return 'B3';
}
