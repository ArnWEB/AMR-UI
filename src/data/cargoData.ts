import { CargoItem, RackLocation, CargoStatus, RackZone, ZoneSummary } from '@/types/cargo';
import { getZoneLabel } from '@/types/cargo';

// Generate unique cargo ID
const generateCargoId = (index: number): string => {
  return `CARGO-${String(index).padStart(5, '0')}`;
};

// Generate SKU
const generateSKU = (category: string, index: number): string => {
  const prefixes: Record<string, string> = {
    electronics: 'ELEC',
    apparel: 'APRL',
    home: 'HOME',
    food: 'FOOD',
    automotive: 'AUTO',
    sports: 'SPRT'
  };
  return `${prefixes[category] || 'ITEM'}-${String(index).padStart(4, '0')}`;
};

// Sample product names by category
const productNames: Record<string, string[]> = {
  electronics: [
    'Wireless Bluetooth Headphones', 'Smart Watch Series 5', 'USB-C Charging Cable', 'Portable Power Bank',
    'Wireless Mouse', 'Mechanical Keyboard', 'Webcam HD 1080p', 'Smartphone Case',
    'Tablet Stand', 'Laptop Cooling Pad', 'HDMI Cable 6ft', 'Bluetooth Speaker'
  ],
  apparel: [
    'Cotton T-Shirt Large', 'Running Shoes Size 10', 'Winter Jacket', 'Denim Jeans',
    'Athletic Shorts', 'Baseball Cap', 'Wool Socks (Pack of 6)', 'Leather Belt',
    'Yoga Pants', 'Hoodie Sweatshirt', 'Rain Jacket', 'Work Boots'
  ],
  home: [
    'Coffee Maker', 'Vacuum Cleaner', 'Kitchen Knife Set', 'LED Desk Lamp',
    'Storage Container Set', 'Wall Clock', 'Picture Frame 8x10', 'Throw Pillows',
    'Bath Towel Set', 'Cookware Set', 'Air Purifier', 'Blender'
  ],
  food: [
    'Organic Coffee Beans 1kg', 'Protein Bars (Box of 12)', 'Green Tea Bags', 'Pasta Variety Pack',
    'Olive Oil 500ml', 'Granola Cereal', 'Honey Jar', 'Mixed Nuts',
    'Dark Chocolate Bar', 'Instant Oatmeal', 'Dried Fruit Mix', 'Sparkling Water (Pack)'
  ],
  automotive: [
    'Car Phone Mount', 'Windshield Wiper Blades', 'LED Headlight Bulbs', 'Car Air Freshener',
    'Tire Pressure Gauge', 'Emergency Road Kit', 'Car Cleaning Kit', 'Jump Starter',
    'Seat Covers', 'Steering Wheel Cover', 'Floor Mats', 'Motor Oil 5W-30'
  ],
  sports: [
    'Yoga Mat', 'Resistance Bands Set', 'Tennis Balls (Can)', 'Water Bottle 1L',
    'Jump Rope', 'Dumbbell Set', 'Soccer Ball', 'Fitness Tracker',
    'Cycling Gloves', 'Swimming Goggles', 'Foam Roller', 'Gym Bag'
  ]
};

// Rack positions
const rackPositions = [
  'A-01-01', 'A-01-02', 'A-01-03', 'A-01-04', 'A-01-05',
  'A-02-01', 'A-02-02', 'A-02-03', 'A-02-04', 'A-02-05',
  'A-03-01', 'A-03-02', 'A-03-03', 'A-03-04', 'A-03-05',
  'B-01-01', 'B-01-02', 'B-01-03', 'B-01-04', 'B-01-05',
  'B-02-01', 'B-02-02', 'B-02-03', 'B-02-04', 'B-02-05',
  'C-01-01', 'C-01-02', 'C-01-03', 'C-01-04', 'C-01-05',
  'C-02-01', 'C-02-02', 'C-02-03', 'C-02-04', 'C-02-05',
];

