import React, { useState, useRef, useEffect, memo } from 'react';
import { Point, getPolygonArea } from '../utils/geometry';
import { cn } from '../lib/utils';
import { RotateCcw, Check, Undo2, HelpCircle } from 'lucide-react';

interface SketchBoardProps {
  onComplete: (data: { buildings: Point[][]; panelZones: Point[][] }) => void;
  targetArea: number;
  activeMode: 'rooftops' | 'panels';
}

function SketchBoardBase({ onComplete, targetArea, activeMode }: SketchBoardProps) {
  const [buildings, setBuildings] = useState<Point[][]>([]);
  const [panelZones, setPanelZones] = useState<Point[][]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [showHelperMsg, setShowHelperMsg] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive stage sizing using ResizeObserver (Guidelines compliant)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const allBuildings = [...buildings];
    const allPanelZones = [...panelZones];
    
    const sourcePolys = allPanelZones.length > 0 ? allPanelZones : allBuildings;
    const totalDrawnArea = sourcePolys.reduce((acc, b) => acc + getPolygonArea(b), 0);
    
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
      
      // Dynamic closure distance: larger on mobile screens/touch interface to avoid finger fatiguing
      const closureDistance = window.matchMedia("(max-width: 768px)").matches ? 35 : 20;
      
      if (dist < closureDistance) {
        completeCurrentShape();
        return;
      }
    }

    setCurrentPoints([...currentPoints, clickPoint]);
  };

  const completeCurrentShape = () => {
    if (currentPoints.length < 3) return;
    if (activeMode === 'rooftops') {
      setBuildings([...buildings, currentPoints]);
    } else {
      setPanelZones([...panelZones, currentPoints]);
    }
    setCurrentPoints([]);
  };

  const undoLastAction = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints(currentPoints.slice(0, -1));
    } else if (activeMode === 'panels' && panelZones.length > 0) {
      setPanelZones(panelZones.slice(0, -1));
    } else if (buildings.length > 0) {
      setBuildings(buildings.slice(0, -1));
    }
  };

  const clearAll = () => {
    setBuildings([]);
    setPanelZones([]);
    setCurrentPoints([]);
  };

  return (
    <div 
      className="relative w-full h-full bg-[#f8fafc] cursor-crosshair overflow-hidden touch-none select-none" 
      ref={containerRef} 
      onClick={handleClick}
    >
      {/* Grid Pattern */}
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
                points={b.map(p => `${p.x + dimensions.width / 2},${p.y + dimensions.height / 2}`).join(' ')}
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
                points={z.map(p => `${p.x + dimensions.width / 2},${p.y + dimensions.height / 2}`).join(' ')}
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
                points={currentPoints.map(p => `${p.x + dimensions.width / 2},${p.y + dimensions.height / 2}`).join(' ')}
                fill={activeMode === 'rooftops' ? "rgba(30, 41, 59, 0.1)" : "rgba(16, 185, 129, 0.15)"}
                stroke={activeMode === 'rooftops' ? "#1e293b" : "#10b981"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {currentPoints.length >= 3 && (
              <text
                x={currentPoints[currentPoints.length - 1].x + dimensions.width / 2 + 10}
                y={currentPoints[currentPoints.length - 1].y + dimensions.height / 2 - 10}
                className="text-xs font-black fill-slate-950 bg-white px-2 py-1 rounded shadow-md pointer-events-none select-none"
              >
                {Math.round(getPolygonArea(currentPoints)).toLocaleString()} SQ
              </text>
            )}
            {currentPoints.length > 2 && (
              <line
                x1={currentPoints[currentPoints.length - 1].x + dimensions.width / 2}
                y1={currentPoints[currentPoints.length - 1].y + dimensions.height / 2}
                x2={currentPoints[0].x + dimensions.width / 2}
                y2={currentPoints[0].y + dimensions.height / 2}
                stroke={activeMode === 'rooftops' ? "#1e293b" : "#10b981"}
                strokeWidth="2"
                strokeDasharray="8 4"
                opacity="0.5"
              />
            )}
            {currentPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x + dimensions.width / 2}
                cy={p.y + dimensions.height / 2}
                r={i === 0 ? "10" : "7"}
                fill={i === 0 ? (activeMode === 'rooftops' ? "#1e293b" : "#10b981") : "#ffffff"}
                stroke={activeMode === 'rooftops' ? "#1e293b" : "#10b981"}
                strokeWidth="2.5"
                className={cn("drop-shadow-md", i === 0 && currentPoints.length >= 3 && "animate-pulse")}
              />
            ))}
          </g>
        )}
      </svg>

      {/* Floating Header Instructions */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto pointer-events-none flex flex-col gap-1 bg-white/90 sm:bg-transparent p-3 sm:p-0 rounded-2xl shadow-sm sm:shadow-none border border-slate-100 sm:border-none backdrop-blur-sm sm:backdrop-blur-none">
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em]">
          {activeMode === 'rooftops' ? 'PHASE 1: ROOFTOP BOUNDARY' : 'PHASE 2: PANEL PLACEMENT'}
        </p>
        <p className="text-xs font-bold text-slate-700 leading-normal">
          {activeMode === 'rooftops' 
            ? 'Tap or click to sketch building boundaries. Close the loop to save.' 
            : 'Tap or click to sketch placement zones inside the roof.'}
        </p>
      </div>

      {/* Touch-Friendly Action Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-between items-center gap-2 pointer-events-auto">
        <div className="flex gap-2">
          {(buildings.length > 0 || panelZones.length > 0 || currentPoints.length > 0) && (
            <button 
              onClick={(e) => { e.stopPropagation(); undoLastAction(); }}
              className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-95 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm min-h-[44px] touch-manipulation"
              title="Undo last point or shape"
            >
              <Undo2 className="w-4 h-4 text-slate-500" />
              <span>Undo</span>
            </button>
          )}

          {(buildings.length > 0 || panelZones.length > 0 || currentPoints.length > 0) && (
            <button 
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="px-4 py-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 active:scale-95 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm min-h-[44px] touch-manipulation"
            >
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {currentPoints.length >= 3 && (
          <button 
            onClick={(e) => { e.stopPropagation(); completeCurrentShape(); }}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all min-h-[44px] touch-manipulation"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Complete Loop</span>
          </button>
        )}
      </div>
    </div>
  );
}

const SketchBoard = memo(SketchBoardBase);
export default SketchBoard;
