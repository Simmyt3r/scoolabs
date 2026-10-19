import {describe,expect,it} from 'vitest';
import {learningRecommendations} from './learningPath';
import {checkQuestions} from './knowledgeChecks';
import type {KnowledgeResult} from './native-storage';
import type {LabRecord} from './store';
const check=(experimentId:string,firstChoice:number,secondChoice:number,correct:number,updatedAt='2026-10-19T12:00:00Z'):KnowledgeResult=>({
  experimentId,firstChoice,secondChoice,correct,updatedAt
});
describe('transparent offline learning recommendations',()=>{
  it('suggests beginners a valid practical without claiming mastery',()=>{
    const items=learningRecommendations([],[]);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({experimentId:'titration',status:'Practical not yet attempted'});
  });
  it('prioritises missed concepts using question explanations, not generated science claims',()=>{
    const qs=checkQuestions['ohms-law'];
    const missed=check('ohms-law',1,1,0);
    const items=learningRecommendations([missed],[]);
    expect(items[0].experimentId).toBe('ohms-law');
    expect(items[0].message).toContain(qs[0].explanation);
    expect(items[0].message).toContain(qs[1].explanation);
  });
  it('uses the latest valid result and ignores malformed/unknown IDs',()=>{
    const items=learningRecommendations([
      check('titration',1,2,0),
      check('titration',0,1,2,'2026-10-19T13:00:00Z'),
      check('nonexistent',0,0,0),
      check('pendulum',-4,0,0),
    ],[]);
    expect(items.some(item=>item.experimentId==='titration'&&item.status.includes('0/2'))).toBe(false);
    expect(items.some(item=>item.experimentId==='nonexistent')).toBe(false);
  });
  it('recognises a saved activity without converting participation into a mastery score',()=>{
    const record={experimentId:'titration'} as LabRecord;
    const items=learningRecommendations([], [record]);
    expect(items[0].status).toBe('Self-check pending');
  });
});
