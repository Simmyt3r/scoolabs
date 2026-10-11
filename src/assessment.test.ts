import {describe,expect,it} from 'vitest';
import {EMPTY_RUBRIC, parseRubricFeedback,reportMetadata,rubricFeedback,scoreRubric} from './assessment';
import type {LabRecord} from './store';
const record:LabRecord={id:'1',student:'Ibrahim',classroom:'SS 2A',timestamp:'2026-10-11T12:00:00Z',experimentId:'ohms-law',experimentTitle:"Ohm's Law",subject:'physics',settings:'Voltage 3 V',observation:'Current 0.3 A',conclusion:'V = IR',assignmentId:'task-1',grade:0,feedback:''};
describe('teacher rubric assessment',()=>{
  it('totals four evidence-based criteria to 100 points',()=>{
    expect(scoreRubric({method:'25',observations:'35',reasoning:'30',clarity:'10'})?.total).toBe(100);
    expect(scoreRubric({method:'0',observations:'0',reasoning:'0',clarity:'0'})?.total).toBe(0);
  });
  it('rejects incomplete, negative, fractional, over-limit or nonnumeric entries',()=>{
    expect(scoreRubric(EMPTY_RUBRIC)).toBeNull();
    for(const entry of ['26','-1','2.5','nonsense','']){
      expect(scoreRubric({method:entry,observations:'30',reasoning:'25',clarity:'9'})).toBeNull();
    }
  });
  it('round-trips rubric criterion scores and teacher comments',()=>{
    const scores={method:20,observations:30,reasoning:24,clarity:8};
    const feedback=rubricFeedback(scores,'Good handling of variables.');
    const result=parseRubricFeedback(feedback);
    expect(result?.inputs).toEqual({method:'20',observations:'30',reasoning:'24',clarity:'8'});
    expect(result?.comment).toBe('Good handling of variables.');
    expect(parseRubricFeedback('Free text only')).toBeNull();
    expect(parseRubricFeedback('Scoolabs rubric v1: malformed')).toBeNull();
  });
  it('preserves a valid zero grade and does not invent assessment data',()=>{
    expect(reportMetadata(record,'Circuit practical')).toMatchObject({grade:0,assignment:'Circuit practical',student:'Ibrahim',rubric:null});
    expect(reportMetadata({...record,grade:null,assignmentId:null})).toMatchObject({grade:null,assignment:'Personal practical'});
  });
});
