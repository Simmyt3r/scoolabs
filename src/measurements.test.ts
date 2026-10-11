import {describe,expect,it} from 'vitest';
import {addMeasurement,fitOhmsLaw,fitPendulumGravity,fitPotometerUptake,readingSummary,MAX_READINGS} from './measurements';
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

describe('extended science measurement worksheets',()=>{
  it('estimates gravity from small-angle pendulum T squared against length',()=>{
    const gravity=9.81;
    const observed=[0.5,1,2].map(length=>({x:length,y:4*Math.PI*Math.PI*length/gravity}));
    expect(fitPendulumGravity(observed)).toBeCloseTo(gravity,8);
    expect(fitPendulumGravity([{x:1,y:4}])).toBeNull();
    expect(fitPendulumGravity([{x:1,y:0},{x:2,y:0}])).toBeNull();
    expect(addMeasurement([],3,13,'pendulum')).toHaveLength(1);
    expect(()=>addMeasurement([],4,13,'pendulum')).toThrow(RangeError);
    expect(readingSummary(observed,'pendulum')).toContain('Period squared');
  });
  it('captures potometer water uptake versus time, not labelled transpiration',()=>{
    const captured=addMeasurement(addMeasurement([],5,25,'potometer'),10,50,'potometer');
    expect(fitPotometerUptake(captured)).toBeCloseTo(5,8);
    expect(readingSummary(captured,'potometer')).toContain('Water uptake');
    expect(()=>addMeasurement([],2,900,'potometer')).toThrow(RangeError);
    expect(()=>addMeasurement([],31,15,'potometer')).toThrow(RangeError);
  });
});
