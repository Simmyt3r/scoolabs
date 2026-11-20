import {describe,it,expect} from 'vitest';
import {prepareLesson,DEMO_PLAN,DEMO_TOPIC} from './lessonEngine';
import {discussionDelay,needsSupervisor,parseTeachingCue,queueQuestion,removeQueuedQuestion,QUEUE_LIMIT} from './teachingCues';
import {publicFrame,newBoard,type PublicFrameInput} from './classroomBoard';

describe('lesson-directed classroom orchestration',()=>{
  it('uses explicit cues but keeps all commands out of narrated text and evidence',()=>{
    const l=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
    expect(l.slides[0].cue).toBeUndefined();
    expect(l.slides[2].cue?.board).toEqual({kind:'circuit',voltage:12,resistance:4});
    expect(l.slides[3].cue?.board).toEqual({kind:'circuit',voltage:6,resistance:3});
    expect(l.slides[4].cue).toEqual({board:{kind:'none'},hold:true,discussionSeconds:30});
    expect(l.slides.every(s=>!s.text.includes('@board')&&!s.text.includes('@pause')&&!s.text.includes('@discuss'))).toBe(true);
  });
  it('validates supported visual parameters and holds',()=>{
    expect(parseTeachingCue('@board pendulum 0.5',{})).toEqual({board:{kind:'pendulum',length:0.5}});
    expect(parseTeachingCue('@board microscope 40',{})).toEqual({board:{kind:'microscope',objective:40}});
    expect(parseTeachingCue('@board germination maize 60 25 7',{})).toEqual({board:{kind:'germination',crop:'maize',moisture:60,temperature:25,day:7}});
    for(const line of ['@board circuit 12 0','@board circuit 25 4','@board pendulum NaN','@board microscope 20','@board germination cowpea 90 25 7.5','@board custom https://test.invalid','@pause now','@discuss 0','@discuss 181','@discuss 5.5','@board circuit 6 3 extra']){
      expect(()=>parseTeachingCue(line,{})).toThrow(/Invalid teaching cue/);
    }
    expect(()=>parseTeachingCue('@board none',{board:newBoard('circuit')})).toThrow();
    expect(()=>parseTeachingCue('@pause',{hold:true})).toThrow();
    expect(needsSupervisor('Demonstration',{hold:true})).toBe(true);
    expect(needsSupervisor('Class activity')).toBe(true);
    expect(needsSupervisor('Explanation')).toBe(false);
    expect(discussionDelay(20,{discussionSeconds:60})).toBe(60);
    expect(discussionDelay(20)).toBe(20);
  });
  it('rejects misplaced or empty-section directives and preserves legacy files',()=>{
    for(const plan of ['# Intro\nNotes\n@pause','# Intro\n@board none','# Intro\nNotes\n# Questions and answers\n@pause\nQ: Q?\nA: A.','# Intro\n@board circuit 12 0\nNotes']){
      expect(()=>prepareLesson('Science',plan)).toThrow();
    }
    expect(prepareLesson('Science','# Explanation\nOrdinary lesson.').slides).toEqual([{title:'Explanation',text:'Ordinary lesson.'}]);
  });
  it('deduplicates, bounds and removes private queued questions',()=>{
    const q=queueQuestion([],'  Explain   voltage  ');
    expect(q).toEqual(['Explain voltage']);
    expect(()=>queueQuestion(q,'explain voltage')).toThrow(/already waiting/);
    expect(()=>queueQuestion(q,'')).toThrow();
    expect(()=>queueQuestion([], 'x'.repeat(301))).toThrow();
    expect(()=>queueQuestion(Array.from({length:QUEUE_LIMIT},(_,i)=>'Q'+i),'A new question')).toThrow(/full/);
    expect(removeQueuedQuestion(q,'EXPLAIN VOLTAGE')).toEqual([]);
    const lesson=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
    const input:PublicFrameInput&{queue:string[]}={lesson,index:0,finished:false,questionsOpen:true,quizIndex:null,revealed:false,exchange:null,blank:false,speech:'idle',listening:false,elapsedSeconds:0,targetMinutes:40,board:newBoard('none'),queue:['PRIVATE QUEUED QUESTION']};
    expect(JSON.stringify(publicFrame(input))).not.toContain('PRIVATE QUEUED QUESTION');
  });
});
