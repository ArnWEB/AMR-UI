import { Bell, Search, User, Map, Video, BarChart2, Calendar, Package, Menu } from 'lucide-react';

type CenterTab = 'map' | 'video' | 'monitoring' | 'schedule' | 'inventory';

const tabs = [
    { id: 'map', label: 'Map View', icon: Map },
    { id: 'monitoring', label: 'Monitoring', icon: BarChart2 },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'video', label: 'Live Feed', icon: Video },
];

interface HeaderProps {
    activeTab?: CenterTab;
    onTabChange?: (tab: CenterTab) => void;
    onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab = 'map', onTabChange, onMenuToggle }) => {
    return (
        <header className="h-14 md:h-16 bg-white border-b border-border flex items-center justify-between px-2 md:px-4 lg:px-6 shadow-sm shrink-0">
            {/* Left: Logo & Menu Toggle */}
            <div className="flex items-center gap-2 md:gap-3">
                <button
                    className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                    onClick={onMenuToggle}
                >
                    <Menu size={20} className="text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2 shrink-0">
                    <img 
                        src="/ey-logo.png" 
                        alt="Logo" 
                        className="h-10 w-auto md:h-12 lg:h-14 object-contain"
                    />
                </div>
            </div>

            {/* Center: Tabs - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id as CenterTab)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                                ${isActive
                                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
                            `}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            {/* Tablet: Show icon tabs */}
            <nav className="hidden md:flex lg:hidden items-center gap-0.5">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id as CenterTab)}
                            className={`
                                p-2 rounded-lg transition-all
                                ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted'
                                }
                            `}
                            title={tab.label}
                        >
                            <Icon size={18} />
                        </button>
                    );
                })}
            </nav>

            {/* Mobile: Show only icon tabs */}
            <nav className="flex md:hidden items-center gap-0.5">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id as CenterTab)}
                            className={`
                                p-1.5 rounded-lg transition-all
                                ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted'
                                }
                            `}
                            title={tab.label}
                        >
                            <Icon size={16} />
                        </button>
                    );
                })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
                    <Bell className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                </button>
            </div>
        </header>
    );
};
