import {describe,it,expect} from 'vitest';
import {experiments} from './engine';
import {checkQuestions,checkCoverage,evaluateCheck} from './knowledgeChecks';
describe('offline experiment knowledge checks',()=>{
 it('includes two science-relevant questions for every available practical',()=>{expect(checkCoverage()).toEqual([]);for(const e of experiments){const questions=checkQuestions[e.id];expect(questions).toHaveLength(2);for(const q of questions){expect(q.options).toHaveLength(3);expect(q.prompt.length).toBeGreaterThan(25);expect(q.explanation.length).toBeGreaterThan(25);expect(q.correctIndex).toBeGreaterThanOrEqual(0);expect(q.correctIndex).toBeLessThan(3)}}});
 it('marks correctly without fabricating partial entries',()=>{for(const e of experiments){const q=checkQuestions[e.id];expect(evaluateCheck(e.id,q.map(x=>x.correctIndex))).toBe(2);expect(evaluateCheck(e.id,q.map(x=>(x.correctIndex+1)%3))).toBe(0);expect(evaluateCheck(e.id,[q[0].correctIndex,(q[1].correctIndex+1)%3])).toBe(1)}});
 it('rejects incomplete or invalid submissions',()=>{expect(()=>evaluateCheck('unknown',[0,0])).toThrow();expect(()=>evaluateCheck('titration',[0])).toThrow();expect(()=>evaluateCheck('titration',[0,3])).toThrow();expect(()=>evaluateCheck('titration',[-1,1])).toThrow()});
});
