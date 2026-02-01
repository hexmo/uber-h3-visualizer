export interface H3Hexagon {
  id: string;
  boundary: [number, number][];
  center: [number, number];
  resolution: number;
  areaKm2: number;
  areaM2: number;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

export interface AppSettings {
  resolution: number;
  showLabels: boolean;
  colorScheme: 'cool' | 'warm' | 'density';
  autoUpdate: boolean;
}