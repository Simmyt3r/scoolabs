import {circuit,germination,microscope,pendulum,type Crop} from './engine';
import type {Lesson,Reply} from './lessonEngine';

export const boardKinds=['none','circuit','pendulum','microscope','germination'] as const;
export type BoardKind=typeof boardKinds[number];
export type BoardState={kind:'none'}|{kind:'circuit';voltage:number;resistance:number}|{kind:'pendulum';length:number}|{kind:'microscope';objective:4|10|40}|{kind:'germination';crop:Crop;moisture:number;temperature:number;day:number};
export const boardLabels:Record<BoardKind,string>={none:'Lesson text only',circuit:'Ohm’s law · DC circuit',pendulum:'Simple pendulum',microscope:'Light microscope',germination:'Seed germination'};
export function newBoard(kind:BoardKind):BoardState{
  switch(kind){
    case 'circuit':return {kind,voltage:12,resistance:4};
    case 'pendulum':return {kind,length:1};
    case 'microscope':return {kind,objective:10};
    case 'germination':return {kind,crop:'maize',moisture:60,temperature:25,day:7};
    default:return {kind:'none'};
  }
}
// Suggestions only: never automatically display a diagram merely because a keyword occurred.
export function suggestBoard(topic:string):BoardKind{
  const t=topic.toLowerCase().replace(/[’']/g,'').trim();
  if(/^(ohms law|ohm law|electric circuit|dc circuit|simple circuit)$/.test(t))return 'circuit';
  if(/^(simple pendulum|pendulum|simple pendulum period)$/.test(t))return 'pendulum';
  if(/^(microscope|microscopy|using the microscope|light microscopy)$/.test(t))return 'microscope';
  if(/^(seed germination|germination)$/.test(t))return 'germination';
  return 'none';
}
export function boardReadout(board:BoardState):{formula:string;primary:string;secondary:string;note:string}{
  switch(board.kind){
    case 'circuit':{const r=circuit(board.voltage,board.resistance);return {formula:'V = I × R',primary:r.current.toFixed(2)+' A',secondary:r.power.toFixed(2)+' W',note:'Ideal ohmic resistor; constant conditions. Physical wiring requires adult supervision.'};}
    case 'pendulum':{const r=pendulum(board.length,10);return {formula:'T = 2π√(L/g)',primary:r.periodSeconds.toFixed(2)+' s',secondary:r.totalSeconds.toFixed(2)+' s',note:'Small-angle model; g = 9.81 m/s²; negligible air resistance.'};}
    case 'microscope':{const r=microscope(board.objective);return {formula:'Magnification = eyepiece × objective',primary:r.magnification+'×',secondary:r.fieldOfViewMm.toFixed(2)+' mm',note:'Illustrative cell shapes, not a real microscope image. Field-of-view model uses an 18 mm field number.'};}
    case 'germination':{const r=germination(board.crop,board.moisture,board.temperature,board.day);return {formula:'Seed germination · illustrative model',primary:r.percentage+'%',secondary:r.heightCm.toFixed(1)+' cm',note:'Illustrative classroom prediction; not a validated crop or field forecast.'};}
    default:return {formula:'',primary:'',secondary:'',note:''};
  }
}
export type PublicFrame={
  mode:'waiting'|'lesson'|'question'|'assessment'|'finished'|'blank';
  topic:string;title:string;text:string;section:number;total:number;status:string;
  elapsedSeconds:number;targetMinutes:number;board:BoardState;
  response?:string;source?:string;
};
export type PublicFrameInput={
  lesson:Lesson|null;index:number;finished:boolean;questionsOpen:boolean;quizIndex:number|null;revealed:boolean;
  exchange:{question:string;reply:Reply}|null;blank:boolean;speech:string;listening:boolean;
  elapsedSeconds:number;targetMinutes:number;board:BoardState;
};
// Only this allowlisted object is ever published to the TV. Unsubmitted text, model
// suggestions, model status, lesson plan, evidence and unrevealed answers are not fields.
export function publicFrame(input:PublicFrameInput):PublicFrame{
  const {lesson,index,finished,questionsOpen,quizIndex,revealed,exchange,blank,speech,listening,elapsedSeconds,targetMinutes,board}=input;
  const base:PublicFrame={mode:'waiting',topic:'',title:'Waiting for the lesson',text:'The teacher will start shortly.',section:0,total:0,status:'Ready',elapsedSeconds:0,targetMinutes,board:{kind:'none'}};
  if(!lesson)return base;
  const frame={...base,topic:lesson.topic,section:Math.min(index+1,lesson.slides.length),total:lesson.slides.length,elapsedSeconds,
    status:listening?'Listening':speech==='speaking'?'Speaking':speech==='paused'?'Paused':speech==='checkpoint'?'Discussion':'Ready'};
  if(blank)return {...base,mode:'blank',title:'Classroom pause',text:'Please wait for your teacher.'};
  if(finished&&!questionsOpen&&quizIndex===null)return {...frame,mode:'finished',title:'Well done, class.',text:'Review the lesson and discuss any remaining questions.'};
  if(questionsOpen){
    if(!exchange)return {...frame,mode:'question',title:'Questions and answers',text:'Raise your hand or ask your teacher a question.'};
    return {...frame,mode:'question',title:'Questions and answers',text:exchange.question,response:exchange.reply.text,
      source:exchange.reply.source+(exchange.reply.kind==='excerpt'?' · Related excerpt, not a verified answer.':'')};
  }
  const quiz=quizIndex===null?null:lesson.questions[quizIndex];
  if(quiz)return {...frame,mode:'assessment',title:'Class check',text:quiz.question,...(revealed?{response:quiz.answer,source:'Approved answer'}:{})};
  const slide=lesson.slides[index];
  return slide?{...frame,mode:'lesson',title:slide.title,text:slide.text,board}:base;
}
export function elapsedClock(seconds:number){
  const s=Math.max(0,Math.floor(seconds));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
