import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
    Activity, Clock, Package, Zap, TrendingUp, 
    BarChart3, PieChart as PieIcon, AlertTriangle 
} from 'lucide-react';
import { AMRUtilization } from './AMRUtilization';

// Mock data for AMR working hours
const amrWorkingHoursData = [
    { name: 'AMR-1', hours: 8.5, tasks: 24, efficiency: 92, battery: 85 },
    { name: 'AMR-2', hours: 7.2, tasks: 18, efficiency: 88, battery: 72 },
    { name: 'AMR-3', hours: 6.8, tasks: 15, efficiency: 85, battery: 68 },
    { name: 'AMR-4', hours: 9.1, tasks: 28, efficiency: 94, battery: 91 },
    { name: 'AMR-5', hours: 5.5, tasks: 12, efficiency: 82, battery: 55 },
];

// Previous day hourly throughput
const hourlyThroughputData = [
    { hour: '00:00', tasks: 12, efficiency: 95 },
    { hour: '02:00', tasks: 8, efficiency: 92 },
    { hour: '04:00', tasks: 15, efficiency: 94 },
    { hour: '06:00', tasks: 45, efficiency: 88 },
    { hour: '08:00', tasks: 120, efficiency: 85 },
    { hour: '10:00', tasks: 180, efficiency: 92 },
    { hour: '12:00', tasks: 165, efficiency: 89 },
    { hour: '14:00', tasks: 195, efficiency: 94 },
    { hour: '16:00', tasks: 210, efficiency: 91 },
    { hour: '18:00', tasks: 175, efficiency: 88 },
    { hour: '20:00', tasks: 95, efficiency: 90 },
    { hour: '22:00', tasks: 45, efficiency: 93 },
];

// Daily performance history (last 7 days)
const dailyPerformanceData = [
    { date: 'Mon', tasks: 1245, efficiency: 89, amrs: 5 },
    { date: 'Tue', tasks: 1380, efficiency: 91, amrs: 5 },
    { date: 'Wed', tasks: 1190, efficiency: 87, amrs: 5 },
    { date: 'Thu', tasks: 1520, efficiency: 92, amrs: 5 },
    { date: 'Fri', tasks: 1680, efficiency: 94, amrs: 5 },
    { date: 'Sat', tasks: 890, efficiency: 85, amrs: 3 },
    { date: 'Sun', tasks: 456, efficiency: 82, amrs: 2 },
];

// Zone utilization data
const zoneUtilizationData = [
    { name: 'Dock Left', utilization: 85, capacity: 100, color: '#3b82f6' },
    { name: 'Processing', utilization: 72, capacity: 80, color: '#f59e0b' },
    { name: 'Storage Top', utilization: 65, capacity: 75, color: '#22c55e' },
    { name: 'Storage Bottom', utilization: 58, capacity: 70, color: '#8b5cf6' },
    { name: 'Charging', utilization: 45, capacity: 50, color: '#10b981' },
];

// Task distribution pie chart data
const taskDistributionData = [
    { name: 'Completed', value: 85, color: '#22c55e' },
    { name: 'In Progress', value: 10, color: '#f59e0b' },
    { name: 'Pending', value: 3, color: '#3b82f6' },
    { name: 'Failed', value: 2, color: '#ef4444' },
];

// Real-time metrics
const currentMetrics = {
    activeAMRs: 5,
    totalTasks: 1247,
    completedToday: 1189,
    efficiency: 92.5,
    avgTaskTime: '4.2 min',
    batteryLevel: 78,
    activeAlerts: 2,
};

