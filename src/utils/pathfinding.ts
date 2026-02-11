import { Position } from '../types';


// Graph node structure
export interface GraphNode {
    id: string;
    position: Position;
    neighbors: string[]; // IDs of connected nodes
}

// Warehouse navigation graph
export const WAREHOUSE_GRAPH: Record<string, GraphNode> = {
    // Left vertical path
    'L1': { id: 'L1', position: { x: 80, y: 100 }, neighbors: ['L2', 'T1'] },
    'L2': { id: 'L2', position: { x: 80, y: 200 }, neighbors: ['L1', 'L3'] },
    'L3': { id: 'L3', position: { x: 80, y: 300 }, neighbors: ['L2', 'L4', 'M3'] },
    'L4': { id: 'L4', position: { x: 80, y: 400 }, neighbors: ['L3', 'L5'] },
    'L5': { id: 'L5', position: { x: 80, y: 500 }, neighbors: ['L4', 'B1'] },

    // Top horizontal path
    'T1': { id: 'T1', position: { x: 200, y: 100 }, neighbors: ['L1', 'T2', 'V1'] },
    'T2': { id: 'T2', position: { x: 300, y: 100 }, neighbors: ['T1', 'T3'] },
    'T3': { id: 'T3', position: { x: 400, y: 100 }, neighbors: ['T2', 'T4', 'M1'] },
    'T4': { id: 'T4', position: { x: 500, y: 100 }, neighbors: ['T3', 'T5'] },
    'T5': { id: 'T5', position: { x: 600, y: 100 }, neighbors: ['T4', 'R1'] },

    // Vertical connector at x=200
    'V1': { id: 'V1', position: { x: 200, y: 200 }, neighbors: ['T1', 'V2'] },
    'V2': { id: 'V2', position: { x: 200, y: 300 }, neighbors: ['V1', 'V3', 'M3'] },
    'V3': { id: 'V3', position: { x: 200, y: 400 }, neighbors: ['V2', 'B1'] },

    // Middle horizontal path
    'M1': { id: 'M1', position: { x: 400, y: 200 }, neighbors: ['T3', 'M2'] },
    'M2': { id: 'M2', position: { x: 400, y: 300 }, neighbors: ['M1', 'M3', 'M4', 'M5'] },
    'M3': { id: 'M3', position: { x: 300, y: 300 }, neighbors: ['L3', 'M2', 'V2'] },
    'M4': { id: 'M4', position: { x: 500, y: 300 }, neighbors: ['M2', 'R3'] },

    // Bottom horizontal path
    'B1': { id: 'B1', position: { x: 200, y: 500 }, neighbors: ['L5', 'B2', 'V3'] },
    'B2': { id: 'B2', position: { x: 300, y: 500 }, neighbors: ['B1', 'B3'] },
    'B3': { id: 'B3', position: { x: 400, y: 500 }, neighbors: ['B2', 'B4', 'M5'] },
    'B4': { id: 'B4', position: { x: 500, y: 500 }, neighbors: ['B3', 'B5'] },
    'B5': { id: 'B5', position: { x: 600, y: 500 }, neighbors: ['B4', 'R5'] },

    // Middle vertical connector at x=400
    'M5': { id: 'M5', position: { x: 400, y: 400 }, neighbors: ['M2', 'B3'] },

    // Right vertical path
    'R1': { id: 'R1', position: { x: 600, y: 100 }, neighbors: ['T5', 'R2'] },
    'R2': { id: 'R2', position: { x: 600, y: 200 }, neighbors: ['R1', 'R3'] },
    'R3': { id: 'R3', position: { x: 600, y: 300 }, neighbors: ['R2', 'R4', 'M4', 'CHARGE'] },
    'R4': { id: 'R4', position: { x: 600, y: 400 }, neighbors: ['R3', 'R5'] },
    'R5': { id: 'R5', position: { x: 600, y: 500 }, neighbors: ['R4', 'B5'] },

    // Charging station
    'CHARGE': { id: 'CHARGE', position: { x: 700, y: 300 }, neighbors: ['R3'] },
};


// Simple BFS pathfinding - more reliable than A* for this use case
export function findPath(startNodeId: string, endNodeId: string): Position[] {
    if (!WAREHOUSE_GRAPH[startNodeId] || !WAREHOUSE_GRAPH[endNodeId]) {
        console.error(`[findPath] Node not found: start=${startNodeId}, end=${endNodeId}`);
        return [];
    }

    if (startNodeId === endNodeId) {
        return [WAREHOUSE_GRAPH[startNodeId].position];
    }

    // BFS to find shortest path
    const queue: string[] = [startNodeId];
    const visited = new Set<string>([startNodeId]);
    const parent = new Map<string, string>();
    
    let iterations = 0;
    const MAX_ITERATIONS = 100;

    while (queue.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        const current = queue.shift()!;

        const currentNode = WAREHOUSE_GRAPH[current];
        if (!currentNode || !currentNode.neighbors) continue;

        for (const neighborId of currentNode.neighbors) {
            if (visited.has(neighborId)) continue;
            
            visited.add(neighborId);
            parent.set(neighborId, current);

            if (neighborId === endNodeId) {
                // Reconstruct path
                const path: Position[] = [];
                let nodeId: string | undefined = endNodeId;
                
                while (nodeId) {
                    path.unshift(WAREHOUSE_GRAPH[nodeId].position);
                    nodeId = parent.get(nodeId);
                }
                
                return path;
            }

            queue.push(neighborId);
        }
    }

    console.error(`[findPath] No path found from ${startNodeId} to ${endNodeId}`);
    return [];
}

// Find nearest graph node to a position
export function findNearestNode(position: Position): string {
    let nearestId = 'L1';
    let minDist = Infinity;

    for (const [id, node] of Object.entries(WAREHOUSE_GRAPH)) {
        const dist = Math.sqrt(Math.pow(position.x - node.position.x, 2) + Math.pow(position.y - node.position.y, 2));
        if (dist < minDist) {
            minDist = dist;
            nearestId = id;
        }
    }

    return nearestId;
}

// Check if a path exists between two nodes
export function pathExists(startNodeId: string, endNodeId: string): boolean {
    return findPath(startNodeId, endNodeId).length > 0;
}

// Get all reachable nodes from a start node
export function getReachableNodes(startNodeId: string): string[] {
    if (!WAREHOUSE_GRAPH[startNodeId]) return [];
    
    const reachable = new Set<string>([startNodeId]);
    const queue = [startNodeId];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        const node = WAREHOUSE_GRAPH[current];
        
        for (const neighborId of node.neighbors) {
            if (!reachable.has(neighborId)) {
                reachable.add(neighborId);
                queue.push(neighborId);
            }
        }
    }
    
    return Array.from(reachable);
}
