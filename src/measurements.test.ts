import {describe,expect,it} from 'vitest';
import {addMeasurement,fitOhmsLaw,readingSummary,MAX_READINGS} from './measurements';
describe('physical-science observation log',()=>{
 it('collects manual readings in setpoint order and replaces duplicates',()=>{
  let rows=addMeasurement([],10,2,'titration');
  rows=addMeasurement(rows,0,1,'titration');
  rows=addMeasurement(rows,10,3,'titration');
  expect(rows).toEqual([{x:0,y:1},{x:10,y:3}]);
  expect(readingSummary(rows,'titration')).toContain('10.0 -> 3.00');
 });
 it('caps log length, rejects invalid values and makes no readings automatically',()=>{
  let rows:ReturnType<typeof addMeasurement>=[];
  for(let i=0;i<35;i++) rows=addMeasurement(rows,i,7,'titration');
  expect(rows).toHaveLength(MAX_READINGS);
  expect(rows[0].x).toBe(15);
  expect(()=>addMeasurement([],NaN,2,'titration')).toThrow(RangeError);
  expect(()=>addMeasurement([],25,2,'ohms-law')).toThrow(RangeError);
  expect(()=>addMeasurement([],1,-.01,'ohms-law')).toThrow(RangeError);
  expect(readingSummary([],'ohms-law')).toContain('No instrument readings');
 });
 it('estimates resistance only from two or more manually captured voltage points',()=>{
  expect(fitOhmsLaw([{x:5,y:.5},{x:10,y:1},{x:15,y:1.5}])?.resistance).toBeCloseTo(10,8);
  expect(fitOhmsLaw([{x:1,y:0}])).toBeNull();
  expect(fitOhmsLaw([{x:0,y:0},{x:1,y:0}])).toBeNull();
 });
});