export const MonitoringDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
    const [selectedAMR, setSelectedAMR] = useState<string>('all');

    // Animated counter effect
    const [animatedMetrics, setAnimatedMetrics] = useState({
        tasks: 0,
        efficiency: 0,
        active: 0,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedMetrics({
                tasks: currentMetrics.completedToday,
                efficiency: currentMetrics.efficiency,
                active: currentMetrics.activeAMRs,
            });
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col gap-6 h-full bg-slate-50 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Monitoring Dashboard</h2>
                    <p className="text-sm text-slate-500">Real-time warehouse performance metrics</p>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month')}
                        className="px-3 py-2 border rounded-lg bg-white text-sm"
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Export Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Active AMRs</p>
                            <p className="text-2xl font-bold text-slate-800">{animatedMetrics.active}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">+2 from yesterday</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Tasks Completed</p>
                            <p className="text-2xl font-bold text-slate-800">{animatedMetrics.tasks.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">+15% vs yesterday</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">System Efficiency</p>
                            <p className="text-2xl font-bold text-slate-800">{animatedMetrics.efficiency}%</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Zap className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">+3.2% this week</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Active Alerts</p>
                            <p className="text-2xl font-bold text-slate-800">{currentMetrics.activeAlerts}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-amber-600">1 Warning, 1 Info</span>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-2 gap-4">
                {/* Hourly Throughput Chart */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-slate-600" />
                            <h3 className="font-semibold text-slate-800">Hourly Throughput</h3>
                        </div>
                        <span className="text-xs text-slate-500">Previous Day</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={hourlyThroughputData}>
                            <defs>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="tasks" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorTasks)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* AMR Working Hours Chart */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-600" />
                            <h3 className="font-semibold text-slate-800">AMR Working Hours</h3>
                        </div>
                        <select 
                            value={selectedAMR}
                            onChange={(e) => setSelectedAMR(e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                        >
                            <option value="all">All AMRs</option>
                            <option value="AMR-1">AMR-1</option>
                            <option value="AMR-2">AMR-2</option>
                            <option value="AMR-3">AMR-3</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={amrWorkingHoursData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={60} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-3 gap-4">
                {/* Daily Performance Trend */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-600" />
                            <h3 className="font-semibold text-slate-800">Weekly Performance</h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Tasks
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Efficiency %
                            </span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={dailyPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} />
                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="tasks" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                            />
                            <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="efficiency" 
                                stroke="#22c55e" 
                                strokeWidth={2}
                                dot={{ fill: '#22c55e', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Task Distribution Pie */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-slate-600" />
                            <h3 className="font-semibold text-slate-800">Task Distribution</h3>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={taskDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {taskDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                        {taskDistributionData.map((item) => (
                            <div key={item.name} className="flex items-center gap-1 text-xs">
                                <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-slate-600">{item.name}: {item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zone Utilization */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-800">Zone Utilization</h3>
                    </div>
                    <span className="text-xs text-slate-500">Current Status</span>
                </div>
                <div className="space-y-3">
                    {zoneUtilizationData.map((zone) => (
                        <div key={zone.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">{zone.name}</span>
                                <span className="text-slate-500">{zone.utilization}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                        width: `${zone.utilization}%`,
                                        backgroundColor: zone.color
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AMR Utilization Timeline */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <AMRUtilization />
            </div>

            {/* AMR Performance Table */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-800">AMR Performance Details</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">AMR</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Working Hours</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Tasks</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Efficiency</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Battery</th>
                            </tr>
                        </thead>
                        <tbody>
                            {amrWorkingHoursData.map((amr) => (
                                <tr key={amr.name} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-2 px-3 text-sm font-medium text-slate-800">{amr.name}</td>
                                    <td className="py-2 px-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-sm text-slate-600">{amr.hours}h</td>
                                    <td className="py-2 px-3 text-sm text-slate-600">{amr.tasks}</td>
                                    <td className="py-2 px-3">
                                        <span className={`text-sm font-medium ${
                                            amr.efficiency >= 90 ? 'text-green-600' : 
                                            amr.efficiency >= 85 ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                            {amr.efficiency}%
                                        </span>
                                    </td>
                                    <td className="py-2 px-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${amr.battery}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {amr.battery}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
