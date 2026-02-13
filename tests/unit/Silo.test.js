import { describe, it, expect, beforeEach } from 'vitest';
import { SILO_STATE } from '../../src/utils/constants.js';
import Silo from '../../src/objects/Silo.js';

describe('Silo', () => {
  let silo;

  beforeEach(() => {
    silo = new Silo(0, 0);
  });

  it('starts in READY state', () => {
    expect(silo.state).toBe(SILO_STATE.READY);
  });

  it('transitions to RELOADING on fire', () => {
    silo.fire(1.5);
    expect(silo.state).toBe(SILO_STATE.RELOADING);
  });

  it('returns true when fire succeeds', () => {
    expect(silo.fire(1.5)).toBe(true);
  });

  it('returns false when firing while reloading', () => {
    silo.fire(1.5);
    expect(silo.fire(1.5)).toBe(false);
  });

  it('returns false when firing while destroyed', () => {
    silo.destroy();
    expect(silo.fire(1.5)).toBe(false);
  });

  it('reloads after timer expires', () => {
    silo.fire(1.0);
    // Simulate 500ms
    let reloaded = silo.update(500);
    expect(reloaded).toBe(false);
    expect(silo.state).toBe(SILO_STATE.RELOADING);

    // Simulate another 600ms (total 1100ms > 1000ms)
    reloaded = silo.update(600);
    expect(reloaded).toBe(true);
    expect(silo.state).toBe(SILO_STATE.READY);
  });

  it('reports reload progress', () => {
    silo.fire(1.0);
    silo.update(500); // 500ms into 1000ms reload
    const progress = silo.getReloadProgress();
    expect(progress).toBeCloseTo(0.5, 1);
  });

  it('reports full progress when READY', () => {
    expect(silo.getReloadProgress()).toBe(1);
  });

  it('transitions to DESTROYED on destroy', () => {
    silo.destroy();
    expect(silo.state).toBe(SILO_STATE.DESTROYED);
  });

  it('can be repaired', () => {
    silo.destroy();
    silo.repair(1.5);
    expect(silo.state).toBe(SILO_STATE.READY);
  });

  it('updates position correctly', () => {
    silo.baseAngle = 0;
    silo.updatePosition(400, 300, 80, 0);
    expect(silo.x).toBeCloseTo(480);
    expect(silo.y).toBeCloseTo(300);
  });

  it('updates position with rotation', () => {
    silo.baseAngle = 0;
    silo.updatePosition(400, 300, 80, Math.PI / 2);
    expect(silo.x).toBeCloseTo(400, 0);
    expect(silo.y).toBeCloseTo(380, 0);
  });
});
