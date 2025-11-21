import { FIELD_DIMENSIONS } from '../constants';
import { AnchorReading } from '../types';

let angle = 0;

/**
 * Generates readings that simulate a tag moving in a figure-8 pattern
 */
export const generateMockReadings = (): Record<string, AnchorReading> => {
  const timestamp = Date.now();
  const centerX = FIELD_DIMENSIONS.width / 2;
  const centerY = FIELD_DIMENSIONS.height / 2;
  const radius = 80; // Adjusted for 200cm field (80cm radius)

  // Move in a Lissajous curve / Figure 8
  const trueX = centerX + radius * Math.cos(angle);
  const trueY = centerY + radius * Math.sin(2 * angle) / 2;

  angle += 0.05;

  const anchors = [
      { id: "1", x: 0, y: 0 },
      { id: "2", x: FIELD_DIMENSIONS.width, y: 0 },
      { id: "3", x: FIELD_DIMENSIONS.width, y: FIELD_DIMENSIONS.height },
      { id: "4", x: 0, y: FIELD_DIMENSIONS.height }
  ];

  const readings: Record<string, AnchorReading> = {};

  anchors.forEach(a => {
      // Calculate true distance
      const dist = Math.sqrt((trueX - a.x)**2 + (trueY - a.y)**2);
      // Add noise (+/- 10cm)
      const noise = (Math.random() - 0.5) * 10;
      
      readings[a.id] = {
          anchorId: a.id,
          distance: Math.max(0, dist + noise),
          rssi: -40 - (dist * 0.2) + (Math.random() * 5), 
          timestamp
      };
  });

  return readings;
};