export interface Coordinate {
  x: number;
  y: number;
}

export interface AnchorConfig {
  id: string; // "1", "2", "3", "4"
  label: string;
  position: Coordinate;
  color: string;
}

export interface AnchorReading {
  anchorId: string;
  distance: number; // in Centimeters (cm)
  rssi: number; // in dBm
  timestamp: number;
}

export interface LocalizationResult {
  id: number;
  timestamp: string;
  est_x: number;
  est_y: number;
  num_anchors: number;
  tag_id: string;
}

export interface SystemState {
  readings: Record<string, AnchorReading>;
  calculatedPosition: Coordinate | null;
  history: PositionHistoryPoint[];
  isConnected: boolean;
  isDemoMode: boolean;
}

export interface PositionHistoryPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface FieldDimensions {
  width: number;
  height: number;
}