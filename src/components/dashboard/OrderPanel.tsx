import React, { useState, useEffect } from 'react';
import { 
  Send, Database, Loader2, CheckCircle, AlertCircle, 
  X, Edit3, Trash2, Square, CheckSquare, Clock,
  Package, Truck, ArrowRight, Play, XCircle,
  ChevronDown, Plus
} from 'lucide-react';
import { TransportOrder, ManagedOrder, OrderStatus, CuOptPlan } from '@/types/cuopt';
import { PICKUP_OPTIONS, DELIVERY_OPTIONS, getNodeName } from '@/data/nodeMapping';
import { SAMPLE_SCENARIOS, getScenarioNames } from '@/data/sampleOrders';
import { submitOrders, isWebSocketConnected, subscribeToMessages, fetchLatestPlan } from '@/services/rosBridge';

interface OrderFormProps {
  onOrdersSubmitted?: (orders: ManagedOrder[]) => void;
}

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'sending': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'sent': return <Truck className="w-4 h-4" />;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'failed': return <XCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'bg-amber-50 border-amber-200';
    case 'sending': return 'bg-blue-50 border-blue-200';
    case 'sent': return 'bg-blue-50 border-blue-200';
    case 'completed': return 'bg-green-50 border-green-200';
    case 'failed': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

