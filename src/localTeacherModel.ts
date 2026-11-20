import type {Adaptation} from './classroomDialogue';
import {prepareLesson,type Lesson} from './lessonEngine';
import {lessonReferences,makeLessonFile,type LessonFile} from './lessonLibrary';
export type ModelPassage={id:string;text:string};
export type ModelRequest={mode:'draft'|'answer';topic:string;input:string;passages:ModelPassage[];adaptation?:Adaptation};
export type ModelResult={text:string;sourceIds:string[];abstained:boolean};
export type ModelSuggestion={text:string;sources:ModelPassage[]};
const tokens=(s:string)=>s.toLowerCase().normalize('NFKC').replace(/[’']/g,'').split(/[^\p{L}\p{N}]+/u)
  .filter(t=>t.length>1&&!new Set('a an the is are of to for from in on at by and or what why how when where which who do does did can could would should please tell me explain about this that with as be if'.split(' ')).has(t));
const unique=(s:string)=>[...new Set(tokens(s))];

export function draftRequest(topic:string,outline:string,referenceId:string):ModelRequest{
  if(!topic.trim()||topic.trim().length>150)throw new Error('Enter a lesson topic of 1–150 characters.');
  if(!outline.trim()||outline.length>6000)throw new Error('Enter a teaching outline of 1–6,000 characters.');
  const ref=lessonReferences.find(x=>x.id===referenceId);
  if(referenceId&&!ref)throw new Error('Select an available local reference.');
  const passages:ModelPassage[]=ref?[{id:'R1',text:[ref.title,ref.overview,ref.equation,ref.workedExample,ref.observation,ref.limitation].filter(Boolean).join('\n').slice(0,850)}]:[];
  return {mode:'draft',topic:topic.trim(),input:outline.trim(),passages};
}
export function parseModelDraft(topic:string,result:ModelResult):LessonFile{
  if(result.abstained||!result.text||result.sourceIds.length)throw new Error('The model did not return a usable lesson draft.');
  const lesson=prepareLesson(topic,result.text);
  const headings=lesson.slides.map(s=>s.title.toLowerCase().replace(/\s+\(\d+\/\d+\)$/,''));
  for(const name of ['introduction','learning objectives','explanation','worked example','class activity','recap']){
    if(!headings.includes(name))throw new Error('The generated draft is incomplete: missing '+name+'. Try again or prepare notes manually.');
  }
  if(lesson.questions.length<2)throw new Error('The generated draft needs at least two question/answer pairs.');
  return makeLessonFile(topic,result.text);
}
export function answerRequest(lesson:Lesson,question:string):ModelRequest|null{
  const terms=unique(question);
  if(!question.trim()||question.length>300||!terms.length)return null;
  const candidates:ModelPassage[]=[
    ...lesson.slides.map((s,i)=>({id:'L'+(i+1),text:(s.title+'\n'+s.text).slice(0,850)})),
    ...lesson.questions.map((q,i)=>({id:'Q'+(i+1),text:('Approved Q: '+q.question+'\nA: '+q.answer).slice(0,850)}))
  ];
  const passages=candidates.map(p=>{
    const words=new Set(unique(p.text));
    return {p,matched:terms.filter(t=>words.has(t)).length};
  }).filter(x=>terms.length===1?terms[0].length>=4&&x.matched===1:x.matched>=2&&x.matched/terms.length>=0.5)
    .sort((a,b)=>b.matched-a.matched).slice(0,6).map(x=>x.p);
  return passages.length?{mode:'answer',topic:lesson.topic,input:question.trim(),passages}:null;
}
export function validateSuggestion(request:ModelRequest,result:ModelResult):ModelSuggestion|null{
  if(request.mode!=='answer')throw new Error('Invalid response context.');
  if(result.abstained)return null;
  if(!result.text.trim()||result.text.length>1800||!result.sourceIds.length||new Set(result.sourceIds).size!==result.sourceIds.length)throw new Error('The model answer has missing or invalid evidence.');
  const sources=result.sourceIds.map(id=>request.passages.find(p=>p.id===id));
  if(sources.some(p=>!p))throw new Error('The model cited a passage that was not supplied.');
  return {text:result.text,sources:sources as ModelPassage[]};
}
