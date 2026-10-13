import {describe,it,expect} from 'vitest';
import {apparatusSketch} from './ApparatusDiagram';
describe('labelled offline apparatus diagrams',()=>{
  it('supports additional instruments across chemistry, physics, biology and agriculture',()=>{
    for(const name of ['Beaker','Burette','Metre rule','Compound light microscope','Hoe','Filter funnel',
       'Measuring cylinder','Ammeter','Voltmeter','Convex lens','Potometer','Petri dish','Watering can','Rain gauge']){
      expect(apparatusSketch(name)).not.toBe('generic');
    }
  });
  it('keeps unknown instruments clearly identified as generic',()=>{
    expect(apparatusSketch('unknown device')).toBe('generic');
  });
});
