import {describe,it,expect} from 'vitest';
import {atlasCards,physicalConstants,filterAtlas,taxonomy} from './ReferenceAtlas';
import {experiments} from './engine';
describe('downloaded and curated science atlas',()=>{
 it('covers physics, biology and agriculture with rich reference cards',()=>{
  expect(atlasCards).toHaveLength(32);
  for(const subject of ['physics','biology','agriculture'] as const){
    const items=filterAtlas(subject,'');
    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(new Set(items.map(c=>c.id)).size).toBe(items.length);
    for(const card of items){
      expect(card.overview.length).toBeGreaterThan(50);
      expect(card.limitation.length).toBeGreaterThan(30);
      expect(experiments.some(e=>e.id===card.experimentId&&e.subject===subject)).toBe(true);
    }
  }
 });
 it('finds search terms, scientific names, formulas and categories without internet',()=>{
  expect(filterAtlas('physics','Newton')).toHaveLength(1);
  expect(filterAtlas('biology','Paramecium').length).toBeGreaterThan(0);
  expect(filterAtlas('agriculture','Manihot')).toHaveLength(1);
  expect(filterAtlas('physics','','Electricity').length).toBeGreaterThan(0);
  expect(filterAtlas('agriculture','zzzzzzzz')).toEqual([]);
 });
 it('recognises GBIF taxonomy pack entries when curated by the acquisition workflow',()=>{
   expect(Array.isArray(taxonomy)).toBe(true);
   expect(new Set(taxonomy.map(x=>x.name)).size).toBe(taxonomy.length);
   for(const item of taxonomy){
     expect(item.gbifKey).toBeGreaterThan(0);
     expect(item.source).toBe('https://www.gbif.org/species/'+item.gbifKey);
     expect(item.rank).toBe('SPECIES');
     expect(item.kingdom.length).toBeGreaterThan(2);
     expect(item.family.length).toBeGreaterThan(2);
   }
 });
 it('packages ten well-specified source-attributed NIST constants',()=>{
  expect(physicalConstants).toHaveLength(10);
  expect(new Set(physicalConstants.map(c=>c.name)).size).toBe(10);
  expect(physicalConstants.some(c=>c.name==='Speed of light in vacuum'&&c.valueText.includes('299 792 458'))).toBe(true);
  for(const row of physicalConstants){
    expect(row.source).toBe('NIST 2022 CODATA');
    expect(row.valueText.trim().length).toBeGreaterThan(3);
    expect(row).toHaveProperty('unit');
    expect(row).toHaveProperty('uncertainty');
  }
 });
});
