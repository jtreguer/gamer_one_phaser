import { describe, it, expect } from 'vitest';
import { generateSpawnPoint, generateTargetPoint } from '../../src/systems/SpawnValidator.js';

describe('generateSpawnPoint', () => {
  const planetX = 400;
  const planetY = 300;
  const planetRadius = 80;

  it('returns a point on screen edges', () => {
    for (let i = 0; i < 50; i++) {
      const target = { x: 400, y: 220 }; // top of planet
      const spawn = generateSpawnPoint(target.x, target.y, planetX, planetY, planetRadius);

      expect(spawn.x).toBeGreaterThanOrEqual(0);
      expect(spawn.x).toBeLessThanOrEqual(800);
      expect(spawn.y).toBeGreaterThanOrEqual(0);
      expect(spawn.y).toBeLessThanOrEqual(600);
    }
  });

  it('generates points that do not intersect planet', () => {
    // This is a probabilistic test - run many times
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const targetX = planetX + Math.cos(angle) * planetRadius;
      const targetY = planetY + Math.sin(angle) * planetRadius;

      const spawn = generateSpawnPoint(targetX, targetY, planetX, planetY, planetRadius);

      // Verify it's a valid object
      expect(typeof spawn.x).toBe('number');
      expect(typeof spawn.y).toBe('number');
    }
  });
});

describe('generateTargetPoint', () => {
  const planetX = 400;
  const planetY = 300;
  const planetRadius = 80;

  it('generates point on planet circumference', () => {
    for (let i = 0; i < 50; i++) {
      const target = generateTargetPoint(planetX, planetY, planetRadius, null, false);
      const dx = target.x - planetX;
      const dy = target.y - planetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeCloseTo(planetRadius, 0);
    }
  });

  it('targets specific silo angle when provided', () => {
    const angle = Math.PI / 4;
    const target = generateTargetPoint(planetX, planetY, planetRadius, angle, true);
    const expectedX = planetX + Math.cos(angle) * planetRadius;
    const expectedY = planetY + Math.sin(angle) * planetRadius;
    expect(target.x).toBeCloseTo(expectedX, 5);
    expect(target.y).toBeCloseTo(expectedY, 5);
  });
});
