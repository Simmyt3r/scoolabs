import {describe,expect,it} from 'vitest';
import {answerQuestion,DEMO_PLAN,DEMO_TOPIC,prepareLesson} from './smartTeacher';

describe('Smart Teacher classroom preparation and grounded questioning',()=>{
  it('separates teaching notes from the approved question bank',()=>{
    const lesson=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
    expect(lesson.slides).toHaveLength(6);
    expect(lesson.questions).toHaveLength(3);
    expect(lesson.slides.map(s=>s.title)).toContain('Class activity');
    expect(lesson.slides.every(s=>!s.text.includes('Q:'))).toBe(true);
  });
  it('supports plain pasted notes and breaks lengthy material into readable sections',()=>{
    const text='This is a teacher-provided sentence. '.repeat(70).trim();
    const lesson=prepareLesson('Science',text);
    expect(lesson.slides.length).toBeGreaterThan(1);
    expect(lesson.slides.every(s=>s.text.length<=620)).toBe(true);
    expect(lesson.slides.map(s=>s.text).join(' ')).toBe(text);
  });
  it('rejects invalid or incomplete input instead of inventing lesson content',()=>{
    expect(()=>prepareLesson('','Some notes')).toThrow(/topic/);
    expect(()=>prepareLesson('Physics','')).toThrow(/lesson plan/);
    expect(()=>prepareLesson('Physics','# Intro\nNotes\nQ: What is this?')).toThrow(/answer/);
    expect(()=>prepareLesson('Physics','Q: Question?\nA: Answer.')).toThrow(/lesson content/);
    expect(()=>prepareLesson('Physics','A: An orphan answer.')).toThrow(/follow/);
    expect(()=>prepareLesson('Physics','x'.repeat(20001))).toThrow(/20,000/);
  });
  it('repeats the exact approved answer and labels related excerpts',()=>{
    const lesson=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
    expect(answerQuestion(lesson,"WHAT IS THE FORMULA FOR OHM'S LAW?")).toMatchObject({kind:'approved',text:'Voltage equals current multiplied by resistance: V = I × R.'});
    const reply=answerQuestion(lesson,'Explain constant temperature');
    expect(reply.kind).toBe('excerpt');
    expect(lesson.slides.some(s=>s.text===reply.text)).toBe(true);
    expect(reply.source).toContain('Related lesson excerpt');
  });
  it('defers unrelated or weakly matched questions to the supervisor',()=>{
    const lesson=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
    for(const q of ['What is the capital of Nigeria?', 'why?', 'how does voltage cause cancer?', 'What?', '']){
      expect(answerQuestion(lesson,q).kind).toBe('unanswered');
    }
  });
});