// Edit Modal Component
const EditOrderModal: React.FC<{
  order: ManagedOrder;
  onSave: (order: TransportOrder) => void;
  onClose: () => void;
}> = ({ order, onSave, onClose }) => {
  const [editedOrder, setEditedOrder] = useState<TransportOrder>({ ...order.order });

  const handleSave = () => {
    onSave(editedOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Edit Order</h3>
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
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export const OrderPanel: React.FC<OrderFormProps> = ({ onOrdersSubmitted }) => {
  const [pendingOrders, setPendingOrders] = useState<ManagedOrder[]>([]);
  const [sentOrders, setSentOrders] = useState<ManagedOrder[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ManagedOrder | null>(null);
  const [latestPlan, setLatestPlan] = useState<CuOptPlan | null>(null);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(isWebSocketConnected());
    };
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

    fetchLatestPlan().then(p => {
      if (p && p.plan_id) setLatestPlan(p);
    }).catch(() => {});

    return () => unsubscribe();
  }, []);

  const generateId = () => `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addOrder = () => {
    const newOrder: ManagedOrder = {
      id: generateId(),
      order: {
        pickup_location: 1,
        delivery_location: 4,
        order_demand: 1,
        earliest_pickup: 0,
        latest_pickup: 10,
        pickup_service_time: 2,
        earliest_delivery: 0,
        latest_delivery: 45,
        delivery_service_time: 2,
      },
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

  const removePendingOrder = (id: string) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== id));
  };

  const toggleOrderSelection = (id: string) => {
    setPendingOrders(pendingOrders.map(o => 
      o.id === id ? { ...o, selected: !o.selected } : o
    ));
  };

  const selectAll = () => {
    setPendingOrders(pendingOrders.map(o => ({ ...o, selected: true })));
  };

  const clearSelection = () => {
    setPendingOrders(pendingOrders.map(o => ({ ...o, selected: false })));
  };

  const updateOrder = (id: string, updatedOrder: TransportOrder) => {
    setPendingOrders(pendingOrders.map(o => 
      o.id === id ? { ...o, order: updatedOrder } : o
    ));
  };

  const sendOrders = async (ordersToSend: ManagedOrder[]) => {
    if (ordersToSend.length === 0) return;

    // Mark as sending
    const sendingIds = ordersToSend.map(o => o.id);
    setPendingOrders(pendingOrders.map(o => 
      sendingIds.includes(o.id) ? { ...o, status: 'sending' as OrderStatus } : o
    ));

    try {
      const ordersData = ordersToSend.map(o => o.order);
      await submitOrders(ordersData);
      
      // Move to sent orders
      setPendingOrders(pendingOrders.filter(o => !sendingIds.includes(o.id)));
      
      const newSentOrders: ManagedOrder[] = ordersToSend.map(o => ({
        ...o,
        status: 'sent' as OrderStatus,
        selected: false,
      }));
      setSentOrders([...sentOrders, ...newSentOrders]);
      
      // Refresh plan to get assignments
      setTimeout(async () => {
        try {
          const plan = await fetchLatestPlan();
          if (plan && plan.plan_id) {
            setLatestPlan(plan);
            updateOrderAssignments(plan);
          }
        } catch {}
      }, 1000);
      
      onOrdersSubmitted?.(newSentOrders);
    } catch (error) {
      console.error('Failed to send orders:', error);
      // Mark as failed
      setPendingOrders(pendingOrders.map(o => 
        sendingIds.includes(o.id) ? { ...o, status: 'failed' as OrderStatus } : o
      ));
    }
  };

  const updateOrderAssignments = (plan: CuOptPlan) => {
    setSentOrders(sentOrders.map((order) => {
      const orderIndex = sentOrders.indexOf(order);
      const amrId = plan.order_mapping?.[orderIndex.toString()];
      const amrAssignment = amrId ? `AMR-${amrId.replace('amr', '')}` : undefined;
      const amrTasks = amrId ? plan.assignments[amrId] : undefined;
      
      return {
        ...order,
        assignedAmr: amrAssignment,
        route: amrTasks?.route,
      };
    }));
  };

  useEffect(() => {
    if (latestPlan) {
      updateOrderAssignments(latestPlan);
    }
  }, [latestPlan]);

  const sendSelected = () => {
    const selected = pendingOrders.filter(o => o.selected);
    sendOrders(selected);
  };

  const sendAll = () => {
    sendOrders([...pendingOrders]);
  };

  const pendingSelectedCount = pendingOrders.filter(o => o.selected).length;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Order Management</h2>
        <p className="text-sm text-muted-foreground">Manage and submit transport orders</p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
          {isConnected ? 'Connected to Server' : 'Disconnected'}
        </span>
      </div>

      {/* Sample Data & Add */}
      <div className="flex gap-2">
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
          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Pending Orders Section */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Pending Orders ({pendingOrders.length})
          </h3>
          {pendingOrders.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <CheckSquare size={12} /> Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <Square size={12} /> Clear
              </button>
            </div>
          )}
        </div>

        {pendingOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending orders</p>
            <p className="text-xs">Load sample data or add orders manually</p>
          </div>
        ) : (
          pendingOrders.map((order) => (
            <div key={order.id} className={`p-3 rounded-lg border ${getStatusColor(order.status)}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleOrderSelection(order.id)}
                  className="mt-0.5"
                >
                  {order.selected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {getNodeName(order.order.pickup_location)} <ArrowRight className="w-3 h-3 inline mx-1" /> {getNodeName(order.order.delivery_location)}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Demand: {order.order.order_demand}</span>
                    <span>Pickup: {order.order.earliest_pickup}-{order.order.latest_pickup}s</span>
                    <span>Delivery: {order.order.earliest_delivery}-{order.order.latest_delivery}s</span>
                  </div>
                </div>
              </div>
              
              {order.status === 'pending' && (
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                  <button
                    onClick={() => setEditingOrder(order)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-white"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => sendOrders([order])}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Play size={12} /> Send
                  </button>
                  <button
                    onClick={() => removePendingOrder(order.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
              
              {order.status === 'sending' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sending to CuOpt...
                </div>
              )}
              
              {order.status === 'failed' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  Failed to send. Try again.
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      {pendingOrders.length > 0 && (
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={sendSelected}
            disabled={pendingSelectedCount === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pendingSelectedCount === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Send size={14} />
            Send Selected ({pendingSelectedCount})
          </button>
          <button
            onClick={sendAll}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Send size={14} />
            Send All ({pendingOrders.length})
          </button>
        </div>
      )}

      {/* Sent Orders Section */}
      {sentOrders.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Ongoing / Sent Orders ({sentOrders.length})
          </h3>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sentOrders.map((order) => (
              <div key={order.id} className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {order.status === 'sent' ? (
                      <Truck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    <span className="font-medium text-sm">
                      {getNodeName(order.order.pickup_location)} <ArrowRight className="w-3 h-3 inline mx-1" /> {getNodeName(order.order.delivery_location)}
                    </span>
                  </div>
                  {order.assignedAmr && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {order.assignedAmr}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Demand: {order.order.order_demand}</span>
                  {order.route && (
                    <span>Route: {order.route.slice(0, 4).map(id => getNodeName(id)).join(' → ')}{order.route.length > 4 ? ' → ...' : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
