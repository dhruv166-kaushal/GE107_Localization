import React, { useMemo } from 'react';
import { ANCHORS, FIELD_DIMENSIONS } from '../constants';
import { Coordinate, AnchorReading } from '../types';

interface MapVisualizationProps {
  position: Coordinate | null;
  readings: Record<string, AnchorReading>;
  error?: number;
}

export const MapVisualization: React.FC<MapVisualizationProps> = ({ position, readings, error }) => {
  // SVG ViewBox setup
  const padding = 20;
  // Field is 200cm x 200cm.
  // We want same visual size (approx 400px).
  // Scale = 2 means 200cm * 2 = 400px.
  const scale = 2; 
  const width = FIELD_DIMENSIONS.width * scale + padding * 2;
  const height = FIELD_DIMENSIONS.height * scale + padding * 2;

  // Helper to convert CM to pixels
  const toPx = (cm: number) => cm * scale + padding;
  // Invert Y for SVG (0 is top)
  const toPy = (cm: number) => (FIELD_DIMENSIONS.height - cm) * scale + padding;

  const gridLines = useMemo(() => {
    const lines = [];
    // Vertical lines every 20cm
    for (let i = 0; i <= FIELD_DIMENSIONS.width; i+=20) {
      lines.push(
        <line key={`v-${i}`} 
              x1={toPx(i)} y1={toPy(0)} 
              x2={toPx(i)} y2={toPy(FIELD_DIMENSIONS.height)} 
              stroke="#334155" strokeWidth={i % 100 === 0 ? "1.5" : "0.5"} strokeDasharray={i % 100 === 0 ? undefined : "4 4"} />
      );
    }
    // Horizontal lines every 20cm
    for (let i = 0; i <= FIELD_DIMENSIONS.height; i+=20) {
      lines.push(
        <line key={`h-${i}`} 
              x1={toPx(0)} y1={toPy(i)} 
              x2={toPx(FIELD_DIMENSIONS.width)} y2={toPy(i)} 
              stroke="#334155" strokeWidth={i % 100 === 0 ? "1.5" : "0.5"} strokeDasharray={i % 100 === 0 ? undefined : "4 4"} />
      );
    }
    return lines;
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-lab-900 rounded-xl border border-lab-700 p-4 shadow-inner relative overflow-hidden">
        {/* Grid Background Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9),rgba(15,23,42,0.9)),url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>

      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="max-h-[500px]">
        {/* Field Boundary */}
        <rect 
          x={padding} 
          y={padding} 
          width={FIELD_DIMENSIONS.width * scale} 
          height={FIELD_DIMENSIONS.height * scale} 
          fill="#1e293b" 
          stroke="#475569" 
          strokeWidth="2"
        />

        {/* Grid Lines */}
        {gridLines}

        {/* Distance Radii Circles (Visual Aid) */}
        {ANCHORS.map(anchor => {
            const reading = readings[anchor.id];
            if (!reading) return null;
            return (
                <circle 
                    key={`rad-${anchor.id}`}
                    cx={toPx(anchor.position.x)}
                    cy={toPy(anchor.position.y)}
                    r={reading.distance * scale}
                    fill="none"
                    stroke={anchor.color}
                    strokeWidth="1"
                    strokeOpacity="0.2"
                />
            )
        })}

        {/* Anchors */}
        {ANCHORS.map(anchor => (
          <g key={anchor.id}>
             <circle 
              cx={toPx(anchor.position.x)} 
              cy={toPy(anchor.position.y)} 
              r="8" 
              fill={anchor.color}
              stroke="#fff"
              strokeWidth="2"
            />
            <text 
                x={toPx(anchor.position.x)} 
                y={toPy(anchor.position.y) + (anchor.position.y === 0 ? 25 : -15)}
                textAnchor="middle"
                fill={anchor.color}
                fontSize="12"
                fontWeight="bold"
                className="select-none"
            >
                {anchor.id}
            </text>
          </g>
        ))}

        {/* Tag Position */}
        {position && (
            <g className="transition-all duration-300 ease-linear" style={{ transformBox: 'fill-box' }}>
                {/* Confidence Halo (Error Margin) */}
                {error && error > 0 && (
                    <circle 
                        cx={toPx(position.x)} 
                        cy={toPy(position.y)} 
                        r={error * scale} 
                        fill="#10b981" 
                        fillOpacity="0.1"
                        stroke="#10b981"
                        strokeWidth="1"
                        strokeOpacity="0.3"
                        strokeDasharray="4 2"
                        className="transition-all duration-500 ease-in-out"
                    />
                )}

                {/* Ping Effect */}
                <circle 
                    cx={toPx(position.x)} 
                    cy={toPy(position.y)} 
                    r="20" 
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    className="animate-ping opacity-75"
                />
                {/* Solid Dot */}
                <circle 
                    cx={toPx(position.x)} 
                    cy={toPy(position.y)} 
                    r="6" 
                    fill="#10b981" 
                    stroke="#fff" 
                    strokeWidth="2" 
                />
                {/* Triangulation Rays */}
                {ANCHORS.map(anchor => (
                    <line 
                        key={`ray-${anchor.id}`}
                        x1={toPx(anchor.position.x)}
                        y1={toPy(anchor.position.y)}
                        x2={toPx(position.x)}
                        y2={toPy(position.y)}
                        stroke={anchor.color}
                        strokeWidth="1"
                        strokeOpacity="0.3"
                        strokeDasharray="3 3"
                    />
                ))}
                <text 
                    x={toPx(position.x)} 
                    y={toPy(position.y) - 15}
                    textAnchor="middle"
                    fill="#10b981"
                    fontSize="12"
                    className="font-mono font-bold select-none"
                >
                    TAG ({position.x.toFixed(0)}, {position.y.toFixed(0)})
                </text>
                {error && (
                    <text
                        x={toPx(position.x)}
                        y={toPy(position.y) + 25}
                        textAnchor="middle"
                        fill={error > 50 ? "#ef4444" : "#10b981"}
                        fontSize="10"
                        className="font-mono"
                    >
                        ±{error.toFixed(0)}cm
                    </text>
                )}
            </g>
        )}
      </svg>
      
      {!position && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-lab-900/80 p-4 rounded border border-lab-700 backdrop-blur-sm">
            <span className="text-gray-400 animate-pulse">Waiting for triangulation...</span>
        </div>
      )}
    </div>
  );
};