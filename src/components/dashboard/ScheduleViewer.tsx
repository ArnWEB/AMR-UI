import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  SkipForward, 
  XCircle,
  Package,
  Wrench,
  Zap,
  Truck,
  ArrowRightLeft,
  Warehouse,
  Info,
  Users,
  Box,
  Activity,
  Timer,
  X,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { ScheduleEntry, ScheduleStatus, WeekDay } from '@/types/schedule';
import { 
  getScheduleTypeColor, 
  getStatusColor, 
  formatTime,
  getWeekDayLabel,
  getScheduleTypeLabel
} from '@/types/schedule';
import { getScheduleForDay } from '@/data/scheduleData';
import { useSimulationStore } from '@/store/useSimulationStore';

// Type icon mapping
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'inbound': return <Truck className="w-4 h-4" />;
    case 'outbound': return <Package className="w-4 h-4" />;
    case 'processing': return <Warehouse className="w-4 h-4" />;
    case 'storage': return <Warehouse className="w-4 h-4" />;
    case 'maintenance': return <Wrench className="w-4 h-4" />;
    case 'charging': return <Zap className="w-4 h-4" />;
    case 'cross_dock': return <ArrowRightLeft className="w-4 h-4" />;
    default: return <Circle className="w-4 h-4" />;
  }
};

// Status icon mapping
const getStatusIcon = (status: ScheduleStatus) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-4 h-4" />;
    case 'active': return <Circle className="w-4 h-4 animate-pulse" />;
    case 'scheduled': return <Clock className="w-4 h-4" />;
    case 'skipped': return <SkipForward className="w-4 h-4" />;
    case 'failed': return <XCircle className="w-4 h-4" />;
    case 'overdue': return <AlertCircle className="w-4 h-4" />;
    default: return <Circle className="w-4 h-4" />;
  }
};

// Day selector component
const DaySelector: React.FC<{
  selectedDay: string;
  onSelect: (day: string) => void;
}> = ({ selectedDay, onSelect }) => {
  const days: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
      {days.map(day => (
        <button
          key={day}
          onClick={() => onSelect(day)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            selectedDay === day
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {day.charAt(0).toUpperCase() + day.slice(1)}
        </button>
      ))}
    </div>
  );
};

