import { describe, expect, it } from 'vitest';
import { circuit, experiments, germination, microscope, titrate } from './engine';

describe('science engine', () => {
  it('has exactly four active exercises, one per subject', () => {
    expect(experiments.filter(x => x.ready)).toHaveLength(4);
    expect(new Set(experiments.filter(x => x.ready).map(x => x.subject)).size).toBe(4);
  });
  it('calculates neutralisation of 25 mL 0.1 M acid using 0.1 M base', () => {
    const result = titrate(0.1, 25);
    expect(result.ph).toBe(7);
    expect(result.equivalenceMl).toBeCloseTo(25);
    expect(result.excess).toBe('neutral');
    expect(titrate(0.1, 24).ph).toBeLessThan(7);
    expect(titrate(0.1, 26).ph).toBeGreaterThan(7);
  });
  it('rejects invalid chemical inputs', () => {
    expect(() => titrate(0, 1)).toThrow(RangeError);
    expect(() => titrate(0.1, -1)).toThrow(RangeError);
  });
  it('calculates Ohm law and power', () => {
    expect(circuit(12, 6)).toMatchObject({ current: 2, power: 24 });
    expect(() => circuit(12, 0)).toThrow(RangeError);
  });
  it('computes total microscope magnification', () => {
    expect(microscope(40).magnification).toBe(400);
    expect(microscope(10).fieldOfViewMm).toBeCloseTo(1.8);
  });
  it('models unsuitable seed conditions as non-viable', () => {
    expect(germination('maize', 0, 27, 10).percentage).toBe(0);
    expect(germination('maize', 60, 27, 10).percentage).toBeGreaterThan(0);
    expect(germination('cowpea', 60, 25, 0).percentage).toBe(0);
    expect(() => germination('rice', 200, 25, 10)).toThrow(RangeError);
  });
});
