import {
  TransportOrder,
  CuOptRequest,
  CuOptPlan,
  FleetStatus,
  FleetPosition,
  NodesResponse,
  WebSocketMessage,
  WaypointGraphData,
} from '@/types/cuopt';

const API_BASE = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws/fleet';

let websocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

type MessageHandler = (message: WebSocketMessage) => void;
const messageHandlers: Set<MessageHandler> = new Set();

export function connectWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (websocket?.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    try {
      websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        resolve();
      };

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          setTimeout(() => {
            console.log(`Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            connectWebSocket();
          }, RECONNECT_DELAY);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

export function disconnectWebSocket(): void {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
}

export function isWebSocketConnected(): boolean {
  return websocket?.readyState === WebSocket.OPEN;
}

export function subscribeToMessages(handler: MessageHandler): () => void {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

export async function fetchNodes(): Promise<NodesResponse> {
  const response = await fetch(`${API_BASE}/api/nodes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch nodes: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPickupNodes(): Promise<{ nodes: Record<number, any> }> {
  const response = await fetch(`${API_BASE}/api/nodes/pickup`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pickup nodes: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDeliveryNodes(): Promise<{ nodes: Record<number, any> }> {
  const response = await fetch(`${API_BASE}/api/nodes/delivery`);
  if (!response.ok) {
    throw new Error(`Failed to fetch delivery nodes: ${response.statusText}`);
  }
  return response.json();
}

export async function submitOrders(orders: TransportOrder[]): Promise<any> {
  const request: CuOptRequest = {
    transport_orders: orders,
    fleet_data: {
      vehicle_locations: [[0, 0], [0, 0], [0, 0]],
      capacities: [[10], [10], [10]],
    },
    solver_config: {
      time_limit: 5,
    },
  };

  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit orders: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchLatestPlan(): Promise<CuOptPlan> {
  const response = await fetch(`${API_BASE}/api/plan`);
  if (!response.ok) {
    throw new Error(`Failed to fetch plan: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFleetStatus(): Promise<FleetStatus> {
  const response = await fetch(`${API_BASE}/api/fleet/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch fleet status: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFleetPositions(): Promise<{ robots: FleetPosition[] }> {
  const response = await fetch(`${API_BASE}/api/fleet/positions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch fleet positions: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFleetConfig(): Promise<any> {
  const response = await fetch(`${API_BASE}/api/fleet/config`);
  if (!response.ok) {
    throw new Error(`Failed to fetch fleet config: ${response.statusText}`);
  }
  return response.json();
}

export async function updateFleetConfig(config: {
  vehicle_locations: number[][];
  capacities: number[][];
}): Promise<any> {
  const response = await fetch(`${API_BASE}/api/fleet/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Failed to update fleet config: ${response.statusText}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; ros_connected: boolean; websocket_clients: number }> {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchWaypointGraph(): Promise<WaypointGraphData> {
  const response = await fetch(`${API_BASE}/api/waypoint-graph`);
  if (!response.ok) {
    throw new Error(`Failed to fetch waypoint graph: ${response.statusText}`);
  }
  return response.json();
}
