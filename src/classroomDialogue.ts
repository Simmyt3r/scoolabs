import {answerQuestion,type Lesson,type Reply} from './lessonEngine';
import {answerRequest,type ModelRequest,type ModelPassage} from './localTeacherModel';

export type DialogueIntent='follow_up'|'simplify'|'example';
export type DialogueTurn={id:number;section:number;question:string;reply:Reply};
export const HISTORY_LIMIT=20;
export type Adaptation={kind:DialogueIntent;anchor?:string};
export function recordTurn(turns:readonly DialogueTurn[],turn:DialogueTurn):DialogueTurn[]{
  const updated=turns.some(t=>t.id===turn.id)?turns.map(t=>t.id===turn.id?turn:t):[...turns,turn];
  return updated.slice(-HISTORY_LIMIT);
}
export function canFollowUp(turn:DialogueTurn):boolean{
  return turn.reply.kind==='approved'||turn.reply.kind==='reviewed-ai';
}
// Explicit very short reference questions may use the selected prior approved
// question as a retrieval anchor. All other questions must independently match.
const contextual=/^(why|how|what does (that|this|it) mean|what is the reason|can you explain (that|this|it)|explain (that|this|it)|tell me more|why is (that|this|it) so|how does (that|this|it) work)[?.!]*$/i;
export function followUpRequest(lesson:Lesson,question:string,anchor:DialogueTurn):ModelRequest|null{
  if(!canFollowUp(anchor)||!question.trim()||question.length>300)return null;
  const direct=answerRequest(lesson,question);
  const reference=contextual.test(question.trim())?answerRequest(lesson,anchor.question):null;
  const evidence=direct??reference;
  if(!evidence)return null;
  return {...evidence,input:question.trim(),adaptation:{kind:'follow_up',anchor:anchor.question.slice(0,300)}};
}
export function sectionAdaptation(lesson:Lesson,index:number,kind:'simplify'|'example'):{question:string;reply:Reply;request:ModelRequest}|null{
  const slide=lesson.slides[index];
  if(!slide)return null;
  const passage:ModelPassage={id:'L'+(index+1),text:(slide.title+'\n'+slide.text).slice(0,850)};
  // Only teacher-provided content. Additional worked examples are considered
  // when they independently overlap with the current slide's words.
  const related=kind==='example'?answerRequest(lesson,slide.text.slice(0,300))?.passages.filter(p=>p.id!==passage.id&&p.id.startsWith('L')).slice(0,3)??[]:[];
  const question=kind==='simplify'?'Explain this section in simpler words.':'Show an example using the approved lesson.';
  return {question,reply:{kind:'excerpt',text:slide.text,source:'Current approved section: '+slide.title},
    request:{mode:'answer',topic:lesson.topic,input:question,passages:[passage,...related],adaptation:{kind}}};
}
export function answerInContext(lesson:Lesson,question:string,anchor?:DialogueTurn):{reply:Reply;request:ModelRequest|null}{
  const reply=answerQuestion(lesson,question);
  if(reply.kind==='approved')return {reply,request:null};
  return {reply,request:anchor?followUpRequest(lesson,question,anchor):answerRequest(lesson,question)};
}
