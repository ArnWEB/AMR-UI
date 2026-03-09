import { Position } from '../types';
import { WaypointGraphData, WarehouseNode } from '../types/cuopt';
import { fetchWaypointGraph } from '../services/rosBridge';

// Server waypoint graph (fetched from API)
let serverWaypointGraph: WaypointGraphData | null = null;
let fetchPromise: Promise<WaypointGraphData> | null = null;

export interface GraphNode {
  id: string;
  position: Position;
  neighbors: string[];
  type?: 'depot' | 'incoming' | 'processing';
  name?: string;
}

// Convert server graph to UI format
function convertToUIGraph(data: WaypointGraphData): Record<string, GraphNode> {
  const graph: Record<string, GraphNode> = {};
  
  // Scale and offset to fit the UI (between racks at x=110-430, y=40-340)
  const scaleX = 10;
  const scaleY = 25;
  const offsetX = 120;
  const offsetY = 150;
  
  for (const [nodeId, nodeData] of Object.entries(data.nodes)) {
    const numericNodeId = parseInt(nodeId, 10);
    const graphData = data.graph[numericNodeId] || { edges: [], weights: [] };
    const neighbors: string[] = graphData.edges.map((e: number) => e.toString());
    
    graph[nodeId] = {
      id: nodeId,
      position: { 
        x: nodeData.x * scaleX + offsetX, 
        y: nodeData.y * scaleY + offsetY 
      },
      neighbors,
      type: nodeData.type,
      name: nodeData.name,
    };
  }
  
  return graph;
}

// Default fallback graph (same as pathfinding.ts)
export const DEFAULT_GRAPH: Record<string, GraphNode> = {
  'L1': { id: 'L1', position: { x: 80, y: 100 }, neighbors: ['L2', 'T1'] },
  'L2': { id: 'L2', position: { x: 80, y: 200 }, neighbors: ['L1', 'L3'] },
  'L3': { id: 'L3', position: { x: 80, y: 300 }, neighbors: ['L2', 'L4', 'M3'] },
  'L4': { id: 'L4', position: { x: 80, y: 400 }, neighbors: ['L3', 'L5'] },
  'L5': { id: 'L5', position: { x: 80, y: 500 }, neighbors: ['L4', 'B1'] },
  'T1': { id: 'T1', position: { x: 200, y: 100 }, neighbors: ['L1', 'T2', 'V1'] },
  'T2': { id: 'T2', position: { x: 300, y: 100 }, neighbors: ['T1', 'T3'] },
  'T3': { id: 'T3', position: { x: 400, y: 100 }, neighbors: ['T2', 'T4', 'M1'] },
  'T4': { id: 'T4', position: { x: 500, y: 100 }, neighbors: ['T3', 'T5'] },
  'T5': { id: 'T5', position: { x: 600, y: 100 }, neighbors: ['T4', 'R1'] },
  'V1': { id: 'V1', position: { x: 200, y: 200 }, neighbors: ['T1', 'V2'] },
  'V2': { id: 'V2', position: { x: 200, y: 300 }, neighbors: ['V1', 'V3', 'M3'] },
  'V3': { id: 'V3', position: { x: 200, y: 400 }, neighbors: ['V2', 'B1'] },
  'M1': { id: 'M1', position: { x: 400, y: 200 }, neighbors: ['T3', 'M2'] },
  'M2': { id: 'M2', position: { x: 400, y: 300 }, neighbors: ['M1', 'M3', 'M4', 'M5'] },
  'M3': { id: 'M3', position: { x: 300, y: 300 }, neighbors: ['L3', 'M2', 'V2'] },
  'M4': { id: 'M4', position: { x: 500, y: 300 }, neighbors: ['M2', 'R3'] },
  'M5': { id: 'M5', position: { x: 400, y: 400 }, neighbors: ['M2', 'B3'] },
  'B1': { id: 'B1', position: { x: 200, y: 500 }, neighbors: ['L5', 'B2', 'V3'] },
  'B2': { id: 'B2', position: { x: 300, y: 500 }, neighbors: ['B1', 'B3'] },
  'B3': { id: 'B3', position: { x: 400, y: 500 }, neighbors: ['B2', 'B4', 'M5'] },
  'B4': { id: 'B4', position: { x: 500, y: 500 }, neighbors: ['B3', 'B5'] },
  'B5': { id: 'B5', position: { x: 600, y: 500 }, neighbors: ['B4', 'R5'] },
  'R1': { id: 'R1', position: { x: 600, y: 100 }, neighbors: ['T5', 'R2'] },
  'R2': { id: 'R2', position: { x: 600, y: 200 }, neighbors: ['R1', 'R3'] },
  'R3': { id: 'R3', position: { x: 600, y: 300 }, neighbors: ['R2', 'R4', 'M4', 'CHARGE'] },
  'R4': { id: 'R4', position: { x: 600, y: 400 }, neighbors: ['R3', 'R5'] },
  'R5': { id: 'R5', position: { x: 600, y: 500 }, neighbors: ['R4', 'B5'] },
  'CHARGE': { id: 'CHARGE', position: { x: 700, y: 300 }, neighbors: ['R3'] },
};

// Get the current graph (from server or default)
export function getWarehouseGraph(): Record<string, GraphNode> {
  if (serverWaypointGraph) {
    return convertToUIGraph(serverWaypointGraph);
  }
  return DEFAULT_GRAPH;
}

// Fetch waypoint graph from server
export async function loadWaypointGraph(): Promise<WaypointGraphData> {
  if (serverWaypointGraph) {
    return serverWaypointGraph;
  }
  
  if (fetchPromise) {
    return fetchPromise;
  }
  
  fetchPromise = (async () => {
    try {
      const data = await fetchWaypointGraph();
      serverWaypointGraph = data;
      console.log('[waypointConfig] Loaded waypoint graph from server:', data.node_count, 'nodes');
      return data;
    } catch (error) {
      console.warn('[waypointConfig] Failed to fetch waypoint graph, using default:', error);
      fetchPromise = null;
      throw error;
    }
  })();
  
  return fetchPromise;
}

// Check if server graph is loaded
export function isServerGraphLoaded(): boolean {
  return serverWaypointGraph !== null;
}

// Get node info from server data
export function getServerNodeInfo(nodeId: number): WarehouseNode | undefined {
  return serverWaypointGraph?.nodes[nodeId];
}

// Get position from server (scaled for UI)
export function getServerNodePosition(nodeId: number): Position | null {
  const node = serverWaypointGraph?.nodes[nodeId];
  if (node) {
    return { x: node.x * 10, y: node.y * 10 }; // Scale for UI
  }
  return null;
}
