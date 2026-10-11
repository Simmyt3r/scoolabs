import { describe, expect, it } from 'vitest';
import { circuit, experiments, germination, microscope, titrate, solutionPH, pendulum, osmosis, soilSample } from './engine';

describe('science engine', () => {
  it('has eight active exercises, two per subject', () => {
    expect(experiments.filter(x => x.ready)).toHaveLength(8);
    expect(new Set(experiments.filter(x => x.ready).map(x => x.subject)).size).toBe(4);
    for (const subject of ['chemistry','physics','biology','agriculture']) expect(experiments.filter(x=>x.subject===subject && x.ready)).toHaveLength(2);
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

describe('scientifically referenced models', () => {
  it('calculates strong-acid and strong-base pH using pH = -log10[H+]', () => {
    expect(solutionPH('acid',0.01).ph).toBeCloseTo(2);
    expect(solutionPH('base',0.01).ph).toBeCloseTo(12);
    expect(solutionPH('water',0.5).ph).toBe(7);
    expect(() => solutionPH('acid',0)).toThrow(RangeError);
  });
  it('models small-angle pendulum period independent of mass', () => {
    const r=pendulum(1,10);
    expect(r.periodSeconds).toBeCloseTo(2.006,2);
    expect(r.totalSeconds).toBeCloseTo(20.06,1);
    expect(pendulum(4,1).periodSeconds).toBeCloseTo(2*r.periodSeconds,8);
    expect(() => pendulum(1,10,9.81,20)).toThrow(RangeError);
  });
  it('correctly determines net osmosis direction from osmolarity', () => {
    expect(osmosis(300,100).netWaterMovement).toBe('into the cell');
    expect(osmosis(300,500).tonicity).toBe('hypertonic');
    expect(osmosis(300,300).netWaterMovement).toBe('no net movement');
    expect(() => osmosis(-1,300)).toThrow(RangeError);
  });
  it('conserves measured soil mass in fraction calculations', () => {
    const sample=soilSample(60,30,10,6.2);
    expect(sample.totalGrams).toBe(100);
    expect(sample.fractions.sand).toBe(60);
    expect(sample.fractions.silt + sample.fractions.clay + sample.fractions.sand).toBeCloseTo(100);
    expect(sample.acidity).toBe('acidic');
    expect(() => soilSample(0,0,0,7)).toThrow(RangeError);
  });
});
