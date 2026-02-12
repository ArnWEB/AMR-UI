import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';
import { WAREHOUSE_GRAPH } from '@/utils/pathfinding';

// Types
interface AMRData {
  id: string;
  status: string;
  position: { x: number; y: number };
  path?: { x: number; y: number }[];
}

// Static scene elements that never change
const StaticEnvironment: React.FC = () => {
  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[400, 0, 300]} receiveShadow>
        <planeGeometry args={[800, 600]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      
      {/* Zone markers */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[400, 0.01, 300]} receiveShadow>
        <planeGeometry args={[700, 40]} />
        <meshStandardMaterial color="#52525b" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[400, 0.01, 300]} receiveShadow>
        <planeGeometry args={[60, 500]} />
        <meshStandardMaterial color="#52525b" transparent opacity={0.5} />
      </mesh>
      
      <Grid 
        args={[800, 600]} 
        cellSize={40} 
        cellThickness={1} 
        cellColor="#4b5563" 
        sectionSize={200} 
        sectionThickness={1.5}
        sectionColor="#6b7280" 
        fadeDistance={1000}
        infiniteGrid={false}
        position={[400, 0, 300]}
      />
      
      {/* Storage Racks */}
      <StorageRack position={[150, 0, 80]} label="STORAGE A" color="#3b82f6" />
      <StorageRack position={[320, 0, 80]} label="STORAGE B" color="#3b82f6" />
      <StorageRack position={[550, 0, 80]} label="STORAGE C" color="#3b82f6" />
      <StorageRack position={[150, 0, 520]} label="STORAGE D" color="#3b82f6" />
      <StorageRack position={[320, 0, 520]} label="STORAGE E" color="#3b82f6" />
      <StorageRack position={[550, 0, 520]} label="STORAGE F" color="#3b82f6" />
      <StorageRack position={[720, 0, 120]} label="ZONE A" color="#22c55e" width={40} />
      <StorageRack position={[720, 0, 480]} label="ZONE B" color="#22c55e" width={40} />
      
      {/* Charging Station */}
      <group position={[700, 0, 300]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[40, 2, 40]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[30, 20, 35]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
        <mesh position={[0, 22, 0]}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
        </mesh>
        <Text position={[0, 10, 18]} fontSize={10} color="#22c55e" anchorX="center">+</Text>
      </group>
    </>
  );
};

const StorageRack: React.FC<{ position: [number, number, number]; label: string; color: string; width?: number }> = ({ 
  position, label, color, width = 52 
}) => (
  <group position={position}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width, 60, 14]} />
      <meshStandardMaterial color="#374151" />
    </mesh>
    <Text position={[0, 35, 0]} fontSize={8} color={color} anchorX="center">
      {label}
    </Text>
  </group>
);

const WaypointsStatic: React.FC = () => {
  const startNodes = useMemo(() => ['L1', 'L2', 'L3', 'L4', 'L5'], []);
  
  return (
    <>
      {Object.entries(WAREHOUSE_GRAPH).map(([nodeId, node]) => {
        const isStart = startNodes.includes(nodeId);
        return (
          <WaypointMarker 
            key={nodeId} 
            position={[node.position.x, 2, node.position.y]} 
            isStart={isStart}
            nodeId={nodeId}
          />
        );
      })}
    </>
  );
};

const WaypointMarker: React.FC<{ position: [number, number, number]; isStart: boolean; nodeId: string }> = ({ 
  position, isStart, nodeId 
}) => {
  const [hovered, setHovered] = useState(false);
  const color = isStart ? '#3b82f6' : '#94a3b8';
  
  return (
    <group 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {isStart && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[8, 12, 32]} />
          <meshStandardMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.5 : 0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {hovered && (
        <Text position={[15, 5, 0]} fontSize={6} color={color} anchorX="left">
          {nodeId}
        </Text>
      )}
    </group>
  );
};

// Simple visible AMR component
const AMR: React.FC<{ amr: AMRData }> = ({ amr }) => {
  const meshRef = useRef<THREE.Group>(null);
  const posRef = useRef({ x: amr.position.x, y: amr.position.y });
  const rotRef = useRef(0);
  
  // Initialize position
  useEffect(() => {
    if (meshRef.current) {
      posRef.current = { x: amr.position.x, y: amr.position.y };
      meshRef.current.position.set(amr.position.x, 8, amr.position.y);
    }
  }, [amr.position.x, amr.position.y]);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Smoothly interpolate toward target position
    const targetX = amr.position.x;
    const targetY = amr.position.y;
    
    const dx = targetX - posRef.current.x;
    const dy = targetY - posRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 180 * delta;
    if (distance > 0.1) {
      if (distance < speed) {
        posRef.current.x = targetX;
        posRef.current.y = targetY;
      } else {
        posRef.current.x += (dx / distance) * speed;
        posRef.current.y += (dy / distance) * speed;
      }
      
      // Face movement direction
      const targetRot = Math.atan2(dx, dy);
      let diff = targetRot - rotRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rotRef.current += diff * Math.min(delta * 10, 1);
    }
    
    meshRef.current.position.set(posRef.current.x, 8, posRef.current.y);
    meshRef.current.rotation.y = rotRef.current;
  });
  
  const statusColor = useMemo(() => {
    switch (amr.status) {
      case 'error': return '#ef4444';
      case 'loading': return '#f59e0b';
      case 'unloading': return '#8b5cf6';
      case 'moving': return '#3b82f6';
      default: return '#22c55e';
    }
  }, [amr.status]);
  
  return (
    <group ref={meshRef} position={[amr.position.x, 8, amr.position.y]}>
      {/* Main body - dark grey */}
      <mesh castShadow>
        <boxGeometry args={[20, 8, 30]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      {/* Status light on top */}
      <mesh castShadow position={[0, 6, 0]}>
        <boxGeometry args={[16, 4, 26]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.3} />
      </mesh>
      
      {/* Direction arrow */}
      <mesh castShadow position={[0, 6, 16]} rotation={[0, 0, 0]}>
        <coneGeometry args={[5, 10, 4]} />
        <meshStandardMaterial color={statusColor} />
      </mesh>
      
      {/* 4 wheels */}
      {[[-8, -10], [8, -10], [-8, 10], [8, 10]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, -2, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3, 3, 3, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
      
      {/* ID label floating above */}
      <Text position={[0, 14, 0]} fontSize={5} color="#ffffff" anchorX="center">
        {amr.id}
      </Text>
    </group>
  );
};

// Main scene component
const Scene: React.FC = () => {
  const amrs = useSimulationStore((state) => state.amrs);
  
  const amrData: AMRData[] = useMemo(() => {
    return amrs.map(amr => ({
      id: amr.id,
      status: amr.status,
      position: amr.position,
      path: amr.path
    }));
  }, [amrs]);
  
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[400, 600, 400]} 
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={2000}
      />
      <directionalLight position={[-200, 300, 200]} intensity={0.4} />
      
      <StaticEnvironment />
      <WaypointsStatic />
      
      {amrData.map((amr) => (
        <AMR key={amr.id} amr={amr} />
      ))}
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={200}
        maxDistance={1200}
        target={[400, 0, 300]}
      />
    </>
  );
};

const Warehouse3D: React.FC = () => {
  return (
    <div className="w-full h-full bg-slate-100">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          powerPreference: 'high-performance',
          antialias: true,
          alpha: false
        }}
        camera={{ position: [600, 500, 600], fov: 50 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#f1f5f9');
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default Warehouse3D;
