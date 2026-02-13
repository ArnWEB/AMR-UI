import React, { useMemo } from 'react';
import { 
  Clock, 
  Zap, 
  PauseCircle, 
  Activity,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';

interface TimeSlot {
  hour: number;
  status: 'working' | 'idle' | 'charging' | 'maintenance' | 'error';
  task?: string;
}

// Generate mock hourly utilization data for the last 24 hours
const generateHourlyData = (amrId: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  // Vary patterns slightly based on AMR ID
  const amrOffset = parseInt(amrId.replace(/\D/g, '')) || 0;
  const currentHour = new Date().getHours();
  
  for (let i = 0; i < 24; i++) {
    const hour = (currentHour - 23 + i + 24) % 24;
    
    // Simulate realistic warehouse patterns with AMR-specific variations
    let status: TimeSlot['status'];
    const adjustedRand = Math.random() + (amrOffset * 0.01); // Slight variation per AMR
    
    if (hour >= 22 || hour < 6) {
      // Night time - mostly charging
      status = adjustedRand > 0.2 ? 'charging' : 'idle';
    } else if (hour >= 8 && hour <= 18) {
      // Day time - mostly working
      if (adjustedRand > 0.85) status = 'charging';
      else if (adjustedRand > 0.75) status = 'idle';
      else if (adjustedRand > 0.95) status = 'maintenance';
      else status = 'working';
    } else {
      // Transition hours
      if (adjustedRand > 0.6) status = 'working';
      else if (adjustedRand > 0.4) status = 'charging';
      else status = 'idle';
    }
    
    slots.push({
      hour,
      status,
      task: status === 'working' ? `Task ${(amrOffset % 10) + 1}` : undefined
    });
  }
  
  return slots;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    working: '#22c55e',      // Green
    idle: '#94a3b8',         // Gray
    charging: '#3b82f6',     // Blue
    maintenance: '#f59e0b',  // Amber
    error: '#ef4444'         // Red
  };
  return colors[status] || '#94a3b8';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    working: 'Working',
    idle: 'Idle',
    charging: 'Charging',
    maintenance: 'Maintenance',
    error: 'Error'
  };
  return labels[status] || status;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'working': return <Activity className="w-3 h-3" />;
    case 'idle': return <PauseCircle className="w-3 h-3" />;
    case 'charging': return <Zap className="w-3 h-3" />;
    case 'maintenance': return <AlertTriangle className="w-3 h-3" />;
    case 'error': return <AlertTriangle className="w-3 h-3" />;
    default: return <Clock className="w-3 h-3" />;
  }
};

