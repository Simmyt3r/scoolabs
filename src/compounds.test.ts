import {describe,it,expect} from 'vitest';
import {compounds} from './CompoundReference';
describe('offline PubChem chemistry compounds',()=>{
 it('uses a distinct, referenced CID for each bundled compound',()=>{
  expect(compounds.length).toBe(15);
  expect(new Set(compounds.map(c=>c.cid)).size).toBe(compounds.length);
  for(const c of compounds){
   expect(c.name.length).toBeGreaterThan(2);
   expect(c.formula.length).toBeGreaterThan(0);
   expect(c.molecularWeight).toBeGreaterThan(1);
   expect(c.source).toBe('https://pubchem.ncbi.nlm.nih.gov/compound/'+c.cid);
  }
 });
 it('includes common school-chemistry materials',()=>{
  expect(compounds.map(c=>c.name)).toEqual(expect.arrayContaining(['Water','Ethanol','Sodium chloride','Glucose']));
 });
});
