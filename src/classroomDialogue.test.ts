import {describe,it,expect} from 'vitest';
import {prepareLesson,DEMO_PLAN,DEMO_TOPIC,answerQuestion} from './lessonEngine';
import {answerInContext,canFollowUp,followUpRequest,HISTORY_LIMIT,recordTurn,sectionAdaptation,type DialogueTurn} from './classroomDialogue';
import {newBoard,publicFrame,type PublicFrameInput} from './classroomBoard';
const lesson=prepareLesson(DEMO_TOPIC,DEMO_PLAN);
const question="What is the formula for Ohm's law?";
const approved:DialogueTurn={id:1,section:0,question,reply:answerQuestion(lesson,question)};
describe('adaptive classroom dialogue',()=>{
  it('anchors explicit short follow-ups to approved questions without treating previous answers as evidence',()=>{
    expect(canFollowUp(approved)).toBe(true);
    const request=followUpRequest(lesson,'Why?',{...approved,reply:{kind:'reviewed-ai',text:'UNAPPROVED FACT NEVER USE',source:'Supervisor reviewed'}});
    expect(request?.adaptation).toEqual({kind:'follow_up',anchor:question});
    expect(request?.input).toBe('Why?');
    expect(request?.passages.length).toBeGreaterThan(0);
    expect(JSON.stringify(request)).not.toContain('UNAPPROVED FACT');
    expect(followUpRequest(lesson,'What is the capital of Nigeria?',approved)).toBeNull();
    expect(followUpRequest(lesson,'Why?',{...approved,reply:{kind:'excerpt',text:'Prior excerpt',source:'Excerpt'}})).toBeNull();
    expect(answerInContext(lesson,question,approved).request).toBeNull();
    expect(answerInContext(lesson,'Why?').request).toBeNull();
  });
  it('prepares the simpler explanation from the selected approved section',()=>{
    const next=sectionAdaptation(lesson,3,'simplify')!;
    expect(next.reply.kind).toBe('excerpt');
    expect(next.reply.text).toBe(lesson.slides[3].text);
    expect(next.request.adaptation).toEqual({kind:'simplify'});
    expect(next.request.passages).toEqual([{id:'L4',text:lesson.slides[3].title+'\n'+lesson.slides[3].text}]);
    expect(sectionAdaptation(lesson,3,'example')?.request.adaptation).toEqual({kind:'example'});
    expect(sectionAdaptation(lesson,900,'example')).toBeNull();
  });
  it('retains only the latest 20 entries and replaces a reviewed turn without duplication',()=>{
    let history:DialogueTurn[]=[];
    for(let i=0;i<HISTORY_LIMIT+2;i++)history=recordTurn(history,{...approved,id:i});
    expect(history.length).toBe(HISTORY_LIMIT);expect(history[0].id).toBe(2);
    history=recordTurn(history,{...history[0],reply:{kind:'reviewed-ai',text:'New approved text',source:'Reviewed'}});
    expect(history.length).toBe(HISTORY_LIMIT);expect(history[0].reply.text).toBe('New approved text');
  });
  it('does not expose private conversation history in the public frame',()=>{
    const input:PublicFrameInput&{history:DialogueTurn[]}={lesson,index:0,finished:false,questionsOpen:true,quizIndex:null,revealed:false,exchange:approved,blank:false,speech:'idle',listening:false,elapsedSeconds:0,targetMinutes:40,board:newBoard('none'),history:[{...approved,question:'PRIVATE PRIOR QUESTION'}]};
    const frame=publicFrame(input);
    expect(frame.text).toBe(question);
    expect(JSON.stringify(frame)).not.toContain('PRIVATE PRIOR QUESTION');
  });
});
