import {describe,expect,it} from 'vitest';
import {apparatus,concepts,elements,elementCategory,searchLibrary,subjectApparatus,subjectConcepts} from './subject-library';
import {experiments,type Subject} from './engine';
describe('offline science reference integrity',()=>{
 it('contains exactly 118 recognized elements, with unique atomic numbers and grid cells',()=>{
  expect(elements).toHaveLength(118);
  expect(elements.map(x=>x.number)).toEqual(Array.from({length:118},(_,i)=>i+1));
  expect(new Set(elements.map(x=>x.symbol)).size).toBe(118);
  expect(new Set(elements.map(x=>x.col+':'+x.row)).size).toBe(118);
  expect(elements.every(x=>x.col>=1&&x.col<=18&&x.row>=1&&x.row<=10)).toBe(true);
  expect(elements[0]).toMatchObject({name:'Hydrogen',symbol:'H',number:1});
  expect(elements[5]).toMatchObject({name:'Carbon',symbol:'C',number:6});
  expect(elements[78]).toMatchObject({name:'Gold',symbol:'Au',number:79});
  expect(elements.at(-1)).toMatchObject({name:'Oganesson',symbol:'Og',number:118});
  expect(elements.some(x=>x.number===119)).toBe(false);
 });
 it('distinguishes element families without inventing scientific measurements',()=>{
  expect(elementCategory(elements[2])).toBe('alkali-metal');
  expect(elementCategory(elements[9])).toBe('noble-gas');
  expect(elementCategory(elements[7])).toBe('nonmetal');
  expect(elements.some(x=>x.electronegativity===null)).toBe(true);
  expect(elements.every(x=>x.meltKelvin===null||x.meltKelvin>0)).toBe(true);
 });
 it('covers each of the four subjects with ten concepts and twelve apparatus explanations',()=>{
  for(const subject of ['chemistry','physics','biology','agriculture'] as Subject[]){
    const c=subjectConcepts(subject),a=subjectApparatus(subject);
    expect(c).toHaveLength(10);expect(a).toHaveLength(12);
    for(const item of c){expect(item.overview.length).toBeGreaterThan(40);expect(item.example.length).toBeGreaterThan(20);
      expect(experiments.some(x=>x.id===item.experimentId&&x.subject===subject)).toBe(true)}
    for(const item of a){expect(item.purpose.length).toBeGreaterThan(30);expect(item.safety.length).toBeGreaterThan(20);
      expect(experiments.some(x=>x.id===item.experimentId&&x.subject===subject)).toBe(true)}
  }
  expect(concepts).toHaveLength(40);expect(apparatus).toHaveLength(48);
 });
 it('searches concepts and apparatus locally, case-insensitively',()=>{
  expect(searchLibrary(subjectConcepts('chemistry'),'  ATOMS  ').map(x=>x.title)).toContain('Atoms, protons and isotopes');
  expect(searchLibrary(subjectApparatus('chemistry'),'pipette')).toHaveLength(1);
  expect(searchLibrary(subjectApparatus('chemistry'),'does-not-exist')).toEqual([]);
 });
});
