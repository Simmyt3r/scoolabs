import {describe,it,expect} from 'vitest';
import {guideCoverage,guides} from './guides';
import {experiments} from './engine';
describe('offline science practical guides',()=>{
 it('covers every available practical with instructions and safety notes',()=>{
  expect(guideCoverage()).toMatchObject({total:12,covered:12,missing:[]});
  for(const experiment of experiments) {
   const guide=guides[experiment.id];
   expect(guide.method.length).toBeGreaterThanOrEqual(3);
   expect(guide.equipment.length).toBeGreaterThanOrEqual(2);
   expect(guide.questions.length).toBeGreaterThanOrEqual(2);
   expect(guide.modelLimit.length).toBeGreaterThan(20);
   expect(guide.safety.length).toBeGreaterThan(20);
  }
 });
});
