import { describe, it, expect } from 'vitest';
import {
  clamp, lerp, randomBetween, randomInt, angleDiff,
  lineIntersectsCircle, distanceSq, distance, normalizeAngle,
} from '../../src/utils/math.js';

describe('clamp', () => {
  it('clamps below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns value in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('lerp', () => {
  it('returns start at t=0', () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it('returns end at t=1', () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });
});

describe('randomBetween', () => {
  it('returns value in range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomBetween(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    }
  });
});

describe('randomInt', () => {
  it('returns integer in range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(1, 5);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(5);
    }
  });
});

describe('angleDiff', () => {
  it('returns 0 for same angles', () => {
    expect(angleDiff(0, 0)).toBeCloseTo(0);
  });

  it('handles wrap-around', () => {
    expect(angleDiff(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(0.2, 5);
  });

  it('returns PI for opposite angles', () => {
    expect(angleDiff(0, Math.PI)).toBeCloseTo(Math.PI);
  });
});

describe('lineIntersectsCircle', () => {
  it('returns true for line through circle', () => {
    expect(lineIntersectsCircle(0, 0, 10, 0, 5, 0, 2)).toBe(true);
  });

  it('returns false for line missing circle', () => {
    expect(lineIntersectsCircle(0, 5, 10, 5, 5, 0, 2)).toBe(false);
  });

  it('returns true for line starting inside circle', () => {
    expect(lineIntersectsCircle(5, 0, 10, 0, 5, 0, 2)).toBe(true);
  });

  it('returns false for line entirely past circle', () => {
    expect(lineIntersectsCircle(10, 0, 20, 0, 5, 0, 2)).toBe(false);
  });
});

describe('distanceSq', () => {
  it('returns squared distance', () => {
    expect(distanceSq(0, 0, 3, 4)).toBe(25);
  });
});

describe('distance', () => {
  it('returns Euclidean distance', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
});

describe('normalizeAngle', () => {
  it('normalizes negative angle', () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2);
  });

  it('normalizes angle > 2PI', () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
  });

  it('leaves angle in range', () => {
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
  });
});
