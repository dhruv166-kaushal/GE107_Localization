import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter, ReferenceDot } from 'recharts';
import { PositionHistoryPoint } from '../types';
import { FIELD_DIMENSIONS } from '../constants';

interface ChartsProps {
  history: PositionHistoryPoint[];
  distanceHistory: { timestamp: number; [key: string]: number }[];
}

export const DistanceChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-lab-800 rounded-lg p-4 border border-lab-700">
      <h3 className="text-gray-400 text-sm font-bold mb-4 uppercase">Distance Trends (Live)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.slice(-50)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="timestamp" tick={false} stroke="#64748b" />
          <YAxis stroke="#64748b" label={{ value: 'cm', position: 'insideLeft', fill: '#64748b' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Line type="monotone" dataKey="d1" stroke="#3b82f6" dot={false} strokeWidth={2} name="Anchor 1" animationDuration={300} />
          <Line type="monotone" dataKey="d2" stroke="#a855f7" dot={false} strokeWidth={2} name="Anchor 2" animationDuration={300} />
          <Line type="monotone" dataKey="d3" stroke="#f59e0b" dot={false} strokeWidth={2} name="Anchor 3" animationDuration={300} />
          <Line type="monotone" dataKey="d4" stroke="#ef4444" dot={false} strokeWidth={2} name="Anchor 4" animationDuration={300} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PositionScatter: React.FC<{ history: PositionHistoryPoint[] }> = ({ history }) => {
  // Get the very latest point for the "Current" indicator
  const latest = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="h-64 w-full bg-lab-800 rounded-lg p-4 border border-lab-700">
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-gray-400 text-sm font-bold uppercase">Position History</h3>
         <span className="text-[10px] text-gray-500 font-mono">Top-Down (0-200cm)</span>
       </div>
       <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
                type="number" 
                dataKey="x" 
                name="X" 
                domain={[0, FIELD_DIMENSIONS.width]} 
                stroke="#64748b" 
                unit="cm" 
                allowDataOverflow={true} // Clip points outside
                tick={{fontSize: 10}}
            />
            <YAxis 
                type="number" 
                dataKey="y" 
                name="Y" 
                domain={[0, FIELD_DIMENSIONS.height]} 
                stroke="#64748b" 
                unit="cm" 
                allowDataOverflow={true}
                tick={{fontSize: 10}}
            />
            <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} 
                itemStyle={{ color: '#10b981' }}
            />
            
            {/* History Trail: Semi-transparent dots to show density */}
            <Scatter 
                name="History" 
                data={history} 
                fill="#10b981" 
                fillOpacity={0.3} 
                line={false}
                shape="circle"
            />

            {/* Latest Position Indicator */}
            {latest && (
                <ReferenceDot 
                    x={latest.x} 
                    y={latest.y} 
                    r={4} 
                    fill="#ef4444" 
                    stroke="white"
                    isFront={true}
                />
            )}
        </ScatterChart>
       </ResponsiveContainer>
    </div>
  )
}