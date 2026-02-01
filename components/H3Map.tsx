import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents } from 'react-leaflet';
import * as h3 from 'h3-js';
import { RefreshCw, LocateFixed, Loader2 } from 'lucide-react';
import { H3Hexagon, AppSettings } from '../types';

// Map Zoom to H3 Resolution mapping table
const getAutoResolution = (zoom: number): number => {
  if (zoom <= 2) return 0;
  if (zoom <= 4) return 1;
  if (zoom <= 5) return 2;
  if (zoom <= 6) return 3;
  if (zoom <= 7) return 4;
  if (zoom <= 9) return 5;
  if (zoom <= 11) return 6;
  if (zoom <= 13) return 7;
  if (zoom <= 14) return 8;
  if (zoom <= 15) return 9;
  if (zoom <= 16) return 10;
  if (zoom <= 17) return 11;
  if (zoom <= 18) return 12;
  return 13;
};

// Component to handle map instance operations
const MapController: React.FC<{ 
  onBoundsChange: (bounds: any) => void; 
  autoUpdate: boolean;
  autoScale: boolean;
  resolution: number;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}> = ({ onBoundsChange, autoUpdate, autoScale, resolution, setSettings }) => {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      if (autoUpdate) onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      if (autoScale) {
        const newRes = getAutoResolution(map.getZoom());
        if (newRes !== resolution) {
          setSettings(prev => ({ ...prev, resolution: newRes }));
        }
      }
      onBoundsChange(map.getBounds());
    }
  });

  return null;
};

const getHexagonsInBounds = (bounds: any, resolution: number): H3Hexagon[] => {
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();

  try {
    const polygon = [
      [southWest.lat, southWest.lng],
      [northEast.lat, southWest.lng],
      [northEast.lat, northEast.lng],
      [southWest.lat, northEast.lng],
      [southWest.lat, southWest.lng]
    ];
    
    const hexIds = h3.polygonToCells(polygon as any, resolution);
    // Increased limit to 15,000 for Canvas performance
    const limitedHexIds = hexIds.length > 15000 ? hexIds.slice(0, 15000) : hexIds;

    return limitedHexIds.map(id => {
      const boundary = h3.cellToBoundary(id);
      const center = h3.cellToLatLng(id);
      return {
        id,
        boundary: boundary.map(p => [p[0], p[1]]),
        center: [center[0], center[1]],
        resolution,
        areaKm2: h3.cellArea(id, h3.UNITS.km2),
        areaM2: h3.cellArea(id, h3.UNITS.m2)
      };
    });
  } catch (e) {
    console.error("H3 Calc Error:", e);
    return [];
  }
};

interface H3MapProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onHexCountChange: (count: number) => void;
  onPositionChange: (lat: number, lng: number) => void;
  selectedHexIds: Set<string>;
  onHexSelect: (hex: H3Hexagon) => void;
}

const H3Map: React.FC<H3MapProps> = ({ 
  settings, 
  setSettings, 
  onHexCountChange, 
  onPositionChange,
  selectedHexIds,
  onHexSelect
}) => {
  const [hexagons, setHexagons] = useState<H3Hexagon[]>([]);
  const [currentBounds, setCurrentBounds] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<any>(null);
  const hasInitialFlied = useRef(false);

  const updateHexagons = useCallback((bounds: any) => {
    if (!bounds) return;
    const hexes = getHexagonsInBounds(bounds, settings.resolution);
    setHexagons(hexes);
    onHexCountChange(hexes.length);
    const center = bounds.getCenter();
    onPositionChange(center.lat, center.lng);
  }, [settings.resolution, onHexCountChange, onPositionChange]);

  useEffect(() => {
    if (currentBounds) {
      updateHexagons(currentBounds);
    }
  }, [settings.resolution, currentBounds, updateHexagons]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSettings(prev => ({ ...prev, resolution: 8, autoScale: true }));
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14, {
            duration: 1.5,
            easeLinearity: 0.25
          });
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Hierarchy Overlays
  const hierarchyLayers = useMemo(() => {
    const parentOutlines: any[] = [];
    const childrenSubdivisions: any[] = [];

    selectedHexIds.forEach(id => {
      const res = h3.getResolution(id);
      
      if (res > 0) {
        const parentId = h3.cellToParent(id, res - 1);
        const boundary = h3.cellToBoundary(parentId).map(p => [p[0], p[1]] as [number, number]);
        parentOutlines.push(
          <Polygon
            key={`parent-${id}`}
            positions={boundary}
            interactive={false}
            pathOptions={{
              color: '#4f46e5',
              weight: 4,
              dashArray: '10, 15',
              fillOpacity: 0,
              opacity: 0.15,
              className: 'pointer-events-none'
            }}
          />
        );
      }

      if (res < 15) {
        const children = h3.cellToChildren(id, res + 1);
        children.forEach(cId => {
          const boundary = h3.cellToBoundary(cId).map(p => [p[0], p[1]] as [number, number]);
          childrenSubdivisions.push(
            <Polygon
              key={`child-${cId}`}
              positions={boundary}
              interactive={false}
              pathOptions={{
                color: '#64748b',
                weight: 0.8,
                fillOpacity: 0,
                opacity: 0.25,
                className: 'pointer-events-none'
              }}
            />
          );
        });
      }
    });

    return { parentOutlines, childrenSubdivisions };
  }, [selectedHexIds]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <MapContainer 
        center={[27.7172, 85.3240]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas={true}
        ref={(ref) => { 
          mapRef.current = ref;
          if (ref && !hasInitialFlied.current) {
            hasInitialFlied.current = true;
            setTimeout(() => {
              ref.flyTo([27.7172, 85.3240], 12, {
                duration: 2,
                easeLinearity: 0.25
              });
            }, 100);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController 
          autoUpdate={settings.autoUpdate}
          autoScale={settings.autoScale}
          resolution={settings.resolution}
          setSettings={setSettings}
          onBoundsChange={(bounds) => {
            setCurrentBounds(bounds);
            updateHexagons(bounds);
          }}
        />

        {hierarchyLayers.parentOutlines}
        {hierarchyLayers.childrenSubdivisions}

        {hexagons.map(hex => {
          const isSelected = selectedHexIds.has(hex.id);
          return (
            <Polygon
              key={hex.id}
              positions={hex.boundary}
              eventHandlers={{
                click: (e) => {
                  onHexSelect(hex);
                  if (e.originalEvent) e.originalEvent.stopPropagation();
                }
              }}
              pathOptions={{
                fillOpacity: isSelected ? 0.3 : 0,
                fillColor: '#f59e0b',
                color: isSelected ? '#f59e0b' : '#4f46e5',
                weight: isSelected ? 3 : 1.2,
                className: `transition-all cursor-pointer ${isSelected ? 'z-[2000]' : 'hover:stroke-indigo-800'}`
              }}
            />
          );
        })}
      </MapContainer>

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={handleLocateMe}
          disabled={isLocating}
          title="Locate Me"
          className="bg-white hover:bg-slate-50 text-indigo-600 p-3 rounded-xl shadow-lg border border-slate-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
        >
          {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
        </button>

        {!settings.autoUpdate && (
          <button 
            onClick={() => updateHexagons(currentBounds)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 border border-indigo-500"
          >
            <RefreshCw className="w-4 h-4" />
            Update Wireframe
          </button>
        )}
      </div>
    </div>
  );
};

export default H3Map;