// Individual AMR Timeline Row
const AMRTimelineRow: React.FC<{
  amrId: string;
  hourlyData: TimeSlot[];
}> = ({ amrId, hourlyData }) => {
  const amrs = useSimulationStore((state) => state.amrs);
  const amr = amrs.find(a => a.id === amrId);
  
  // Calculate utilization stats
  const stats = useMemo(() => {
    const total = hourlyData.length;
    const working = hourlyData.filter(s => s.status === 'working').length;
    const idle = hourlyData.filter(s => s.status === 'idle').length;
    const charging = hourlyData.filter(s => s.status === 'charging').length;
    const maintenance = hourlyData.filter(s => s.status === 'maintenance').length;
    const error = hourlyData.filter(s => s.status === 'error').length;
    
    return {
      working: (working / total) * 100,
      idle: (idle / total) * 100,
      charging: (charging / total) * 100,
      maintenance: (maintenance / total) * 100,
      error: (error / total) * 100,
      utilization: (working / total) * 100
    };
  }, [hourlyData]);
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-3">
      {/* AMR Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-slate-700">{amrId}</span>
          </div>
          <div>
            <div className="font-semibold text-slate-900">{amrId}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Current Status:</span>
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: `${getStatusColor(amr?.status || 'idle')}20`,
                  color: getStatusColor(amr?.status || 'idle')
                }}
              >
                {getStatusIcon(amr?.status || 'idle')}
                {getStatusLabel(amr?.status || 'idle')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500">Battery</div>
            <div className={`text-sm font-semibold ${(amr?.battery || 0) < 20 ? 'text-red-600' : 'text-green-600'}`}>
              {amr?.battery || 0}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Utilization</div>
            <div className="text-sm font-semibold text-slate-900">{stats.utilization.toFixed(0)}%</div>
          </div>
        </div>
      </div>
      
      {/* 24-Hour Timeline */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>24h ago</span>
          <span>Now</span>
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {hourlyData.map((slot, idx) => (
            <div
              key={idx}
              className="flex-1 relative group cursor-pointer"
              style={{ backgroundColor: getStatusColor(slot.status) }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {slot.hour}:00 - {getStatusLabel(slot.status)}
                {slot.task && ` (${slot.task})`}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>
      
      {/* Utilization Breakdown */}
      <div className="grid grid-cols-5 gap-2">
        <div className="bg-green-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-green-700">{stats.working.toFixed(0)}%</div>
          <div className="text-xs text-green-600 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3" /> Working
          </div>
        </div>
        <div className="bg-slate-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-slate-700">{stats.idle.toFixed(0)}%</div>
          <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
            <PauseCircle className="w-3 h-3" /> Idle
          </div>
        </div>
        <div className="bg-blue-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-blue-700">{stats.charging.toFixed(0)}%</div>
          <div className="text-xs text-blue-600 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" /> Charging
          </div>
        </div>
        <div className="bg-amber-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-amber-700">{stats.maintenance.toFixed(0)}%</div>
          <div className="text-xs text-amber-600 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Maint.
          </div>
        </div>
        <div className="bg-red-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-red-700">{stats.error.toFixed(0)}%</div>
          <div className="text-xs text-red-600 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Error
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Statistics Component
const UtilizationSummary: React.FC<{
  allHourlyData: Record<string, TimeSlot[]>;
}> = ({ allHourlyData }) => {
  const summary = useMemo(() => {
    const allSlots = Object.values(allHourlyData).flat();
    const total = allSlots.length;
    
    return {
      working: (allSlots.filter(s => s.status === 'working').length / total) * 100,
      idle: (allSlots.filter(s => s.status === 'idle').length / total) * 100,
      charging: (allSlots.filter(s => s.status === 'charging').length / total) * 100,
      maintenance: (allSlots.filter(s => s.status === 'maintenance').length / total) * 100,
      error: (allSlots.filter(s => s.status === 'error').length / total) * 100
    };
  }, [allHourlyData]);
  
  const amrCount = Object.keys(allHourlyData).length;
  const avgUtilization = summary.working;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        Fleet Utilization Summary (Last 24h)
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-slate-900">{amrCount}</div>
          <div className="text-xs text-slate-600">Total AMRs</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700">{summary.working.toFixed(1)}%</div>
          <div className="text-xs text-green-600">Avg Working</div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-slate-700">{summary.idle.toFixed(1)}%</div>
          <div className="text-xs text-slate-600">Avg Idle</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700">{summary.charging.toFixed(1)}%</div>
          <div className="text-xs text-blue-600">Avg Charging</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-amber-700">{summary.maintenance.toFixed(1)}%</div>
          <div className="text-xs text-amber-600">Maintenance</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-700">{summary.error.toFixed(1)}%</div>
          <div className="text-xs text-red-600">Error Time</div>
        </div>
      </div>
      
      {/* Fleet Average Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">Fleet Average Utilization</span>
          <span className="font-semibold text-slate-900">{avgUtilization.toFixed(1)}%</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-green-500"
            style={{ width: `${summary.working}%` }}
          />
          <div 
            className="h-full bg-slate-400"
            style={{ width: `${summary.idle}%` }}
          />
          <div 
            className="h-full bg-blue-500"
            style={{ width: `${summary.charging}%` }}
          />
          <div 
            className="h-full bg-amber-500"
            style={{ width: `${summary.maintenance}%` }}
          />
          <div 
            className="h-full bg-red-500"
            style={{ width: `${summary.error}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded" /> Working</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-400 rounded" /> Idle</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded" /> Charging</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded" /> Maint.</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded" /> Error</span>
        </div>
      </div>
    </div>
  );
};

// Main AMR Utilization Component
export const AMRUtilization: React.FC = () => {
  const amrs = useSimulationStore((state) => state.amrs);
  
  // Generate hourly data for each AMR
  const allHourlyData = useMemo(() => {
    const data: Record<string, TimeSlot[]> = {};
    amrs.forEach(amr => {
      data[amr.id] = generateHourlyData(amr.id);
    });
    return data;
  }, [amrs]);
  
  return (
    <div className="space-y-4">
      {/* Summary */}
      <UtilizationSummary allHourlyData={allHourlyData} />
      
      {/* Individual AMR Timelines */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Individual AMR Utilization (24h Timeline)
        </h3>
        
        {amrs.map(amr => (
          <AMRTimelineRow 
            key={amr.id} 
            amrId={amr.id} 
            hourlyData={allHourlyData[amr.id] || []}
          />
        ))}
      </div>
    </div>
  );
};
