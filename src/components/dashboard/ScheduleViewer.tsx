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
  Warehouse
} from 'lucide-react';
import { ScheduleEntry, ScheduleStatus, WeekDay } from '@/types/schedule';
import { 
  getScheduleTypeColor, 
  getStatusColor, 
  formatTime,
  getWeekDayLabel 
} from '@/types/schedule';
import { getScheduleForDay } from '@/data/scheduleData';

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

// Schedule card component
const ScheduleCard: React.FC<{ 
  schedule: ScheduleEntry;
  isCurrentTime: boolean;
}> = ({ schedule, isCurrentTime }) => {
  const typeColor = getScheduleTypeColor(schedule.type);
  const statusColor = getStatusColor(schedule.status);
  
  return (
    <div 
      className={`p-3 rounded-lg border transition-all ${
        isCurrentTime 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-slate-200 hover:border-slate-300'
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
      
      {/* AMR Assignment */}
      {schedule.targetAMRs && schedule.targetAMRs.length > 0 ? (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Assigned AMRs:</span>
            <div className="flex gap-1">
              {schedule.targetAMRs.map(amrId => (
                <span 
                  key={amrId}
                  className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700"
                >
                  {amrId}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : schedule.autoAssign ? (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">Auto-assigned to available AMRs</span>
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
}> = ({ schedules }) => {
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
          <TimelineView schedules={schedules} />
        ) : (
          <div className="space-y-2">
            {schedules
              .sort((a, b) => a.timeWindow.start.localeCompare(b.timeWindow.start))
              .map(schedule => (
                <ScheduleCard 
                  key={schedule.id} 
                  schedule={schedule}
                  isCurrentTime={false}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