// AMR Assignment Detail Component
const AMRAssignmentDetail: React.FC<{
  amrId: string;
  schedule: ScheduleEntry;
  itemCount: number;
  isPending?: boolean;
}> = ({ amrId, schedule, itemCount, isPending = false }) => {
  const amrs = useSimulationStore((state) => state.amrs);
  const amr = amrs.find(a => a.id === amrId);
  
  // Calculate estimated work hours for this task
  const workHours = (schedule.estimatedDuration / 60).toFixed(1);
  
  if (isPending || !amr) {
    // Show pending/to-be-decided state
    const displayId = amrId === 'TBD' ? 'AMR-3' : amrId;
    return (
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 border-dashed">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center border-2 border-dashed border-amber-300">
              <span className="text-xs font-bold text-amber-600">TBD</span>
            </div>
            <div>
              <div className="font-medium text-sm text-slate-900">{displayId}</div>
              <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Yet to be decided
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Status</div>
            <div className="text-sm font-semibold text-amber-600">Pending Assignment</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-amber-200">
          <div>
            <div className="text-xs text-slate-500">Est. Work Hours</div>
            <div className="text-sm font-semibold text-slate-900">{workHours}h</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Items Pending</div>
            <div className="text-sm font-semibold text-amber-700">{itemCount} items</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Est. Distance</div>
            <div className="text-sm font-semibold text-slate-900">~{(schedule.estimatedDuration * 2.5).toFixed(0)}m</div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-amber-700 bg-amber-100 px-2 py-1.5 rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          This AMR will be assigned from available pool closer to task time
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-sm text-slate-900">{amrId}</div>
            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Scheduled
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Current Battery</div>
          <div className={`text-sm font-semibold ${amr.battery < 20 ? 'text-red-600' : 'text-green-600'}`}>
            {amr.battery}%
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-green-200">
        <div>
          <div className="text-xs text-slate-500">Work Hours</div>
          <div className="text-sm font-semibold text-slate-900">{workHours}h</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Items Assigned</div>
          <div className="text-sm font-semibold text-green-700">{itemCount} items</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Est. Distance</div>
          <div className="text-sm font-semibold text-slate-900">~{(schedule.estimatedDuration * 2.5).toFixed(0)}m</div>
        </div>
      </div>
      
      {itemCount > 0 && schedule.cargoCount && (
        <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
          Load weight: ~{(itemCount * 25).toFixed(0)}kg • Ready for task execution
        </div>
      )}
    </div>
  );
};

// Task Detail Modal
const TaskDetailModal: React.FC<{
  schedule: ScheduleEntry | null;
  onClose: () => void;
}> = ({ schedule, onClose }) => {
  // Get AMRs from store first (hooks must be called unconditionally)
  const amrs = useSimulationStore((state) => state.amrs);
  
  if (!schedule) return null;
  
  const typeColor = getScheduleTypeColor(schedule.type);
  const statusColor = getStatusColor(schedule.status);
  
  // Determine AMR assignments - show 2 assigned and 1 pending for demo
  let confirmedAMRs: string[] = [];
  let pendingAMRs: string[] = [];
  
  if (schedule.targetAMRs && schedule.targetAMRs.length > 0) {
    // Use predefined assignments
    confirmedAMRs = schedule.targetAMRs.slice(0, 2);
    if (schedule.targetAMRs.length > 2) {
      pendingAMRs = schedule.targetAMRs.slice(2);
    } else {
      // Add one pending slot if needed for demo
      pendingAMRs = ['TBD'];
    }
  } else {
    // Auto-assign: pick 2 available AMRs and show AMR-3 as pending
    const availableAMRs = amrs.filter(a => a.status !== 'error').map(a => a.id);
    confirmedAMRs = availableAMRs.slice(0, 2);
    // Always show AMR-3 as "Yet to be decided" for demo purposes
    pendingAMRs = ['AMR-3'];
  }
  
  // Calculate item distribution
  const totalItems = schedule.cargoCount || 0;
  const itemsPerConfirmedAMR = totalItems > 0 ? Math.floor(totalItems / 3) : 0;
  const itemsForPendingAMR = totalItems > 0 ? totalItems - (itemsPerConfirmedAMR * 2) : 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between" style={{ backgroundColor: `${typeColor}10` }}>
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
            >
              {getTypeIcon(schedule.type)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{schedule.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>{getScheduleTypeLabel(schedule.type)}</span>
                <span>•</span>
                <span className="capitalize" style={{ color: statusColor }}>{schedule.status}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Description */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Description
            </h4>
            <p className="text-slate-600 text-sm">{schedule.description}</p>
          </div>
          
          {/* Time & Duration */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Clock className="w-3 h-3" />
                Start Time
              </div>
              <div className="font-semibold text-slate-900">{formatTime(schedule.timeWindow.start)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Clock className="w-3 h-3" />
                End Time
              </div>
              <div className="font-semibold text-slate-900">{formatTime(schedule.timeWindow.end)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Timer className="w-3 h-3" />
                Duration
              </div>
              <div className="font-semibold text-slate-900">{schedule.estimatedDuration} min</div>
            </div>
          </div>
          
          {/* Zones */}
          {(schedule.sourceZone || schedule.targetZone) && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Route
              </h4>
              <div className="flex items-center gap-4">
                {schedule.sourceZone && (
                  <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 mb-1">Source</div>
                    <div className="font-semibold text-blue-900 text-sm">{schedule.sourceZone}</div>
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-slate-400" />
                {schedule.targetZone && (
                  <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <div className="text-xs text-green-600 mb-1">Destination</div>
                    <div className="font-semibold text-green-900 text-sm">{schedule.targetZone}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Cargo Details */}
          {schedule.cargoCount && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Box className="w-4 h-4" />
                Cargo Details
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">{schedule.cargoCount}</div>
                  <div className="text-xs text-slate-500">Total Items</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {Math.ceil(schedule.cargoCount / 3)}
                  </div>
                  <div className="text-xs text-slate-500">Per AMR (Planned)</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    ~{schedule.cargoCount * 25}kg
                  </div>
                  <div className="text-xs text-slate-500">Est. Weight</div>
                </div>
              </div>
            </div>
          )}
          
          {/* AMR Assignments */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              AMR Assignments
              <span className="text-xs font-normal text-slate-500">
                ({confirmedAMRs.length} confirmed, {pendingAMRs.length} pending)
              </span>
            </h4>
            
            {/* Confirmed AMRs */}
            <div className="space-y-3 mb-4">
              <div className="text-xs font-medium text-green-700 uppercase tracking-wide flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Assigned & Confirmed
              </div>
              {confirmedAMRs.map((amrId) => (
                <AMRAssignmentDetail 
                  key={amrId} 
                  amrId={amrId} 
                  schedule={schedule}
                  itemCount={itemsPerConfirmedAMR}
                  isPending={false}
                />
              ))}
            </div>
            
            {/* Pending AMRs */}
            {pendingAMRs.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-amber-700 uppercase tracking-wide flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Yet to Be Assigned
                </div>
                {pendingAMRs.map((amrId, idx) => (
                  <AMRAssignmentDetail 
                    key={`pending-${amrId}-${idx}`} 
                    amrId={amrId} 
                    schedule={schedule}
                    itemCount={itemsForPendingAMR}
                    isPending={true}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Execution Log */}
          {schedule.executionLog && schedule.executionLog.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Execution History
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {schedule.executionLog.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg text-sm">
                    <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{log.action}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()} • {log.amrId}
                      </div>
                    </div>
                    <div className="text-slate-600">{log.duration}min</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Priority & Recurrence */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Priority:</span>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
                P{schedule.priority}
              </span>
            </div>
            {schedule.recurring && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Recurring:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  Weekly
                </span>
              </div>
            )}
            {schedule.dependsOn && schedule.dependsOn.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Dependencies:</span>
                <span className="text-xs text-slate-700">
                  {schedule.dependsOn.length} tasks
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule card component
const ScheduleCard: React.FC<{ 
  schedule: ScheduleEntry;
  isCurrentTime: boolean;
  onClick: () => void;
}> = ({ schedule, isCurrentTime, onClick }) => {
  const typeColor = getScheduleTypeColor(schedule.type);
  const statusColor = getStatusColor(schedule.status);
  
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isCurrentTime 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
          >
            {getTypeIcon(schedule.type)}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">{schedule.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{schedule.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                {formatTime(schedule.timeWindow.start)} - {formatTime(schedule.timeWindow.end)}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{schedule.estimatedDuration} min</span>
              {schedule.cargoCount && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">{schedule.cargoCount} items</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {getStatusIcon(schedule.status)}
          <span className="capitalize">{schedule.status}</span>
        </div>
      </div>
      
      {/* AMR Assignment Preview */}
      {(schedule.targetAMRs && schedule.targetAMRs.length > 0) || schedule.autoAssign ? (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-slate-400" />
            {schedule.targetAMRs && schedule.targetAMRs.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {/* Show first 2 as confirmed */}
                  {schedule.targetAMRs.slice(0, 2).map(amrId => (
                    <span 
                      key={amrId}
                      className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"
                    >
                      {amrId}
                    </span>
                  ))}
                  {/* Show remaining as pending/amber */}
                  {schedule.targetAMRs.slice(2, 3).map((_, idx) => (
                    <span 
                      key={`pending-${idx}`}
                      className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      TBD
                    </span>
                  ))}
                </div>
                {schedule.targetAMRs.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{schedule.targetAMRs.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Auto</span>
                <span className="text-xs text-slate-500">(2 assigned, 1 pending)</span>
              </div>
            )}
          </div>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            Details <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ) : null}
      
      {/* Dependencies */}
      {schedule.dependsOn && schedule.dependsOn.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Depends on: {schedule.dependsOn.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

// Timeline view
const TimelineView: React.FC<{
  schedules: ScheduleEntry[];
  onScheduleClick: (schedule: ScheduleEntry) => void;
}> = ({ schedules, onScheduleClick }) => {
  const currentTime = useMemo(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }, []);
  
  // Group schedules by hour
  const groupedSchedules = useMemo(() => {
    const grouped: Record<string, ScheduleEntry[]> = {};
    schedules.forEach(schedule => {
      const hour = schedule.timeWindow.start.split(':')[0];
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(schedule);
    });
    return grouped;
  }, [schedules]);
  
  return (
    <div className="space-y-4">
      {Object.entries(groupedSchedules)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([hour, hourSchedules]) => (
          <div key={hour} className="flex gap-4">
            <div className="w-16 flex-shrink-0 pt-3">
              <span className="text-sm font-semibold text-slate-700">
                {formatTime(`${hour}:00`)}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {hourSchedules
                .sort((a, b) => a.timeWindow.start.localeCompare(b.timeWindow.start))
                .map(schedule => (
                  <ScheduleCard 
                    key={schedule.id} 
                    schedule={schedule}
                    isCurrentTime={currentTime >= schedule.timeWindow.start && currentTime <= schedule.timeWindow.end}
                    onClick={() => onScheduleClick(schedule)}
                  />
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};

// Summary stats
const ScheduleStats: React.FC<{
  schedules: ScheduleEntry[];
}> = ({ schedules }) => {
  const stats = useMemo(() => {
    const total = schedules.length;
    const completed = schedules.filter(s => s.status === 'completed').length;
    const active = schedules.filter(s => s.status === 'active').length;
    const scheduled = schedules.filter(s => s.status === 'scheduled').length;
    const overdue = schedules.filter(s => s.status === 'overdue').length;
    
    return { total, completed, active, scheduled, overdue };
  }, [schedules]);
  
  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="bg-white p-3 rounded-lg border border-slate-200">
        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        <div className="text-xs text-slate-500">Total Tasks</div>
      </div>
      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
        <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
        <div className="text-xs text-green-600">Completed</div>
      </div>
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="text-2xl font-bold text-blue-700">{stats.active}</div>
        <div className="text-xs text-blue-600">Active</div>
      </div>
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="text-2xl font-bold text-slate-700">{stats.scheduled}</div>
        <div className="text-xs text-slate-600">Scheduled</div>
      </div>
      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
        <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
        <div className="text-xs text-red-600">Overdue</div>
      </div>
    </div>
  );
};

// Main ScheduleViewer component
export const ScheduleViewer: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[new Date().getDay()];
  });
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  
  const schedules = useMemo(() => {
    return getScheduleForDay(selectedDay);
  }, [selectedDay]);
  
  const currentDate = useMemo(() => {
    const today = new Date();
    return {
      dayName: getWeekDayLabel(selectedDay as WeekDay),
      date: today.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    };
  }, [selectedDay]);
  
  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">AMR Schedule</h2>
            <p className="text-sm text-slate-500">
              {currentDate.dayName}, {currentDate.date}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                List
              </button>
            </div>
            <DaySelector selectedDay={selectedDay} onSelect={setSelectedDay} />
          </div>
        </div>
        
        {/* Stats */}
        <ScheduleStats schedules={schedules} />
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {schedules.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No schedules for this day</p>
            </div>
          </div>
        ) : viewMode === 'timeline' ? (
          <TimelineView schedules={schedules} onScheduleClick={setSelectedSchedule} />
        ) : (
          <div className="space-y-2">
            {schedules
              .sort((a, b) => a.timeWindow.start.localeCompare(b.timeWindow.start))
              .map(schedule => (
                <ScheduleCard 
                  key={schedule.id} 
                  schedule={schedule}
                  isCurrentTime={false}
                  onClick={() => setSelectedSchedule(schedule)}
                />
              ))}
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedSchedule && (
        <TaskDetailModal 
          schedule={selectedSchedule} 
          onClose={() => setSelectedSchedule(null)} 
        />
      )}
    </div>
  );
};
