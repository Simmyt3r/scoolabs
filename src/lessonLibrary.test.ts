import {describe,expect,it} from 'vitest';
import {DEMO_PLAN,DEMO_TOPIC,prepareLesson} from './lessonEngine';
import {importTextLesson,lessonReferences,makeLessonFile,parseLessonFile,referenceDraft} from './lessonLibrary';

describe('portable offline Smart Teacher lessons',()=>{
  it('round-trips the full topic, sections and approved answers',()=>{
    const file=makeLessonFile(DEMO_TOPIC,DEMO_PLAN);
    expect(parseLessonFile(JSON.stringify(file))).toEqual(file);
    expect(prepareLesson(file.topic,file.plan).questions).toHaveLength(3);
    expect(importTextLesson('\uFEFF# Introduction\nHello class.','Physics').plan).toBe('# Introduction\nHello class.');
  });
  it('rejects corrupt, oversized, unsupported and structurally invalid files',()=>{
    for(const raw of ['not JSON','null','[]','{"schema":"scoolabs.lesson","version":2}','x'.repeat(120001),JSON.stringify({...makeLessonFile(DEMO_TOPIC,DEMO_PLAN),plan:'Q: Missing answer?'})]){
      expect(()=>parseLessonFile(raw)).toThrow();
    }
    expect(()=>importTextLesson('x'.repeat(20002),'Physics')).toThrow();
  });
  it('builds reviewable drafts for every bundled atlas record, preserving facts and limitations',()=>{
    expect(lessonReferences.length).toBeGreaterThan(20);
    for(const ref of lessonReferences){
      const draft=referenceDraft(ref.id);
      const prepared=prepareLesson(draft.topic,draft.plan);
      expect(draft.topic).toBe(ref.title);
      expect(draft.plan).toContain(ref.overview);
      expect(draft.plan).toContain(ref.limitation);
      expect(draft.plan).toContain(ref.id);
      expect(prepared.questions[0].answer).toBe(ref.overview.replace(/[\r\n]+/g,' ').trim());
      if(ref.equation)expect(draft.plan).toContain(ref.equation);
      if(ref.workedExample)expect(draft.plan).toContain(ref.workedExample);
    }
    expect(()=>referenceDraft('not-a-valid-id')).toThrow(/Select/);
  });
});