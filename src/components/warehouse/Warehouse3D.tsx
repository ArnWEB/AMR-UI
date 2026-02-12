import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';
import { WAREHOUSE_GRAPH } from '@/utils/pathfinding';

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

// AMR that reads from store directly in useFrame
const AMR: React.FC<{ amrId: string }> = ({ amrId }) => {
  const meshRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3());
  const currentRot = useRef(0);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Get fresh state from store
    const store = useSimulationStore.getState();
    const amr = store.amrs.find(a => a.id === amrId);
    if (!amr) return;
    
    const targetX = amr.position.x;
    const targetZ = amr.position.y;
    
    // Smooth movement
    const dx = targetX - currentPos.current.x;
    const dz = targetZ - currentPos.current.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    const speed = 150 * delta;
    if (distance < speed) {
      currentPos.current.x = targetX;
      currentPos.current.z = targetZ;
    } else {
      currentPos.current.x += (dx / distance) * speed;
      currentPos.current.z += (dz / distance) * speed;
    }
    
    // Rotation
    if (amr.path && amr.path.length > 0) {
      const next = amr.path[0];
      const targetRot = Math.atan2(next.x - amr.position.x, next.y - amr.position.y);
      let diff = targetRot - currentRot.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      currentRot.current += diff * Math.min(delta * 5, 1);
    }
    
    meshRef.current.position.set(currentPos.current.x, 8, currentPos.current.z);
    meshRef.current.rotation.y = currentRot.current;
  });
  
  // Get initial position
  useEffect(() => {
    const store = useSimulationStore.getState();
    const amr = store.amrs.find(a => a.id === amrId);
    if (amr && meshRef.current) {
      currentPos.current.set(amr.position.x, 8, amr.position.y);
      meshRef.current.position.copy(currentPos.current);
    }
  }, [amrId]);
  
  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[20, 6, 30]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      {/* Upper body */}
      <mesh castShadow position={[0, 9, 0]}>
        <boxGeometry args={[18, 6, 24]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      
      {/* Status light bar */}
      <mesh castShadow position={[0, 14, 0]}>
        <boxGeometry args={[12, 4, 20]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      
      {/* Direction indicator */}
      <mesh castShadow position={[0, 14, 14]}>
        <coneGeometry args={[4, 6, 4]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Wheels */}
      <mesh castShadow position={[-10, 2, -12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 2, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh castShadow position={[10, 2, -12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 2, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh castShadow position={[-10, 2, 12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 2, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh castShadow position={[10, 2, 12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 2, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      
      {/* Label */}
      <Text position={[0, 22, 0]} fontSize={4} color="#ffffff" anchorX="center">
        {amrId}
      </Text>
    </group>
  );
};

// Main scene component
const Scene: React.FC = () => {
  const [amrIds, setAmrIds] = useState<string[]>(() => {
    // Initialize from store
    const store = useSimulationStore.getState();
    return store.amrs.map(a => a.id);
  });
  
  useEffect(() => {
    // Subscribe to changes only
    const unsubscribe = useSimulationStore.subscribe((state) => {
      const currentIds = state.amrs.map(a => a.id);
      setAmrIds(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(currentIds)) {
          return currentIds;
        }
        return prev;
      });
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[400, 500, 300]} 
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-200, 300, 200]} intensity={0.3} />
      
      <StaticEnvironment />
      <WaypointsStatic />
      
      {amrIds.map(id => (
        <AMR key={id} amrId={id} />
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

// Wrapper to handle camera
const CameraSetup: React.FC = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(600, 500, 600);
    camera.lookAt(400, 0, 300);
  }, [camera]);
  
  return null;
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
        <CameraSetup />
        <Scene />
      </Canvas>
    </div>
  );
};

export default Warehouse3D;
