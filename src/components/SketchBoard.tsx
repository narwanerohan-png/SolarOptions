import React, { useState, useRef, useEffect } from 'react';
import { Point, getPolygonArea } from '../utils/geometry';
import { cn } from '../lib/utils';

interface SketchBoardProps {
  onComplete: (data: { buildings: Point[][]; panelZones: Point[][] }) => void;
  targetArea: number;
  activeMode: 'rooftops' | 'panels';
}

export default function SketchBoard({ onComplete, targetArea, activeMode }: SketchBoardProps) {
  const [buildings, setBuildings] = useState<Point[][]>([]);
  const [panelZones, setPanelZones] = useState<Point[][]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allBuildings = [...buildings];
    const allPanelZones = [...panelZones];
    
    // Choose the reference for scaling: Panel zones if drawn, otherwise buildings
    const sourcePolys = allPanelZones.length > 0 ? allPanelZones : allBuildings;
    const totalDrawnArea = sourcePolys.reduce((acc, b) => acc + getPolygonArea(b), 0);
    
    // Match the targetArea (m2)
    const scaleFactor = totalDrawnArea > 0 ? Math.sqrt(targetArea / totalDrawnArea) : 1;
    
    const scalePolygon = (poly: Point[]) => poly.map(p => ({
      x: p.x * scaleFactor,
      y: p.y * scaleFactor
    }));

    onComplete({
      buildings: allBuildings.map(scalePolygon),
      panelZones: allPanelZones.map(scalePolygon)
    });
  }, [buildings, panelZones, targetArea]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickPoint = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };

    if (currentPoints.length >= 3) {
      const firstPoint = currentPoints[0];
      const dist = Math.sqrt(Math.pow(clickPoint.x - firstPoint.x, 2) + Math.pow(clickPoint.y - firstPoint.y, 2));
      
      if (dist < 20) {
        if (activeMode === 'rooftops') {
          setBuildings([...buildings, currentPoints]);
        } else {
          setPanelZones([...panelZones, currentPoints]);
        }
        setCurrentPoints([]);
        return;
      }
    }

    setCurrentPoints([...currentPoints, clickPoint]);
  };

  return (
    <div className="relative w-full h-full bg-[#f8fafc] cursor-crosshair overflow-hidden group" ref={containerRef} onClick={handleClick}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <div className="w-full h-full" style={{ 
          backgroundImage: `
            linear-gradient(#000 2px, transparent 2px),
            linear-gradient(90deg, #000 2px, transparent 2px),
            linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
        }}></div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {buildings.map((b, bIdx) => (
          <g key={`b-${bIdx}`}>
             <polygon
                points={b.map(p => `${p.x + (containerRef.current?.clientWidth || 0) / 2},${p.y + (containerRef.current?.clientHeight || 0) / 2}`).join(' ')}
                fill="rgba(30, 41, 59, 0.05)"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
          </g>
        ))}

        {panelZones.map((z, zIdx) => (
          <g key={`z-${zIdx}`}>
             <polygon
                points={z.map(p => `${p.x + (containerRef.current?.clientWidth || 0) / 2},${p.y + (containerRef.current?.clientHeight || 0) / 2}`).join(' ')}
                fill="rgba(16, 185, 129, 0.1)"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
          </g>
        ))}

        {currentPoints.length > 0 && (
          <g filter="url(#glow)">
            {currentPoints.length > 1 && (
              <polyline
                points={currentPoints.map(p => `${p.x + (containerRef.current?.clientWidth || 0) / 2},${p.y + (containerRef.current?.clientHeight || 0) / 2}`).join(' ')}
                fill={activeMode === 'rooftops' ? "rgba(30, 41, 59, 0.1)" : "rgba(16, 185, 129, 0.15)"}
                stroke={activeMode === 'rooftops' ? "#1e293b" : "#10b981"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {currentPoints.length >= 3 && (
              <text
                x={currentPoints[currentPoints.length - 1].x + (containerRef.current?.clientWidth || 0) / 2 + 10}
                y={currentPoints[currentPoints.length - 1].y + (containerRef.current?.clientHeight || 0) / 2 - 10}
                className="text-[10px] font-black fill-slate-900 pointer-events-none select-none"
              >
                {Math.round(getPolygonArea(currentPoints)).toLocaleString()} SQ
              </text>
            )}
            {currentPoints.length > 2 && (
              <line
                x1={currentPoints[currentPoints.length - 1].x + (containerRef.current?.clientWidth || 0) / 2}
                y1={currentPoints[currentPoints.length - 1].y + (containerRef.current?.clientHeight || 0) / 2}
                x2={currentPoints[0].x + (containerRef.current?.clientWidth || 0) / 2}
                y2={currentPoints[0].y + (containerRef.current?.clientHeight || 0) / 2}
                stroke={activeMode === 'rooftops' ? "#1e293b" : "#10b981"}
                strokeWidth="2"
                strokeDasharray="8 4"
                opacity="0.5"
              />
            )}
            {currentPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x + (containerRef.current?.clientWidth || 0) / 2}
                cy={p.y + (containerRef.current?.clientHeight || 0) / 2}
                r={i === 0 ? "8" : "6"}
                fill={i === 0 ? (activeMode === 'rooftops' ? "#1e293b" : "#10b981") : "#ffffff"}
                stroke={activeMode === 'rooftops' ? "#1e293b" : "#10b981"}
                strokeWidth="2.5"
                className={cn("drop-shadow-md", i === 0 && currentPoints.length >= 3 && "animate-pulse")}
              />
            ))}
          </g>
        )}
      </svg>

      <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none transition-transform group-hover:translate-x-1">
        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">
          {activeMode === 'rooftops' ? 'PHASE 1: ROOFTOP BOUNDARY' : 'PHASE 2: PANEL PLACEMENT'}
        </p>
        <p className="text-xs font-bold text-slate-600">
          {activeMode === 'rooftops' 
            ? 'Define the building shape. Click first point to close.' 
            : 'Draw zones where panels should be placed.'}
        </p>
      </div>

      {(buildings.length > 0 || panelZones.length > 0 || currentPoints.length > 0) && (
         <button 
           onClick={(e) => { e.stopPropagation(); setBuildings([]); setPanelZones([]); setCurrentPoints([]); }}
           className="absolute bottom-6 right-6 px-5 py-2.5 bg-slate-900/10 text-slate-500 hover:bg-red-500 hover:text-white transition-all rounded-xl font-bold uppercase text-[9px] tracking-widest flex items-center gap-2 pointer-events-auto"
         >
           Reset All
         </button>
      )}
    </div>
  );
}
