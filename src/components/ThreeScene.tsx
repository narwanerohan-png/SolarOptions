import React, { useRef, useMemo, useEffect, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Grid, 
  Center, 
  ContactShadows,
  Edges
} from '@react-three/drei';
import * as THREE from 'three';
import { Point, PanelConfig, calculatePanelPlacements } from '../utils/geometry';

interface ThreeSceneProps {
  buildings: Point[][];
  panelZones: Point[][];
  buildingHeight: number;
  panelConfig: PanelConfig;
  onPlacementsUpdate?: (count: number) => void;
}

function Building({ points, buildingHeight }: { points: Point[]; buildingHeight: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (points.length < 3) return s;
    s.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        s.lineTo(points[i].x, points[i].y);
    }
    s.closePath();
    return s;
  }, [points]);

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: buildingHeight,
    bevelEnabled: false,
  }), [buildingHeight]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.05} />
        <Edges color="#cbd5e1" />
      </mesh>
    </group>
  );
}

function Panels({ polygons, buildingHeight, panelConfig, onUpdate }: { polygons: Point[][]; buildingHeight: number; panelConfig: PanelConfig; onUpdate?: (count: number) => void }) {
  const allPlacements = useMemo(() => {
    // Apply a 0.5m safety railing gap (margin)
    const placements = polygons.flatMap(poly => calculatePanelPlacements(poly, panelConfig, 0.5));
    return placements;
  }, [polygons, panelConfig]);

  useEffect(() => {
    if (onUpdate) onUpdate(allPlacements.length);
  }, [allPlacements.length, onUpdate]);

  const panelGeometry = useMemo(() => new THREE.BoxGeometry(panelConfig.width * 0.96, panelConfig.height * 0.96, 0.06), [panelConfig.width, panelConfig.height]);
  
  useEffect(() => {
    return () => {
      panelGeometry.dispose();
    };
  }, [panelGeometry]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    
    allPlacements.forEach((pos, i) => {
      dummy.position.set(pos.x, pos.y, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [allPlacements, dummy]);

  if (allPlacements.length === 0) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, buildingHeight + 0.08, 0]}>
      <instancedMesh ref={meshRef} args={[panelGeometry, undefined, allPlacements.length]} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#080c14" 
          roughness={0.1} 
          metalness={0.9}
          emissive="#1e3a8a"
          emissiveIntensity={0.1}
        />
      </instancedMesh>
    </group>
  );
}

function ThreeSceneBase({ buildings, panelZones, buildingHeight, panelConfig, onPlacementsUpdate, glRef }: ThreeSceneProps & { glRef?: React.MutableRefObject<THREE.WebGLRenderer | null> }) {
  const activePanelPolygons = useMemo(() => {
    return panelZones.length > 0 ? panelZones : buildings;
  }, [panelZones, buildings]);

  // Clean up glRef reference on unmount to prevent WebGL context retention leaks
  useEffect(() => {
    return () => {
      if (glRef) {
        glRef.current = null;
      }
    };
  }, [glRef]);

  return (
    <div className="w-full h-full bg-[#f8fafc]">
      <Canvas 
        shadows 
        dpr={[1, 1.5]}
        frameloop="demand"
        performance={{ min: 0.5 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        }} 
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap;
          if (glRef) glRef.current = gl;
        }}
        camera={{ position: [50, 50, 50], fov: 45 }}
      >
        <PerspectiveCamera makeDefault position={[60, 60, 60]} fov={35} />
        <OrbitControls 
          makeDefault 
          enableDamping 
          dampingFactor={0.06}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          maxDistance={200}
          minDistance={10}
        />
        
        <ambientLight intensity={0.4} />
        <spotLight 
          position={[50, 150, 50]} 
          angle={0.2} 
          penumbra={1} 
          intensity={2.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-20, 50, -20]} intensity={1} color="#3b82f6" />
        <pointLight position={[20, 20, 20]} intensity={0.5} color="#fbbf24" />

        <Center top>
          <group>
            {buildings.map((b, i) => (
              <Building key={i} points={b} buildingHeight={buildingHeight} />
            ))}
            <Panels polygons={activePanelPolygons} buildingHeight={buildingHeight} panelConfig={panelConfig} onUpdate={onPlacementsUpdate} />
          </group>
        </Center>

        <ContactShadows 
          resolution={512} 
          scale={180} 
          blur={2} 
          opacity={0.35} 
          far={30} 
          color="#0f172a" 
        />

        <Grid
          infiniteGrid
          fadeDistance={200}
          fadeStrength={6}
          sectionSize={20}
          sectionColor="#94a3b8"
          sectionThickness={1.5}
          cellSize={5}
          cellColor="#cbd5e1"
          cellThickness={0.8}
          position={[0, -0.01, 0]}
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

const ThreeScene = memo(ThreeSceneBase);
export default ThreeScene;
