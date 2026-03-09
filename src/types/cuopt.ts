export interface TransportOrder {
  pickup_location: number;
  delivery_location: number;
  order_demand: number;
  earliest_pickup?: number;
  latest_pickup?: number;
  pickup_service_time?: number;
  earliest_delivery?: number;
  latest_delivery?: number;
  delivery_service_time?: number;
}

export interface FleetConfig {
  vehicle_locations: number[][];
  capacities: number[][];
}

export interface SolverConfig {
  time_limit?: number;
}

export interface CuOptRequest {
  transport_orders: TransportOrder[];
  fleet_data?: FleetConfig;
  solver_config?: SolverConfig;
}

export interface WarehouseNode {
  name: string;
  x: number;
  y: number;
  type: 'depot' | 'incoming' | 'processing';
  can_pickup: boolean;
  can_deliver: boolean;
}

export interface RobotState {
  robot_id: string;
  x: number;
  y: number;
  theta: number;
  busy: boolean;
  current_task: number;
  target_waypoint: number;
  progress: number;
}

export interface CuOptPlan {
  plan_id: number;
  created_at: number;
  solver: 'cuopt' | 'mock';
  solve_time_ms: number;
  assignments: {
    [robotId: string]: {
      tasks: number[];
      route: number[];
      total_cost: number;
      estimated_time: number;
    };
  };
  order_mapping: { [orderIndex: string]: string };
  total_cost: number;
  num_orders: number;
}

export interface FleetStatus {
  robots: { [robotId: string]: RobotState };
  last_update: string;
}

export interface FleetPosition {
  robot_id: string;
  x: number;
  y: number;
  theta: number;
  busy: boolean;
  current_task: number;
  progress: number;
}

export interface NodesResponse {
  nodes: { [nodeId: number]: WarehouseNode };
  pickup_nodes: number[];
  delivery_nodes: number[];
}

export interface WebSocketMessage {
  type: 'connected' | 'robot_states' | 'cuopt_plan' | 'ping' | 'pong';
  data?: any;
  message?: string;
}

export interface SampleScenario {
  id: string;
  name: string;
  description: string;
  orders: TransportOrder[];
}

export type OrderStatus = 'pending' | 'sending' | 'sent' | 'completed' | 'failed';

export interface ManagedOrder {
  id: string;
  order: TransportOrder;
  selected: boolean;
  status: OrderStatus;
  assignedAmr?: string;
  route?: number[];
  error?: string;
}

export interface WaypointGraphData {
  nodes: { [nodeId: number]: WarehouseNode };
  graph: { [nodeId: number]: { edges: number[]; weights: number[] } };
  node_count: number;
  edge_count: number;
}
