import React, { useRef, useMemo, useEffect, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Lightformer,
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
        <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.02} />
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

  const panelTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Silver/White Outer Aluminum Frame
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 1024);

    // 2. Inner Frame / Dark Navy border
    const frameWidth = 10;
    ctx.fillStyle = '#102042';
    ctx.fillRect(frameWidth, frameWidth, 512 - frameWidth * 2, 1024 - frameWidth * 2);

    // 3. Solar cells grid (6 cols x 12 rows)
    const cols = 6;
    const rows = 12;
    const gap = 3;
    const margin = frameWidth + 4;
    const availableW = 512 - margin * 2;
    const availableH = 1024 - margin * 2;
    const cellW = (availableW - gap * (cols - 1)) / cols;
    const cellH = (availableH - gap * (rows - 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = margin + c * (cellW + gap);
        const y = margin + r * (cellH + gap);

        // Rich dark navy blue solar cell gradient (classic monocrystalline / polycrystalline silicon blue)
        const grad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
        grad.addColorStop(0, '#2563eb');
        grad.addColorStop(0.3, '#1d4ed8');
        grad.addColorStop(0.7, '#1e3a8a');
        grad.addColorStop(1, '#0f224a');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cellW, cellH);

        // Solar cell silver busbars (fine grid lines inside cell)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        // 2 vertical busbars per cell
        ctx.moveTo(x + cellW * 0.33, y);
        ctx.lineTo(x + cellW * 0.33, y + cellH);
        ctx.moveTo(x + cellW * 0.66, y);
        ctx.lineTo(x + cellW * 0.66, y + cellH);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      if (panelTexture) panelTexture.dispose();
    };
  }, [panelTexture]);

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
          map={panelTexture || undefined}
          color="#ffffff" 
          roughness={0.2} 
          metalness={0.4}
          emissive="#1e3a8a"
          emissiveIntensity={0.15}
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
    <div className="w-full h-full bg-white">
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
        
        <ambientLight intensity={0.75} color="#ffffff" />
        <directionalLight 
          position={[60, 100, 40]} 
          intensity={2.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          color="#ffffff"
        />
        <directionalLight 
          position={[-50, 60, -30]} 
          intensity={0.6} 
          color="#f1f5f9"
        />
        <pointLight position={[0, 40, 0]} intensity={0.5} color="#ffffff" />

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
        
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 4, 0, 0]}>
            <Lightformer form="ring" color="#ffffff" intensity={2} scale={10} position={[0, 10, -10]} />
            <Lightformer form="rect" color="#ffffff" intensity={2} scale={20} position={[-15, 15, -15]} rotation={[0, Math.PI / 4, 0]} />
            <Lightformer form="rect" color="#f1f5f9" intensity={1} scale={20} position={[15, 15, -15]} rotation={[0, -Math.PI / 4, 0]} />
            <Lightformer form="rect" color="#ffffff" intensity={0.5} scale={30} position={[0, -10, 0]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        </Environment>
      </Canvas>
    </div>
  );
}

const ThreeScene = memo(ThreeSceneBase);
export default ThreeScene;
