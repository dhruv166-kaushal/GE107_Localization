import { AnchorConfig, FieldDimensions } from './types';

// Field size in Centimeters (Matching ESP32 config: 40cm x 40cm)
export const FIELD_DIMENSIONS: FieldDimensions = {
  width: 40,
  height: 40,
};

// Anchor positions matching ESP32 Geometry (in cm)
// A1: (0,0), A2: (40,0), A3: (40,40), A4: (0,40)
export const ANCHORS: AnchorConfig[] = [
  {
    id: "1",
    label: "Anchor 1 (BL)",
    position: { x: 0, y: 0 },
    color: "#3b82f6", // Blue
  },
  {
    id: "2",
    label: "Anchor 2 (BR)",
    position: { x: FIELD_DIMENSIONS.width, y: 0 },
    color: "#a855f7", // Purple
  },
  {
    id: "3",
    label: "Anchor 3 (TR)",
    position: { x: FIELD_DIMENSIONS.width, y: FIELD_DIMENSIONS.height },
    color: "#f59e0b", // Amber
  },
  {
    id: "4",
    label: "Anchor 4 (TL)",
    position: { x: 0, y: FIELD_DIMENSIONS.height },
    color: "#ef4444", // Red
  },
];

export const SUPABASE_URL = "https://kiutfhwwugxtzikzgpph.supabase.co";
export const SUPABASE_TABLE = "anchor_readings";
// Key from ESP32 Firmware Code
export const SUPABASE_ANON_KEY = "sb_publishable_xn4_i3-Df9fZmG9-BszSyQ_lxNF92Md";