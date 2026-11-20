import {describe,expect,it} from 'vitest';
import {DEMO_PLAN,DEMO_TOPIC,prepareLesson} from './lessonEngine';
import {answerRequest,draftRequest,parseModelDraft,validateSuggestion} from './localTeacherModel';

describe('optional local classroom model guardrails',()=>{
  const lesson=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
  const complete='# Introduction\nIntro\n# Learning objectives\nObjective\n# Explanation\nExplanation\n# Worked example\nExample\n# Class activity\nDiscuss\n# Recap\nReview\n# Questions and answers\nQ: First question?\nA: First answer.\nQ: Second question?\nA: Second answer.';
  it('builds a bounded draft request using only the selected reference',()=>{
    const req=draftRequest('Ohm law','Teach the formula and example','physics-ohm');
    expect(req.mode).toBe('draft');expect(req.passages).toHaveLength(1);
    expect(req.passages[0].text).toContain('V = IR');
    expect(()=>draftRequest('Topic','x'.repeat(6001),'')).toThrow();
    expect(()=>draftRequest('Topic','Outline','missing')).toThrow();
    expect(draftRequest('History','Approved outline','').passages).toEqual([]);
  });
  it('rejects incomplete or malformed generated lessons',()=>{
    expect(parseModelDraft('A topic',{text:complete,sourceIds:[],abstained:false}).plan).toBe(complete);
    expect(()=>parseModelDraft('A topic',{text:DEMO_PLAN.replace('# Recap','# Other'),sourceIds:[],abstained:false})).toThrow(/missing recap/);
    expect(()=>parseModelDraft('A topic',{text:'Incomplete',sourceIds:[],abstained:false})).toThrow();
  });
  it('does not ask the model about unrelated questions without lesson evidence',()=>{
    expect(answerRequest(lesson,'What is the capital of Nigeria?')).toBeNull();
    expect(answerRequest(lesson,'Why?')).toBeNull();
    const req=answerRequest(lesson,'Explain voltage and resistance')!;
    expect(req.passages.length).toBeGreaterThan(0);
    expect(req.passages.length).toBeLessThanOrEqual(6);
    expect(req.passages.every(p=>p.text.length<=850)).toBe(true);
    expect(req.mode).toBe('answer');
  });
  it('rejects fabricated source identifiers and preserves original passage evidence',()=>{
    const req=answerRequest(lesson,'Explain voltage and resistance')!;
    expect(validateSuggestion(req,{text:'',sourceIds:[],abstained:true})).toBeNull();
    expect(()=>validateSuggestion(req,{text:'Fake',sourceIds:['no-such-passage'],abstained:false})).toThrow();
    expect(()=>validateSuggestion(req,{text:'No sources',sourceIds:[],abstained:false})).toThrow();
    const id=req.passages[0].id;
    expect(validateSuggestion(req,{text:'A suggestion',sourceIds:[id],abstained:false})).toEqual({text:'A suggestion',sources:[req.passages[0]]});
  });
});