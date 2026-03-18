import React, { useEffect, useState } from 'react';
import { subscribeToMessages, fetchLatestPlan, fetchFleetPositions, connectWebSocket } from '@/services/rosBridge';
import { CuOptPlan, FleetPosition, WebSocketMessage } from '@/types/cuopt';
import { getNodeName } from '@/data/nodeMapping';
import { Package, MapPin, Clock, Zap } from 'lucide-react';

interface CuOptPlanViewerProps {
  compact?: boolean;
}

export const CuOptPlanViewer: React.FC<CuOptPlanViewerProps> = ({ compact = false }) => {
  const [plan, setPlan] = useState<CuOptPlan | null>(null);
  const [positions, setPositions] = useState<FleetPosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await connectWebSocket();
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();

    const unsubscribe = subscribeToMessages((message: WebSocketMessage) => {
      if (message.type === 'cuopt_plan' && message.data) {
        setPlan(message.data);
      }
      if (message.type === 'robot_states' && message.data) {
        const robots = Object.values(message.data) as FleetPosition[];
        setPositions(robots);
      }
    });

    // Fetch initial data
    fetchLatestPlan().then(p => {
      if (p && p.plan_id) setPlan(p);
    }).catch(() => { });

    fetchFleetPositions().then(r => {
      setPositions(r.robots);
    }).catch(() => { });

    const interval = setInterval(() => {
      fetchFleetPositions().then(r => {
        setPositions(r.robots);
      }).catch(() => { });
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (compact) {
    return (
      <div className="text-xs space-y-2">
        {plan ? (
          <>
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-yellow-500" />
              <span>Solver: {plan.solver}</span>
              <span className="text-muted-foreground">|</span>
              <span>Plan #{plan.plan_id}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(plan.assignments).map(([robotId, data]) => (
                <div key={robotId} className="bg-secondary/50 rounded p-2">
                  <div className="font-medium">{robotId}</div>
                  <div className="text-muted-foreground">
                    {data.tasks.length} tasks 
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">No optimization plan yet</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-green-500'}`} />
        <span className={isConnected ? 'text-green-600' : 'text-green-600'}>
          {isConnected ? 'Live' : 'Connected'}
        </span>
        {plan && (
          <>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Solver: {plan.solver}</span>
            <span className="text-muted-foreground">|</span>
            <span>Plan #{plan.plan_id}</span>
          </>
        )}
      </div>

      {/* Robot Assignments */}
      {plan && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Optimized Routes
          </h3>

          {Object.entries(plan.assignments).map(([robotId, data]) => {
            const robotPos = positions.find(p => p.robot_id === robotId);

            return (
              <div key={robotId} className="border rounded-lg p-3 bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-brand-yellow" />
                    <span className="font-semibold">{robotId}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {/* {data.estimated_time.toFixed(1)} min */}
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-1 mb-2">
                  {data.tasks.map((taskIdx, i) => {
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <MapPin size={10} className="text-green-500" />
                        <span>Task {taskIdx}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Route */}
                {data.route && data.route.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Route: {data.route.slice(0, 5).map(id => getNodeName(id)).join(' → ')}
                    {data.route.length > 5 && ' → ...'}
                  </div>
                )}

                {/* Current Position */}
                {robotPos && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    Position: ({robotPos.x.toFixed(1)}, {robotPos.y.toFixed(1)}) •
                    {robotPos.busy ? ' Busy' : ' Idle'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No Plan Yet */}
      {!plan && (
        <div className="text-center py-8 text-muted-foreground">
          <Package size={32} className="mx-auto mb-2 opacity-50" />
          <p>No optimization plan yet</p>
          <p className="text-xs">Submit orders to see the plan</p>
        </div>
      )}
    </div>
  );
};
