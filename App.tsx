import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Activity, Database, Play, Download, Settings, RefreshCw, Server } from 'lucide-react';
import { ANCHORS, FIELD_DIMENSIONS, SUPABASE_URL, SUPABASE_TABLE, SUPABASE_ANON_KEY } from './constants';
import { AnchorReading, Coordinate, PositionHistoryPoint, LocalizationResult } from './types';
import { calculatePosition } from './utils/trilateration';
import { generateMockReadings } from './services/mockData';
import { AnchorCard } from './components/AnchorCard';
import { MapVisualization } from './components/MapVisualization';
import { DistanceChart, PositionScatter } from './components/Charts';

const STORAGE_KEY_SUPABASE = 'uwb_dashboard_key';

const App = () => {
  // State
  const [readings, setReadings] = useState<Record<string, AnchorReading>>({});
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [positionError, setPositionError] = useState<number>(0); // Error in cm
  const [serverPosition, setServerPosition] = useState<Coordinate | null>(null); // From localization_results table
  const [history, setHistory] = useState<PositionHistoryPoint[]>([]);
  const [distanceHistory, setDistanceHistory] = useState<any[]>([]);
  
  // Default to false for demo mode to try connecting immediately with the provided key
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  
  // Use the hardcoded key from constants as default if not in storage
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem(STORAGE_KEY_SUPABASE) || SUPABASE_ANON_KEY);
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Refs for Supabase cleanup
  const supabaseRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);
  const resultsSubscriptionRef = useRef<any>(null);
  const demoIntervalRef = useRef<any>(null);

  // Initialize Supabase Connection
  const connectSupabase = async () => {
    if (!apiKey) return;
    
    try {
      const client = createClient(SUPABASE_URL, apiKey);
      supabaseRef.current = client;

      // Test connection
      const { error } = await client.from(SUPABASE_TABLE).select('id').limit(1);
      if (error) throw error;

      setIsConnected(true);
      setErrorMsg(null);
      localStorage.setItem(STORAGE_KEY_SUPABASE, apiKey);

      // 1. Subscribe to Anchor Readings (For Client Side Visualization)
      const readingChannel = client
        .channel('schema-db-changes-readings')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: SUPABASE_TABLE, // anchor_readings
          },
          (payload) => {
            const newReading = payload.new as any;
            
            // Handle ESP32 data format:
            // ESP32 sends distance_cm (e.g., 150.5). We use cm directly now.
            let distanceCm = 0;
            if (newReading.distance_cm !== undefined && newReading.distance_cm !== null) {
                distanceCm = Number(newReading.distance_cm);
            } else if (newReading.distance !== undefined) {
                // If generic distance was sent in meters, convert to cm
                distanceCm = Number(newReading.distance) * 100;
            }

            const rssiVal = Number(newReading.rssi);

            const reading: AnchorReading = {
                anchorId: String(newReading.anchor_id),
                distance: distanceCm,
                rssi: rssiVal,
                timestamp: Date.now()
            };
            handleNewReading(reading);
          }
        )
        .subscribe();

      subscriptionRef.current = readingChannel;

      // 2. Subscribe to Localization Results (For Server Side Confirmation)
      const resultsChannel = client
        .channel('schema-db-changes-results')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'localization_results', 
          },
          (payload) => {
             const res = payload.new as any;
             if (res.est_x !== undefined && res.est_y !== undefined) {
                 setServerPosition({ x: Number(res.est_x), y: Number(res.est_y) });
             }
          }
        )
        .subscribe();
        
      resultsSubscriptionRef.current = resultsChannel;

    } catch (err: any) {
      console.error("Supabase Error:", err);
      setIsConnected(false);
      setErrorMsg(err.message || "Connection failed");
    }
  };

  const handleNewReading = (reading: AnchorReading) => {
    setReadings(prev => {
        const next = { ...prev, [reading.anchorId]: reading };
        
        // Perform trilateration on client side for smoother map updates
        const rawRes = calculatePosition(next);
        
        // Low Pass Filter (Smoothing)
        const alpha = 0.15;

        if (rawRes) {
            setPosition(prevPos => {
                if (!prevPos) return rawRes;
                return {
                    x: prevPos.x + alpha * (rawRes.x - prevPos.x),
                    y: prevPos.y + alpha * (rawRes.y - prevPos.y)
                };
            });
            
            // Update Error Metric (Smoothed slightly)
            setPositionError(prevErr => prevErr + 0.1 * (rawRes.error - prevErr));

            setHistory(h => {
                const updated = [...h, { x: rawRes.x, y: rawRes.y, timestamp: Date.now() }];
                return updated.slice(-100); 
            });
        }
        
        // Update Distance History for charts
        setDistanceHistory(h => {
            const point = {
                timestamp: Date.now(),
                d1: next["1"]?.distance,
                d2: next["2"]?.distance,
                d3: next["3"]?.distance,
                d4: next["4"]?.distance,
            };
            return [...h, point].slice(-50);
        });

        return next;
    });
  };

  // Effect to handle Modes
  useEffect(() => {
    if (isDemoMode) {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      if (resultsSubscriptionRef.current) resultsSubscriptionRef.current.unsubscribe();
      setIsConnected(false);
      
      demoIntervalRef.current = setInterval(() => {
        const mockData = generateMockReadings();
        Object.values(mockData).forEach(r => handleNewReading(r));
      }, 200); 
    } else {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (apiKey) connectSupabase();
    }

    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      if (resultsSubscriptionRef.current) resultsSubscriptionRef.current.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]); 

  const toggleMode = () => {
     setIsDemoMode(!isDemoMode);
  };

  const exportData = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "timestamp,x,y\n"
        + history.map(row => `${row.timestamp},${row.x},${row.y}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "uwb_tracking_data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-lab-900 text-slate-200 p-4 md:p-6 font-sans flex flex-col">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-lab-700 pb-4">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="p-2 bg-lab-accent rounded shadow-[0_0_15px_rgba(16,185,129,0.4)]">
             <Activity className="text-lab-900" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">GE107 Localization </h1>
            <p className="text-xs text-slate-400 font-mono">ESP32 TRILATERATION SYSTEM v1.0</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-lab-800 p-2 rounded-lg border border-lab-700">
           {/* Connection Status */}
           <div className="flex items-center px-3 border-r border-lab-700">
              <div className={`w-2 h-2 rounded-full mr-2 ${isDemoMode ? 'bg-blue-400 animate-pulse' : (isConnected ? 'bg-emerald-500' : 'bg-red-500')}`}></div>
              <span className="text-xs font-mono uppercase">
                  {isDemoMode ? 'SIMULATION MODE' : (isConnected ? 'LIVE DATA FEED' : 'DISCONNECTED')}
              </span>
           </div>

           <button onClick={toggleMode} className="flex items-center space-x-1 hover:text-white transition-colors text-xs font-bold uppercase px-2">
              {isDemoMode ? <Database size={14} /> : <Play size={14} />}
              <span>{isDemoMode ? 'Connect Live' : 'Demo Mode'}</span>
           </button>
           
           <button onClick={exportData} className="p-2 hover:bg-lab-700 rounded transition-colors" title="Export CSV">
              <Download size={18} />
           </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* Left Col: Visualization (8 cols) */}
        <section className="lg:col-span-8 flex flex-col space-y-6">
            <div className="h-[500px] w-full relative group">
                <MapVisualization position={position} readings={readings} error={positionError} />
                <div className="absolute top-4 right-4 bg-lab-900/80 backdrop-blur p-2 rounded border border-lab-700 text-xs font-mono space-y-1 pointer-events-none">
                    <div className="text-gray-400">ESTIMATED POS (CLIENT)</div>
                    <div className="text-xl font-bold text-white">
                        X: {position?.x.toFixed(0) ?? '--'} cm
                    </div>
                    <div className="text-xl font-bold text-white">
                        Y: {position?.y.toFixed(0) ?? '--'} cm
                    </div>
                    <div className={`text-xs font-bold ${positionError > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                       ± {positionError.toFixed(1)} cm (Confidence)
                    </div>
                </div>
            </div>

            {/* Bottom Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DistanceChart data={distanceHistory} />
                <PositionScatter history={history} />
            </div>
        </section>

        {/* Right Col: Anchors & Config (4 cols) */}
        <section className="lg:col-span-4 flex flex-col space-y-4">
            
            {/* Manual Key Override (Hidden if connected or Demo) */}
            {!isDemoMode && !isConnected && (
                <div className="bg-lab-800 p-4 rounded border border-red-900/50 mb-4 animate-fade-in">
                    <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                        <Settings size={14} /> Connection Status
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                        Attempting to connect to {SUPABASE_URL}...
                    </p>
                    <div className="mb-2">
                         <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Supabase Key"
                            className="w-full bg-lab-900 border border-lab-700 rounded p-2 text-xs font-mono focus:border-lab-accent focus:outline-none"
                        />
                    </div>
                    <button 
                        onClick={connectSupabase}
                        className="w-full bg-lab-700 hover:bg-lab-600 text-white py-2 rounded text-xs font-bold transition-colors flex justify-center items-center gap-2"
                    >
                       <RefreshCw size={12} /> Retry Connection
                    </button>
                    {errorMsg && (
                        <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-900 text-xs text-red-400 break-all">
                            {errorMsg}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between text-gray-400 uppercase text-xs font-bold tracking-wider px-1">
                <span>Active Anchors</span>
                <span>{Object.values(readings).filter((r: AnchorReading) => (Date.now() - r.timestamp) < 30000).length}/4 Online</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {ANCHORS.map(anchor => (
                    <AnchorCard 
                        key={anchor.id} 
                        config={anchor} 
                        reading={readings[anchor.id]} 
                    />
                ))}
            </div>

            {/* System Info */}
            <div className="mt-auto bg-lab-800 rounded-lg p-4 border border-lab-700 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase">System Status</h4>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Client Math</span>
                    <span className="text-emerald-400">Active</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Hardware Loop</span>
                    <span className="text-gray-200">~4 sec (Scan + Post)</span>
                </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Last Sync</span>
                    <span className="text-gray-200">
                        {Object.values(readings).length > 0 
                         ? new Date(Math.max(...Object.values(readings).map((r: AnchorReading) => r.timestamp))).toLocaleTimeString() 
                         : '--:--:--'}
                    </span>
                </div>
                
                <div className="pt-2 border-t border-lab-700 mt-2">
                   <div className="flex items-center gap-2 mb-1">
                      <Server size={12} className="text-purple-400"/>
                      <h5 className="text-xs font-bold text-purple-400 uppercase">DB Localization Result</h5>
                   </div>
                   <div className="flex justify-between text-xs font-mono bg-lab-900 p-2 rounded border border-lab-700">
                      <span className="text-gray-400">ESP32 Calc:</span>
                      <span className="text-white">
                        {serverPosition ? `X:${serverPosition.x.toFixed(0)} Y:${serverPosition.y.toFixed(0)}` : 'Waiting...'}
                      </span>
                   </div>
                </div>
            </div>
        </section>
      </main>

      {/* Footer Team Info */}
      <footer className="mt-8 border-t border-lab-700 pt-6 pb-2 text-center animate-fade-in-up">
          <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-3 tracking-widest">Project Team</h3>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-gray-400 font-mono">
              <div className="flex flex-col items-center">
                  <span className="text-gray-300">Ch Purandhar Sai</span>
                  <span className="text-[10px] text-gray-600">2024CHB1062</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-gray-300">Dhruv Kaushal</span>
                  <span className="text-[10px] text-gray-600">2024CHB1066</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-gray-300">Durga Tejaswi</span>
                  <span className="text-[10px] text-gray-600">2024CHB1067</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-gray-300">Minaksh Sharma</span>
                  <span className="text-[10px] text-gray-600">2024CHB1072</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-gray-300">Sunitha</span>
                  <span className="text-[10px] text-gray-600">2024CHB1086</span>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default App;