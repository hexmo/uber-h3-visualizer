import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents } from 'react-leaflet';
import * as h3 from 'h3-js';
import { RefreshCw, LocateFixed, Loader2 } from 'lucide-react';
import { H3Hexagon, AppSettings } from '../types';

// Component to handle map instance operations
const MapController: React.FC<{ 
  onBoundsChange: (bounds: any) => void; 
  autoUpdate: boolean;
}> = ({ onBoundsChange, autoUpdate }) => {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      if (autoUpdate) onBoundsChange(map.getBounds());
    },
    zoomend: () => {
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
    const limitedHexIds = hexIds.length > 2500 ? hexIds.slice(0, 2500) : hexIds;

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
        setSettings(prev => ({ ...prev, resolution: 6 }));
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 12, {
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

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={[27.7172, 85.3240]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
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
          onBoundsChange={(bounds) => {
            setCurrentBounds(bounds);
            updateHexagons(bounds);
          }} 
        />

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