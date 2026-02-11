import React from 'react';
import { Truck, Package, MapPin, CheckCircle2, Circle } from 'lucide-react';

const steps = [
    { id: 's133', label: 'S133', sub: 'Inbound', status: 'completed', icon: Truck },
    { id: 's138', label: 'S138', sub: 'Picking', status: 'active', icon: Package },
    { id: 'f421', label: 'F421', sub: 'Unload', status: 'pending', icon: MapPin },
];

export const ProcessFlow: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Mission Route</h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">ID: #916726</span>
            </div>

            <div className="relative pt-2 pb-4">
                {/* Connecting Line */}
                <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200" />
                <div className="absolute top-5 left-4 w-1/3 h-0.5 bg-green-500" /> {/* Progress bar mockup */}

                <div className="flex justify-between relative z-10">
                    {steps.map((step) => {

                        const Icon = step.icon;
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-colors
                                    ${step.status === 'completed' ? 'border-green-500 text-green-500' :
                                        step.status === 'active' ? 'border-blue-500 text-blue-500 shadow-md ring-2 ring-blue-100' :
                                            'border-slate-300 text-slate-300'}
                                `}>
                                    {step.status === 'completed' ? <CheckCircle2 size={18} /> :
                                        step.status === 'active' ? <Icon size={18} /> :
                                            <Circle size={18} />}
                                </div>
                                <div className="text-center">
                                    <div className={`text-sm font-bold ${step.status === 'active' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {step.label}
                                    </div>
                                    <div className="text-[10px] uppercase text-muted-foreground font-medium">
                                        {step.sub}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mission Stops Details */}
            <div className="space-y-2 pt-2 border-t border-dashed">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Upcoming Stops</h4>
                <div className="flex flex-wrap gap-2">
                    {['S141', 'S142', 'S143', 'S144'].map(stop => (
                        <div key={stop} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono border border-slate-200">
                            {stop}
                        </div>
                    ))}
                    <div className="px-2 py-1 bg-white text-slate-400 rounded text-xs border border-dashed border-slate-300">
                        +3 more
                    </div>
                </div>
            </div>
        </div>
    );
};
