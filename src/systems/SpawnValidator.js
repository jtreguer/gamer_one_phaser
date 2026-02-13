import { CONFIG } from '../config.js';
import { lineIntersectsCircle, randomBetween } from '../utils/math.js';

export function generateSpawnPoint(targetX, targetY, planetX, planetY, planetRadius) {
  const margin = CONFIG.SPAWN_MARGIN;
  const w = CONFIG.GAME_WIDTH;
  const h = CONFIG.GAME_HEIGHT;

  for (let attempt = 0; attempt < 50; attempt++) {
    let sx, sy;
    // Pick a random edge
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: // top
        sx = randomBetween(margin, w - margin);
        sy = margin;
        break;
      case 1: // bottom
        sx = randomBetween(margin, w - margin);
        sy = h - margin;
        break;
      case 2: // left
        sx = margin;
        sy = randomBetween(margin, h - margin);
        break;
      case 3: // right
        sx = w - margin;
        sy = randomBetween(margin, h - margin);
        break;
    }

    // Validate path doesn't intersect planet (with margin)
    if (!lineIntersectsCircle(sx, sy, targetX, targetY, planetX, planetY, planetRadius - 5)) {
      return { x: sx, y: sy };
    }
  }

  // Fallback: spawn from a corner that is far from the target
  const corners = [
    { x: margin, y: margin },
    { x: w - margin, y: margin },
    { x: margin, y: h - margin },
    { x: w - margin, y: h - margin },
  ];

  // Pick corner farthest from planet center
  let best = corners[0];
  let bestDist = 0;
  for (const c of corners) {
    const dx = c.x - planetX;
    const dy = c.y - planetY;
    const d = dx * dx + dy * dy;
    if (d > bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

export function generateTargetPoint(planetX, planetY, planetRadius, siloAngle, isSiloTarget) {
  let angle;
  if (isSiloTarget && siloAngle !== null) {
    angle = siloAngle;
  } else {
    angle = Math.random() * Math.PI * 2;
  }

  return {
    x: planetX + Math.cos(angle) * planetRadius,
    y: planetY + Math.sin(angle) * planetRadius,
  };
}
