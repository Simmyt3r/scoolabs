import {describe,expect,it} from 'vitest';
import {studentProgress} from './progress';
import type {LabRecord} from './store';
import type {Assignment,KnowledgeResult} from './native-storage';
const record=(id:string,experimentId='titration',extra:Partial<LabRecord>={}):LabRecord=>({
  id,timestamp:'2026-10-11T16:00:00Z',student:'Ada',classroom:'SS2A',experimentId,
  experimentTitle:'Practical',subject:'chemistry',settings:'x',observation:'y',
  conclusion:'z',assignmentId:null,grade:null,feedback:null,...extra
});
const task=(id:string,experimentId='titration'):Assignment=>({
  id,classId:'c1',experimentId,title:'Activity '+id,instructions:'Do the practical',createdAt:'2026-10-11T15:00:00Z'
});
const check=(experimentId:string,correct:number,updatedAt='2026-10-11T15:00:00Z'):KnowledgeResult=>({
  experimentId,correct,firstChoice:0,secondChoice:1,updatedAt
});
describe('student learning dashboard',()=>{
 it('starts with honest zero totals, and does not invent marks or completed work',()=>{
  const s=studentProgress([],[],[]);
  expect(s).toMatchObject({availablePracticals:12,triedPracticals:0,reportCount:0,
    pendingAssignments:0,assignedCount:0,assessedReports:0,completedChecks:0,
    perfectChecks:0,averageTeacherScore:null});
  expect(s.subjectActivity).toHaveLength(4);
  expect(s.subjectActivity.map(x=>x.available)).toEqual([3,3,3,3]);
  expect(s.nextExperimentId).toBe('titration');
 });
 it('counts distinct practicals, assigned reports and valid zero grades without mixing formative scores',()=>{
  const r=[record('r1','titration',{assignmentId:'a1',grade:0,feedback:'Try again'}),
    record('r2','titration',{grade:100}),
    record('r3','ohms-law',{subject:'physics',assignmentId:'a2'}),
    record('r4','germination',{subject:'agriculture',grade:74}),
    record('r5','soil',{subject:'agriculture',grade:101})];
  const s=studentProgress(r,[task('a1'),task('a2','ohms-law'),task('a3','osmosis')],[check('osmosis',2),check('osmosis',1,'2026-10-11T16:30:00Z'),check('pendulum',2)]);
  expect(s).toMatchObject({triedPracticals:4,reportCount:5,assignedCount:3,
    submittedAssignments:2,pendingAssignments:1,assessedReports:3,awaitingMarking:1,
    averageTeacherScore:58,completedChecks:2,perfectChecks:1,nextExperimentId:'osmosis'});
  expect(s.recentFeedback.map(x=>x.id)).toEqual(['r1']);
  expect(s.subjectActivity.find(x=>x.subject==='chemistry')).toMatchObject({tried:1,reports:2});
 });
 it('does not treat unknown experiment entries as attempted available lessons',()=>{
  const s=studentProgress([record('a','unknown')],[task('old','unknown')],[check('unknown',2)]);
  expect(s.triedPracticals).toBe(0);
  expect(s.completedChecks).toBe(0);
  expect(s.pendingAssignments).toBe(1);
  expect(s.nextAssignment).toBeNull();
 });
});
