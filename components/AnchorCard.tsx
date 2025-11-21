import React from 'react';
import { AnchorConfig, AnchorReading } from '../types';
import { Signal, Wifi, Activity, Clock } from 'lucide-react';

interface AnchorCardProps {
  config: AnchorConfig;
  reading?: AnchorReading;
}

export const AnchorCard: React.FC<AnchorCardProps> = ({ config, reading }) => {
  // ESP32 loop delay is 8000ms + Scan time (~4000ms) in original, 
  // but optimized to ~4000ms total. Timeout 30s is safe.
  const timeSinceLast = reading ? Date.now() - reading.timestamp : Infinity;
  const isActive = reading && timeSinceLast < 30000;

  return (
    <div className={`relative overflow-hidden rounded-lg bg-lab-800 border border-lab-700 p-4 transition-all duration-300 ${isActive ? 'shadow-[0_0_15px_rgba(16,185,129,0.1)] border-l-4' : 'opacity-70'}`}
         style={{ borderLeftColor: isActive ? config.color : undefined }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{config.label}</h3>
          <div className="text-xs text-gray-500 mt-0.5">ID: {config.id}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="p-2 rounded-full bg-lab-900">
            <Wifi size={16} color={isActive ? config.color : '#475569'} />
          </div>
          {isActive && (
             <div className="flex items-center text-[10px] text-gray-500 font-mono">
                <Clock size={10} className="mr-1"/>
                {(timeSinceLast / 1000).toFixed(1)}s ago
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <div className="flex items-center space-x-1 text-gray-500 mb-1">
            <Activity size={12} />
            <span className="text-xs">Distance</span>
          </div>
          <div className="text-2xl font-mono font-semibold text-gray-100">
            {reading?.distance.toFixed(0) ?? '--'}
            <span className="text-xs text-gray-500 ml-1">cm</span>
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-1 text-gray-500 mb-1">
            <Signal size={12} />
            <span className="text-xs">RSSI</span>
          </div>
          <div className={`text-2xl font-mono font-semibold ${reading && reading.rssi > -80 ? 'text-emerald-400' : 'text-yellow-500'}`}>
            {reading?.rssi.toFixed(0) ?? '--'}
            <span className="text-xs text-gray-500 ml-1">dBm</span>
          </div>
        </div>
      </div>
      
      {!isActive && (
        <div className="absolute inset-0 bg-lab-900/50 flex items-center justify-center backdrop-blur-[1px]">
          <span className="text-xs text-red-400 font-mono px-2 py-1 bg-red-900/30 rounded border border-red-900">OFFLINE</span>
        </div>
      )}
    </div>
  );
};