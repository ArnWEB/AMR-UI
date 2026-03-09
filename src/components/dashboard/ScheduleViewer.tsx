import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  Users,
  X,
  Send,
  Edit3,
  Trash2,
  Play,
  Square,
  CheckSquare,
  Loader2,
  XCircle,
  Plus,
  Database,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { ManagedOrder, TransportOrder, OrderStatus, CuOptPlan } from '@/types/cuopt';
import { PICKUP_OPTIONS, DELIVERY_OPTIONS, getNodeName } from '@/data/nodeMapping';
import { SAMPLE_SCENARIOS, getScenarioNames } from '@/data/sampleOrders';
import { submitOrders, isWebSocketConnected, subscribeToMessages, fetchLatestPlan } from '@/services/rosBridge';

// Status colors matching schedule viewer
const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'pending': return '#d97706'; // amber-600
    case 'sending': return '#000000'; // black
    case 'sent': return '#000000';    // black
    case 'completed': return '#16a34a'; // green-600
    case 'failed': return '#dc2626';   // red-600
    default: return '#6b7280';         // gray-500
  }
};

const getStatusBgColor = (status: OrderStatus): string => {
  switch (status) {
    case 'pending': return '#fef3c7'; // amber-100
    case 'sending': return '#FFFBEB'; // light-yellow
    case 'sent': return '#FFFBEB';     // light-yellow
    case 'completed': return '#dcfce7'; // green-100
    case 'failed': return '#fee2e2';   // red-100
    default: return '#f3f4f6';         // gray-100
  }
};

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'sending': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'sent': return <Truck className="w-4 h-4" />;
    case 'completed': return <CheckCircle2 className="w-4 h-4" />;
    case 'failed': return <XCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

