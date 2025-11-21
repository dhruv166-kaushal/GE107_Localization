import { ANCHORS, FIELD_DIMENSIONS } from '../constants';
import { AnchorReading, Coordinate } from '../types';

/**
 * Calculates the position of the tag based on distances from anchors.
 * Uses a simplified Least Squares approach optimized for a rectangular field setup.
 * Returns coordinates and a residual error metric (Mean Absolute Error).
 */
export const calculatePosition = (readings: Record<string, AnchorReading>): (Coordinate & { error: number }) | null => {
  const r1 = readings["1"]?.distance;
  const r2 = readings["2"]?.distance;
  const r3 = readings["3"]?.distance;
  const r4 = readings["4"]?.distance;

  // We need at least 3 anchors for a decent 2D fix
  const validCount = [r1, r2, r3, r4].filter(r => r !== undefined && r > 0).length;
  if (validCount < 3) return null;

  const W = FIELD_DIMENSIONS.width;
  const H = FIELD_DIMENSIONS.height;

  let xEst = 0;
  let yEst = 0;
  let xCount = 0;
  let yCount = 0;

  // 1. Calculate X estimates
  
  // Using Anchor 1 (0,0) and Anchor 2 (W,0)
  if (r1 && r2) {
    xEst += (r1 ** 2 - r2 ** 2 + W ** 2) / (2 * W);
    xCount++;
  }

  // Using Anchor 3 (0,H) and Anchor 4 (W,H)
  if (r3 && r4) {
    xEst += (r3 ** 2 - r4 ** 2 + W ** 2) / (2 * W);
    xCount++;
  }

  // 2. Calculate Y estimates

  // Using Anchor 1 (0,0) and Anchor 3 (0,H)
  if (r1 && r3) {
    yEst += (r1 ** 2 - r3 ** 2 + H ** 2) / (2 * H);
    yCount++;
  }

  // Using Anchor 2 (W,0) and Anchor 4 (W,H)
  if (r2 && r4) {
    yEst += (r2 ** 2 - r4 ** 2 + H ** 2) / (2 * H);
    yCount++;
  }

  let finalX = 0;
  let finalY = 0;

  if (xCount > 0 && yCount > 0) {
    finalX = xEst / xCount;
    finalY = yEst / yCount;
  } else {
    // Fallback for minimal data (e.g. only r1, r2, r3 present)
    if (r1 && r2 && r3) {
       finalX = (r1 ** 2 - r2 ** 2 + W ** 2) / (2 * W);
       finalY = (r1 ** 2 - r3 ** 2 + H ** 2) / (2 * H);
    } else {
      return null;
    }
  }

  // Clamp to field boundaries
  finalX = Math.max(0, Math.min(W, finalX));
  finalY = Math.max(0, Math.min(H, finalY));

  // 3. Calculate Residual Error (Goodness of fit)
  // Mean Absolute Error: Average difference between calculated distance to anchor and measured distance
  let totalError = 0;
  let errorCount = 0;

  ANCHORS.forEach(anchor => {
      const reading = readings[anchor.id];
      if (reading && reading.distance > 0) {
          const dx = finalX - anchor.position.x;
          const dy = finalY - anchor.position.y;
          const calculatedDist = Math.sqrt(dx * dx + dy * dy);
          totalError += Math.abs(calculatedDist - reading.distance);
          errorCount++;
      }
  });

  const avgError = errorCount > 0 ? totalError / errorCount : 0;

  return { x: finalX, y: finalY, error: avgError };
};