// Generate demo cargo items
export const generateDemoCargo = (): CargoItem[] => {
  const cargo: CargoItem[] = [];
  const categories = Object.keys(productNames);
  const statuses: CargoStatus[] = ['stored', 'stored', 'stored', 'stored', 'picking', 'in_transit', 'received'];
  const zones: RackZone[] = ['STORAGE_A', 'STORAGE_B', 'STORAGE_C', 'STORAGE_D', 'STORAGE_E', 'STORAGE_F'];
  const rackIds = ['RACK-01', 'RACK-02', 'RACK-03', 'RACK-04', 'RACK-05', 'RACK-06'];
  
  // Generate 100 cargo items
  for (let i = 1; i <= 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const products = productNames[category];
    const productName = products[Math.floor(Math.random() * products.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const rackId = rackIds[Math.floor(Math.random() * rackIds.length)];
    const position = rackPositions[Math.floor(Math.random() * rackPositions.length)];
    
    const cargoItem: CargoItem = {
      id: generateCargoId(i),
      sku: generateSKU(category, i),
      name: productName,
      description: `High-quality ${productName.toLowerCase()} for warehouse storage`,
      type: Math.random() > 0.3 ? 'box' : 'pallet',
      weight: Math.floor(Math.random() * 25) + 1, // 1-25 kg
      dimensions: {
        length: Math.floor(Math.random() * 50) + 20,
        width: Math.floor(Math.random() * 40) + 15,
        height: Math.floor(Math.random() * 30) + 10
      },
      quantity: Math.floor(Math.random() * 50) + 1,
      status,
      currentLocation: {
        zone,
        rackId,
        shelfId: String(Math.floor(Math.random() * 6) + 1),
        position
      },
      receivedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      storedAt: status === 'stored' || status === 'picking' ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      priority: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
      fragile: Math.random() > 0.85,
      hazardous: Math.random() > 0.95
    };
    
    cargo.push(cargoItem);
  }
  
  return cargo;
};

// Generate rack locations
export const generateRackLocations = (): RackLocation[] => {
  const locations: RackLocation[] = [];
  const zones: RackZone[] = ['STORAGE_A', 'STORAGE_B', 'STORAGE_C', 'STORAGE_D', 'STORAGE_E', 'STORAGE_F'];
  
  zones.forEach((zone, zoneIdx) => {
    // 6 racks per zone
    for (let rackNum = 1; rackNum <= 6; rackNum++) {
      // 6 shelves per rack
      for (let shelfNum = 1; shelfNum <= 6; shelfNum++) {
        // 5 positions per shelf
        for (let posNum = 1; posNum <= 5; posNum++) {
          const rackId = `RACK-${String(zoneIdx + 1).padStart(2, '0')}-${String(rackNum).padStart(2, '0')}`;
          const position = `${String.fromCharCode(65 + zoneIdx)}-${String(shelfNum).padStart(2, '0')}-${String(posNum).padStart(2, '0')}`;
          
          locations.push({
            id: `${zone}-${rackId}-SHELF${shelfNum}-POS${posNum}`,
            zone,
            rackName: `${getZoneLabel(zone)} - Rack ${rackNum}`,
            shelfNumber: shelfNum,
            position,
            capacity: 10,
            currentLoad: Math.floor(Math.random() * 8),
            isFull: Math.random() > 0.7,
            cargoIds: []
          });
        }
      }
    }
  });
  
  return locations;
};

// Calculate zone summaries
export const calculateZoneSummaries = (racks: RackLocation[]): ZoneSummary[] => {
  const zones: RackZone[] = ['STORAGE_A', 'STORAGE_B', 'STORAGE_C', 'STORAGE_D', 'STORAGE_E', 'STORAGE_F', 'ZONE_A', 'ZONE_B', 'PROCESSING', 'SHIPPING', 'RECEIVING'];
  
  return zones.map(zone => {
    const zoneRacks = racks.filter(r => r.zone === zone);
    const totalCapacity = zoneRacks.reduce((sum, r) => sum + r.capacity, 0);
    const currentLoad = zoneRacks.reduce((sum, r) => sum + r.currentLoad, 0);
    
    return {
      zone,
      totalRacks: zoneRacks.length,
      totalCapacity,
      currentLoad,
      utilizationPercent: Math.round((currentLoad / totalCapacity) * 100),
      availableSlots: totalCapacity - currentLoad
    };
  }).filter(z => z.totalRacks > 0);
};

// Demo data
export const demoCargoItems: CargoItem[] = generateDemoCargo();
export const demoRackLocations: RackLocation[] = generateRackLocations();
export const zoneSummaries = calculateZoneSummaries(demoRackLocations);

// Search function
export const searchCargo = (
  cargo: CargoItem[],
  query: string,
  filters: {
    zone?: RackZone;
    status?: CargoStatus;
    priority?: string;
  }
): CargoItem[] => {
  return cargo.filter(item => {
    // Text search
    const matchesQuery = !query || 
      item.id.toLowerCase().includes(query.toLowerCase()) ||
      item.sku.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.currentLocation.rackId.toLowerCase().includes(query.toLowerCase()) ||
      item.currentLocation.position.toLowerCase().includes(query.toLowerCase());
    
    // Filters
    const matchesZone = !filters.zone || item.currentLocation.zone === filters.zone;
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesPriority = !filters.priority || item.priority === filters.priority;
    
    return matchesQuery && matchesZone && matchesStatus && matchesPriority;
  });
};

// Get cargo by rack location
export const getCargoByRack = (cargo: CargoItem[], rackId: string): CargoItem[] => {
  return cargo.filter(c => c.currentLocation.rackId === rackId);
};

// Get cargo statistics
export const getCargoStats = (cargo: CargoItem[]) => {
  return {
    total: cargo.length,
    stored: cargo.filter(c => c.status === 'stored').length,
    inTransit: cargo.filter(c => c.status === 'in_transit').length,
    picking: cargo.filter(c => c.status === 'picking').length,
    urgent: cargo.filter(c => c.priority === 'urgent' || c.priority === 'high').length,
    fragile: cargo.filter(c => c.fragile).length,
    hazardous: cargo.filter(c => c.hazardous).length
  };
};
