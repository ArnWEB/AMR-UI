import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Package, 
  MapPin, 
  Box,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  Warehouse
} from 'lucide-react';
import { CargoItem, RackZone, CargoStatus } from '@/types/cargo';
import { 
  getCargoStatusLabel, 
  getCargoStatusColor, 
  getCargoTypeLabel,
  getZoneLabel,
  formatLocation,
  formatDimensions,
  getPriorityColor
} from '@/types/cargo';
import { demoCargoItems, searchCargo, getCargoStats } from '@/data/cargoData';

// Status badge component
const StatusBadge: React.FC<{ status: CargoStatus }> = ({ status }) => {
  const color = getCargoStatusColor(status);
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {getCargoStatusLabel(status)}
    </span>
  );
};

// Priority badge component
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const color = getPriorityColor(priority);
  return (
    <span 
      className="px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {priority}
    </span>
  );
};

// Zone filter component
const ZoneFilter: React.FC<{
  selectedZone: RackZone | null;
  onSelect: (zone: RackZone | null) => void;
}> = ({ selectedZone, onSelect }) => {
  const zones: RackZone[] = ['STORAGE_A', 'STORAGE_B', 'STORAGE_C', 'STORAGE_D', 'STORAGE_E', 'STORAGE_F'];
  
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          selectedZone === null
            ? 'bg-slate-800 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        All Zones
      </button>
      {zones.map(zone => (
        <button
          key={zone}
          onClick={() => onSelect(zone)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedZone === zone
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {getZoneLabel(zone).replace('Storage ', '')}
        </button>
      ))}
    </div>
  );
};

// Cargo Detail Modal
const CargoDetailModal: React.FC<{
  cargo: CargoItem | null;
  onClose: () => void;
}> = ({ cargo, onClose }) => {
  if (!cargo) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{cargo.id}</h3>
              <p className="text-xs text-slate-500">{cargo.sku}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Product Info */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 mb-2">{cargo.name}</h4>
            <p className="text-sm text-slate-600">{cargo.description}</p>
          </div>
          
          {/* Status & Priority */}
          <div className="flex gap-3 mb-6">
            <StatusBadge status={cargo.status} />
            <PriorityBadge priority={cargo.priority} />
            {cargo.fragile && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Fragile
              </span>
            )}
            {cargo.hazardous && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Hazardous
              </span>
            )}
          </div>
          
          {/* Location */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
              <MapPin className="w-4 h-4" />
              Current Location
            </div>
            <div className="text-sm text-slate-700">
              {formatLocation(cargo.currentLocation)}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-600">
              <span>Zone: {getZoneLabel(cargo.currentLocation.zone)}</span>
              <span>Rack: {cargo.currentLocation.rackId}</span>
              <span>Shelf: {cargo.currentLocation.shelfId}</span>
            </div>
          </div>
          
          {/* Specifications */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-slate-900">{cargo.weight} kg</div>
              <div className="text-xs text-slate-500">Weight</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-slate-900">{cargo.quantity}</div>
              <div className="text-xs text-slate-500">Quantity</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-slate-900">{getCargoTypeLabel(cargo.type)}</div>
              <div className="text-xs text-slate-500">Type</div>
            </div>
          </div>
          
          {/* Dimensions */}
          <div className="mb-6">
            <div className="text-xs text-slate-500 mb-1">Dimensions (L×W×H)</div>
            <div className="text-sm font-semibold text-slate-900">{formatDimensions(cargo.dimensions)}</div>
          </div>
          
          {/* Timeline */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tracking Timeline
            </h4>
            <div className="space-y-3">
              {cargo.receivedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Received</div>
                    <div className="text-xs text-slate-500">{new Date(cargo.receivedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {cargo.storedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Stored</div>
                    <div className="text-xs text-slate-500">{new Date(cargo.storedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Assignment */}
          {(cargo.assignedAMR || cargo.assignedTask) && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="text-xs text-slate-500 mb-2">Assignment</div>
              {cargo.assignedAMR && (
                <div className="text-sm text-slate-900">AMR: {cargo.assignedAMR}</div>
              )}
              {cargo.assignedTask && (
                <div className="text-sm text-slate-900">Task: {cargo.assignedTask}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main CargoInventory component
export const CargoInventory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<RackZone | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);
  const [sortBy, setSortBy] = useState<'id' | 'zone' | 'status'>('id');
  
  // Filter and search cargo
  const filteredCargo = useMemo(() => {
    let results = searchCargo(demoCargoItems, searchQuery, {
      zone: selectedZone || undefined,
    });
    
    // Sort results
    results = [...results].sort((a, b) => {
      if (sortBy === 'id') return a.id.localeCompare(b.id);
      if (sortBy === 'zone') return a.currentLocation.zone.localeCompare(b.currentLocation.zone);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
    
    return results;
  }, [searchQuery, selectedZone, sortBy]);
  
  // Get statistics
  const stats = useMemo(() => getCargoStats(demoCargoItems), []);
  
  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-blue-600" />
              Cargo Inventory
            </h2>
            <p className="text-sm text-slate-500">Search and track cargo across all storage racks</p>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs text-slate-500">Total Items</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.stored}</div>
            <div className="text-xs text-green-600">In Storage</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.inTransit}</div>
            <div className="text-xs text-blue-600">In Transit</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="text-2xl font-bold text-amber-700">{stats.picking}</div>
            <div className="text-xs text-amber-600">Being Picked</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
            <div className="text-xs text-red-600">High Priority</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{stats.fragile}</div>
            <div className="text-xs text-purple-600">Fragile</div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by cargo ID, SKU, name, or rack location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'id' | 'zone' | 'status')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="id">Sort by ID</option>
              <option value="zone">Sort by Zone</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
          
          <ZoneFilter selectedZone={selectedZone} onSelect={setSelectedZone} />
        </div>
        
        {/* Results Count */}
        <div className="mt-3 text-sm text-slate-600">
          Showing {filteredCargo.length} of {demoCargoItems.length} cargo items
        </div>
      </div>
      
      {/* Cargo List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCargo.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No cargo items found</p>
              <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCargo.map(cargo => (
              <div
                key={cargo.id}
                onClick={() => setSelectedCargo(cargo)}
                className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Box className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{cargo.name}</h4>
                        <span className="text-xs text-slate-500">{cargo.id}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{cargo.sku}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <StatusBadge status={cargo.status} />
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cargo.currentLocation.rackId} - {cargo.currentLocation.position}
                        </span>
                        <span className="text-xs text-slate-500">{cargo.weight} kg</span>
                        <span className="text-xs text-slate-500">Qty: {cargo.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={cargo.priority} />
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedCargo && (
        <CargoDetailModal 
          cargo={selectedCargo} 
          onClose={() => setSelectedCargo(null)} 
        />
      )}
    </div>
  );
};
