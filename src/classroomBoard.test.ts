import {describe,expect,it} from 'vitest';
import {boardReadout,elapsedClock,newBoard,publicFrame,suggestBoard,type PublicFrameInput} from './classroomBoard';
import {prepareLesson,DEMO_TOPIC,DEMO_PLAN} from './lessonEngine';

describe('classroom whiteboard and presentation privacy',()=>{
  const lesson=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
  const base:PublicFrameInput={lesson,index:0,finished:false,questionsOpen:false,quizIndex:null,revealed:false,exchange:null,blank:false,speech:'idle',listening:false,elapsedSeconds:70,targetMinutes:40,board:newBoard('circuit')};
  it('calculates readouts using the simulation engines',()=>{
    expect(boardReadout(newBoard('circuit')).primary).toBe('3.00 A');
    expect(boardReadout({kind:'circuit',voltage:24,resistance:4}).primary).toBe('6.00 A');
    expect(boardReadout(newBoard('pendulum')).primary).toBe('2.01 s');
    expect(boardReadout({kind:'microscope',objective:40}).primary).toBe('400×');
    expect(boardReadout(newBoard('germination')).primary).toMatch(/^\d+%$/);
    expect(suggestBoard("Ohm’s Law")).toBe('circuit');
    expect(suggestBoard("not Ohm's law")).toBe('none');
    expect(elapsedClock(70)).toBe('1:10');
  });
  it('only publishes the current approved slide, never arbitrary private inputs',()=>{
    const privateInput={...base,modelSuggestion:'private AI answer',plan:'private plan',question:'unsubmitted transcript'};
    const frame=publicFrame(privateInput);
    expect(frame.mode).toBe('lesson');expect(frame.title).toBe('Introduction');
    expect(frame.board.kind).toBe('circuit');
    expect(JSON.stringify(frame)).not.toMatch(/private|unsubmitted|modelSuggestion|lessonPassages/);
    expect(frame).not.toHaveProperty('response');
  });
  it('hides unrevealed assessment answers and suppresses diagrams during questions',()=>{
    const hidden=publicFrame({...base,quizIndex:0});
    expect(hidden.mode).toBe('assessment');
    expect(hidden).not.toHaveProperty('response');
    expect(JSON.stringify(hidden)).not.toContain(lesson.questions[0].answer);
    expect(hidden.board.kind).toBe('none');
    const revealed=publicFrame({...base,quizIndex:0,revealed:true});
    expect(revealed.response).toBe(lesson.questions[0].answer);
    const question=publicFrame({...base,questionsOpen:true,exchange:{question:'What is the formula?',reply:{kind:'approved',text:'V = IR.',source:'Approved'}}});
    expect(question.response).toBe('V = IR.');
    expect(question.board.kind).toBe('none');
  });
  it('blank and waiting frames contain no lesson content',()=>{
    for(const input of [{...base,blank:true},{...base,lesson:null}]){
      const frame=publicFrame(input);
      expect(frame.topic).toBe('');expect(frame.section).toBe(0);
      expect(frame.board.kind).toBe('none');expect(frame).not.toHaveProperty('response');
      expect(JSON.stringify(frame)).not.toContain(DEMO_TOPIC);
    }
  });
});
