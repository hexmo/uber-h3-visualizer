import React, { useMemo } from 'react';
import { 
  Settings, Info, Layers, BarChart3, Fingerprint, 
  MapPin, X, Maximize2, Trash2, Users, 
  ArrowUpCircle, ArrowDownCircle, Network, Scale
} from 'lucide-react';
import { AppSettings, H3Hexagon } from '../types';

interface SidebarProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  hexCount: number;
  selectedHexes: Map<string, H3Hexagon>;
  clearSelection: () => void;
  removeHex: (id: string) => void;
  selectNeighbors: (id: string) => void;
  upSample: (id: string) => void;
  downSample: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  settings, 
  setSettings, 
  hexCount,
  selectedHexes,
  clearSelection,
  removeHex,
  selectNeighbors,
  upSample,
  downSample
}) => {
  const resolutions = Array.from({ length: 13 }, (_, i) => i);
  const selectedCount = selectedHexes.size;
  
  const aggregateStats = useMemo(() => {
    let totalKm2 = 0;
    let totalM2 = 0;
    selectedHexes.forEach(hex => {
      totalKm2 += hex.areaKm2;
      totalM2 += hex.areaM2;
    });
    return { totalKm2, totalM2 };
  }, [selectedHexes]);

  const renderSingleInspector = (hex: H3Hexagon) => (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block mb-1">Index ID</label>
        <div className="font-mono text-sm text-indigo-900 break-all select-all selection:bg-indigo-200">{hex.id}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block mb-1">Resolution</label>
          <div className="text-sm font-semibold text-slate-700">Level {hex.resolution}</div>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block mb-1">Center Coords</label>
          <div className="text-sm font-semibold text-slate-700 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            {hex.center[0].toFixed(4)}, {hex.center[1].toFixed(4)}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-indigo-100/50 space-y-3">
        <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block">Spatial Actions</label>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => selectNeighbors(hex.id)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Select 1-Ring Neighbors</span>
            <Network className="w-3 h-3 opacity-50" />
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => upSample(hex.id)}
              disabled={hex.resolution === 0}
              className="flex items-center justify-center gap-2 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-white transition-all"
              title="Select Parent (Lower Res)"
            >
              <ArrowUpCircle className="w-4 h-4" /> Up-Sample
            </button>
            <button 
              onClick={() => downSample(hex.id)}
              disabled={hex.resolution === 15}
              className="flex items-center justify-center gap-2 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-white transition-all"
              title="Select Children (Higher Res)"
            >
              <ArrowDownCircle className="w-4 h-4" /> Down-Sample
            </button>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-indigo-100/50">
        <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block mb-2">Cell Dimensions</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-white rounded shadow-sm border border-indigo-50">
              <Maximize2 className="w-3 h-3 text-indigo-500" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Area (km²)</div>
              <div className="text-xs font-mono font-semibold text-slate-700">{hex.areaKm2.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-white rounded shadow-sm border border-indigo-50">
              <Maximize2 className="w-3 h-3 text-indigo-500" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Area (m²)</div>
              <div className="text-xs font-mono font-semibold text-slate-700">{hex.areaM2.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMultiInspector = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-md relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
        <div className="text-[10px] uppercase font-bold opacity-70 tracking-widest mb-3 relative">Aggregate Metrics</div>
        <div className="grid grid-cols-2 gap-4 relative">
          <div>
            <div className="text-[10px] font-bold uppercase opacity-60">Total Area (km²)</div>
            <div className="text-lg font-mono font-bold leading-tight">{aggregateStats.totalKm2.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase opacity-60">Avg. Resolution</div>
            <div className="text-lg font-mono font-bold leading-tight">L-{settings.resolution}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-1">Selected Indices ({selectedCount})</label>
        {Array.from(selectedHexes.values()).reverse().map(hex => (
          <div key={hex.id} className="group flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg hover:border-indigo-300 transition-colors">
            <div className="font-mono text-[10px] text-slate-600 truncate">{hex.id}</div>
            <button 
              onClick={() => removeHex(hex.id)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded text-slate-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full lg:w-96 h-full bg-white border-r border-slate-200 flex flex-col shadow-sm overflow-y-auto">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-600">
          <Layers className="w-8 h-8" />
          HexaGlobe <span className="text-slate-400 font-light text-sm">H3</span>
        </h1>
        <p className="text-slate-500 text-xs mt-1">Hierarchical Hexagonal Grid System</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* Cell Inspector */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase text-xs tracking-wider">
              <Fingerprint className="w-4 h-4" /> {selectedCount > 1 ? `Multi-Cell Inspector (${selectedCount})` : 'Cell Inspector'}
            </div>
            {selectedCount > 0 && (
              <button 
                onClick={clearSelection}
                className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear All <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {selectedCount === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center">
              <Fingerprint className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">Click cells on the map to select multiple indices and analyze spatial coverage.</p>
            </div>
          ) : selectedCount === 1 ? (
            renderSingleInspector(Array.from(selectedHexes.values())[0])
          ) : (
            renderMultiInspector()
          )}
        </section>

        {/* Controls */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-slate-500 font-semibold uppercase text-xs tracking-wider">
            <Settings className="w-4 h-4" /> Grid Configuration
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-700">Resolution Level</label>
                <span className="text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded text-xs">Lvl {settings.resolution}</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1.5">
                {resolutions.map((res) => (
                  <button
                    key={res}
                    onClick={() => {
                      setSettings({...settings, resolution: res, autoScale: false});
                      clearSelection();
                    }}
                    className={`
                      h-8 text-xs font-mono rounded-md transition-all
                      ${settings.resolution === res 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-1' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}
                    `}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
               <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700">Auto-scale Resolution</label>
                  <span className="text-[10px] text-slate-400">Match res to zoom level</span>
                </div>
                <button 
                  onClick={() => setSettings({...settings, autoScale: !settings.autoScale})}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.autoScale ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.autoScale ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700">Auto-update View</label>
                  <span className="text-[10px] text-slate-400">Refresh on pan/zoom</span>
                </div>
                <button 
                  onClick={() => setSettings({...settings, autoUpdate: !settings.autoUpdate})}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.autoUpdate ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.autoUpdate ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-slate-400 font-semibold text-xs tracking-wider">
            <BarChart3 className="w-4 h-4" /> Grid Metrics
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold text-slate-900">{hexCount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 uppercase font-medium tracking-tight">Active Cells</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-indigo-600 font-bold">L-{settings.resolution}</div>
              <div className="text-[10px] text-slate-500 uppercase font-medium tracking-tight">Scale</div>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 text-[10px] text-slate-400 border-t border-slate-100 flex justify-between bg-slate-50/30">
        <span className="font-medium uppercase tracking-tight">H3 Multi-Explorer V2.5</span>
        <span className="flex items-center gap-1 hover:text-slate-600 cursor-pointer"><Info className="w-3 h-3" /> Help</span>
      </div>
    </div>
  );
};

export default Sidebar;