import React, { useState, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import H3Map from './components/H3Map';
import { AppSettings, H3Hexagon } from './types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    resolution: 6,
    showLabels: false,
    colorScheme: 'density',
    autoUpdate: true
  });

  const [hexCount, setHexCount] = useState(0);
  const [currentPos, setCurrentPos] = useState({ lat: 27.7172, lng: 85.3240 });
  const [selectedHexes, setSelectedHexes] = useState<Map<string, H3Hexagon>>(new Map());

  const handlePositionChange = useCallback((lat: number, lng: number) => {
    setCurrentPos({ lat, lng });
  }, []);

  const handleHexSelect = useCallback((hex: H3Hexagon) => {
    setSelectedHexes(prev => {
      const next = new Map(prev);
      if (next.has(hex.id)) {
        next.delete(hex.id);
      } else {
        next.set(hex.id, hex);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedHexes(new Map());
  }, []);

  const removeHex = useCallback((id: string) => {
    setSelectedHexes(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const selectedIds = useMemo(() => new Set(selectedHexes.keys()), [selectedHexes]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-50">
      <Sidebar 
        settings={settings}
        setSettings={setSettings}
        hexCount={hexCount}
        selectedHexes={selectedHexes}
        clearSelection={clearSelection}
        removeHex={removeHex}
      />
      <main className="flex-1 relative overflow-hidden">
        <H3Map 
          settings={settings} 
          setSettings={setSettings}
          onHexCountChange={setHexCount}
          onPositionChange={handlePositionChange}
          selectedHexIds={selectedIds}
          onHexSelect={handleHexSelect}
        />
        
        {/* Floating Indicator */}
        <div className="absolute top-6 left-6 z-[1000] hidden md:block">
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
            <div className="text-[11px] font-semibold text-slate-600">
              <span className="text-slate-400 font-mono">LAT:</span> {currentPos.lat.toFixed(4)}
              <span className="mx-2 text-slate-200">|</span>
              <span className="text-slate-400 font-mono">LNG:</span> {currentPos.lng.toFixed(4)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;