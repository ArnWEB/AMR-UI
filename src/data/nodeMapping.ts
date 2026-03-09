export const WAREHOUSE_NODES: Record<number, { name: string; x: number; y: number; type: 'depot' | 'incoming' | 'processing'; can_pickup: boolean; can_deliver: boolean }> = {
  0: { name: 'depot', x: 0, y: 0, type: 'depot', can_pickup: false, can_deliver: true },
  1: { name: 'station_1', x: 5, y: 10, type: 'incoming', can_pickup: true, can_deliver: false },
  2: { name: 'station_2', x: 10, y: 5, type: 'incoming', can_pickup: true, can_deliver: false },
  3: { name: 'station_3', x: 15, y: 10, type: 'incoming', can_pickup: true, can_deliver: false },
  4: { name: 'processing_4', x: 20, y: 5, type: 'processing', can_pickup: true, can_deliver: true },
  5: { name: 'processing_5', x: 25, y: 10, type: 'processing', can_pickup: true, can_deliver: true },
  6: { name: 'processing_6', x: 30, y: 5, type: 'processing', can_pickup: true, can_deliver: true },
  7: { name: 'station_7', x: 35, y: 10, type: 'incoming', can_pickup: true, can_deliver: false },
  8: { name: 'station_8', x: 40, y: 5, type: 'incoming', can_pickup: true, can_deliver: false },
  9: { name: 'station_9', x: 45, y: 10, type: 'incoming', can_pickup: true, can_deliver: false },
};

export const PICKUP_NODES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const DELIVERY_NODES = [0, 4, 5, 6];

export const NODE_OPTIONS = Object.entries(WAREHOUSE_NODES).map(([id, node]) => ({
  value: parseInt(id),
  label: node.name,
  type: node.type,
}));

export const PICKUP_OPTIONS = NODE_OPTIONS.filter(n => n.value !== 0);
export const DELIVERY_OPTIONS = NODE_OPTIONS.filter(n => n.value === 0 || n.value >= 4);

export function getNodeById(id: number) {
  return WAREHOUSE_NODES[id];
}

export function getNodeName(id: number): string {
  return WAREHOUSE_NODES[id]?.name || `Unknown (${id})`;
}

export function getNodePosition(id: number): { x: number; y: number } | null {
  const node = WAREHOUSE_NODES[id];
  return node ? { x: node.x, y: node.y } : null;
}