// Edit Modal
const EditOrderModal: React.FC<{
  order: ManagedOrder;
  onSave: (order: TransportOrder) => void;
  onClose: () => void;
}> = ({ order, onSave, onClose }) => {
  const [editedOrder, setEditedOrder] = useState<TransportOrder>({ ...order.order });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Edit Order</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <select
                value={editedOrder.pickup_location}
                onChange={(e) => setEditedOrder({ ...editedOrder, pickup_location: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
              >
                {PICKUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
              <select
                value={editedOrder.delivery_location}
                onChange={(e) => setEditedOrder({ ...editedOrder, delivery_location: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
              >
                {DELIVERY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demand</label>
              <input
                type="number"
                min="1"
                value={editedOrder.order_demand}
                onChange={(e) => setEditedOrder({ ...editedOrder, order_demand: parseInt(e.target.value) || 1 })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Time (min)</label>
              <input
                type="number"
                min="1"
                value={editedOrder.pickup_service_time || 2}
                onChange={(e) => setEditedOrder({ ...editedOrder, pickup_service_time: parseInt(e.target.value) || 2 })}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Earliest Pickup (s)</label>
              <input
                type="number"
                min="0"
                value={editedOrder.earliest_pickup || 0}
                onChange={(e) => setEditedOrder({ ...editedOrder, earliest_pickup: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latest Pickup (s)</label>
              <input
                type="number"
                min="0"
                value={editedOrder.latest_pickup || 100}
                onChange={(e) => setEditedOrder({ ...editedOrder, latest_pickup: parseInt(e.target.value) || 100 })}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Earliest Delivery (s)</label>
              <input
                type="number"
                min="0"
                value={editedOrder.earliest_delivery || 0}
                onChange={(e) => setEditedOrder({ ...editedOrder, earliest_delivery: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latest Delivery (s)</label>
              <input
                type="number"
                min="0"
                value={editedOrder.latest_delivery || 100}
                onChange={(e) => setEditedOrder({ ...editedOrder, latest_delivery: parseInt(e.target.value) || 100 })}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={() => { onSave(editedOrder); onClose(); }} className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Order Card Component (ScheduleCard style)
const OrderCard: React.FC<{
  order: ManagedOrder;
  onSelect: () => void;
  onEdit: () => void;
  onSend: () => void;
  onRemove: () => void;
}> = ({ order, onSelect, onEdit, onSend, onRemove }) => {
  const statusColor = getStatusColor(order.status);
  const statusBg = getStatusBgColor(order.status);

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button onClick={onSelect} className="mt-0.5">
            {order.selected ? (
              <CheckSquare className="w-5 h-5 text-brand-yellow" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}
          >
            <Package className="w-4 h-4" />
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 text-sm">
              {getNodeName(order.order.pickup_location)} <ArrowRight className="w-3 h-3 inline mx-1" /> {getNodeName(order.order.delivery_location)}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>Demand: {order.order.order_demand}</span>
              <span className="text-slate-400">•</span>
              <span>Pickup: {order.order.earliest_pickup}-{order.order.latest_pickup}s</span>
              <span className="text-slate-400">•</span>
              <span>Delivery: {order.order.earliest_delivery}-{order.order.latest_delivery}s</span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: statusBg, color: statusColor }}
        >
          {getStatusIcon(order.status)}
          <span className="capitalize">{order.status}</span>
        </div>
      </div>

      {/* AMR Assignment (like ScheduleCard) */}
      {order.assignedAmr && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">Assigned:</span>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
              {order.assignedAmr}
            </span>
          </div>
          {order.route && (
            <span className="text-xs text-slate-500">
              Route: {order.route.slice(0, 4).map(id => getNodeName(id)).join(' → ')}{order.route.length > 4 ? ' → ...' : ''}
            </span>
          )}
        </div>
      )}

      {/* Actions for pending orders */}
      {order.status === 'pending' && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={onSend}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-black text-white rounded hover:bg-black/80"
          >
            <Play className="w-3 h-3" /> Send
          </button>
          <button
            onClick={onRemove}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Sending status */}
      {order.status === 'sending' && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-brand-yellow flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Sending to CuOpt...
        </div>
      )}

      {/* Failed status */}
      {order.status === 'failed' && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          Failed to send. Try again.
        </div>
      )}
    </div>
  );
};

// Stats Component (like ScheduleStats)
const OrderStats: React.FC<{
  pending: number;
  sent: number;
  completed: number;
}> = ({ pending, sent, completed }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
        <div className="text-xs text-amber-600 font-medium uppercase">Pending</div>
        <div className="text-2xl font-bold text-amber-700">{pending}</div>
      </div>
      <div className="bg-brand-light-yellow rounded-lg p-3 border border-brand-yellow/30">
        <div className="text-xs text-black font-medium uppercase">In Progress</div>
        <div className="text-2xl font-bold text-black">{sent}</div>
      </div>
      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
        <div className="text-xs text-green-600 font-medium uppercase">Completed</div>
        <div className="text-2xl font-bold text-green-700">{completed}</div>
      </div>
    </div>
  );
};

// Main ScheduleViewer component (now Order Management)
export const ScheduleViewer: React.FC = () => {
  const [pendingOrders, setPendingOrders] = useState<ManagedOrder[]>([]);
  const [sentOrders, setSentOrders] = useState<ManagedOrder[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ManagedOrder | null>(null);
  const [latestPlan, setLatestPlan] = useState<CuOptPlan | null>(null);

  useEffect(() => {
    const checkConnection = () => setIsConnected(isWebSocketConnected());
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToMessages((message) => {
      if (message.type === 'cuopt_plan' && message.data) {
        setLatestPlan(message.data);
      }
    });
    fetchLatestPlan().then(p => { if (p?.plan_id) setLatestPlan(p); }).catch(() => { });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (latestPlan) {
      setSentOrders(sentOrders.map((order, idx) => {
        const amrId = latestPlan.order_mapping?.[idx.toString()];
        const amrAssignment = amrId ? `AMR-${amrId.replace('amr', '')}` : undefined;
        const amrTasks = amrId ? latestPlan.assignments[amrId] : undefined;
        return { ...order, assignedAmr: amrAssignment, route: amrTasks?.route };
      }));
    }
  }, [latestPlan]);

  const generateId = () => `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addOrder = () => {
    const newOrder: ManagedOrder = {
      id: generateId(),
      order: { pickup_location: 1, delivery_location: 4, order_demand: 1, earliest_pickup: 0, latest_pickup: 10, pickup_service_time: 2, earliest_delivery: 0, latest_delivery: 45, delivery_service_time: 2 },
      selected: false,
      status: 'pending',
    };
    setPendingOrders([...pendingOrders, newOrder]);
  };

  const loadSampleScenario = (scenarioId: string) => {
    const scenario = SAMPLE_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      const newOrders: ManagedOrder[] = scenario.orders.map(order => ({
        id: generateId(),
        order,
        selected: false,
        status: 'pending' as OrderStatus,
      }));
      setPendingOrders([...pendingOrders, ...newOrders]);
    }
    setShowSampleDropdown(false);
  };

  const removePendingOrder = (id: string) => setPendingOrders(pendingOrders.filter(o => o.id !== id));
  const toggleOrderSelection = (id: string) => setPendingOrders(pendingOrders.map(o => o.id === id ? { ...o, selected: !o.selected } : o));
  const selectAll = () => setPendingOrders(pendingOrders.map(o => ({ ...o, selected: true })));
  const clearSelection = () => setPendingOrders(pendingOrders.map(o => ({ ...o, selected: false })));
  const updateOrder = (id: string, updatedOrder: TransportOrder) => setPendingOrders(pendingOrders.map(o => o.id === id ? { ...o, order: updatedOrder } : o));

  const sendOrders = async (ordersToSend: ManagedOrder[]) => {
    if (ordersToSend.length === 0) return;
    const sendingIds = ordersToSend.map(o => o.id);
    setPendingOrders(pendingOrders.map(o => sendingIds.includes(o.id) ? { ...o, status: 'sending' as OrderStatus } : o));

    try {
      await submitOrders(ordersToSend.map(o => o.order));
      setPendingOrders(pendingOrders.filter(o => !sendingIds.includes(o.id)));
      const newSentOrders: ManagedOrder[] = ordersToSend.map(o => ({ ...o, status: 'sent' as OrderStatus, selected: false }));
      setSentOrders([...sentOrders, ...newSentOrders]);
      setTimeout(async () => {
        try {
          const plan = await fetchLatestPlan();
          if (plan?.plan_id) setLatestPlan(plan);
        } catch { }
      }, 1000);
    } catch {
      setPendingOrders(pendingOrders.map(o => sendingIds.includes(o.id) ? { ...o, status: 'failed' as OrderStatus } : o));
    }
  };

  const pendingSelectedCount = pendingOrders.filter(o => o.selected).length;
  const completedCount = sentOrders.filter(o => o.status === 'completed').length;
  const sentCount = sentOrders.filter(o => o.status === 'sent').length;

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Schedule</h2>
            <p className="text-sm text-slate-500">
              {isConnected ? 'Connected to server' : 'Disconnected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-white shadow-sm text-slate-900">
                All Orders
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <OrderStats pending={pendingOrders.length} sent={sentCount} completed={completedCount} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Sample & Add Buttons */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <button
              onClick={() => setShowSampleDropdown(!showSampleDropdown)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Database size={16} />
              Load Sample
              <ChevronDown size={14} />
            </button>

            {showSampleDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {getScenarioNames().map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => loadSampleScenario(scenario.id)}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm border-b last:border-b-0"
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{scenario.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={addOrder}
            className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 text-sm font-medium"
          >
            <Plus size={16} />
            Add Order
          </button>
        </div>

        {/* Selection Controls */}
        {pendingOrders.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">
              Pending Orders ({pendingOrders.length})
            </span>
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-xs text-brand-yellow hover:text-brand-yellow/80 flex items-center gap-1">
                <CheckSquare size={12} /> Select All
              </button>
              <button onClick={clearSelection} className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1">
                <Square size={12} /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Pending Orders */}
        {pendingOrders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No orders</p>
              <p className="text-xs text-slate-400">Load sample data or add orders manually</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onSelect={() => toggleOrderSelection(order.id)}
                onEdit={() => setEditingOrder(order)}
                onSend={() => sendOrders([order])}
                onRemove={() => removePendingOrder(order.id)}
              />
            ))}
          </div>
        )}

        {/* Send Buttons */}
        {pendingOrders.length > 0 && (
          <div className="flex gap-2 pt-3 border-t">
            <button
              onClick={() => sendOrders(pendingOrders.filter(o => o.selected))}
              disabled={pendingSelectedCount === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pendingSelectedCount === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black hover:bg-black/80 text-white'
                }`}
            >
              <Send size={14} />
              Send Selected ({pendingSelectedCount})
            </button>
            <button
              onClick={() => sendOrders([...pendingOrders])}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Send size={14} />
              Send All ({pendingOrders.length})
            </button>
          </div>
        )}

        {/* Sent Orders */}
        {sentOrders.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500 mb-3">
              Ongoing / Sent Orders ({sentOrders.length})
            </h3>
            <div className="space-y-2">
              {sentOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onSelect={() => { }}
                  onEdit={() => { }}
                  onSend={() => { }}
                  onRemove={() => setSentOrders(sentOrders.filter(o => o.id !== order.id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onSave={(updatedOrder) => updateOrder(editingOrder.id, updatedOrder)}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  );
};
