import {newBoard,type BoardState} from './classroomBoard';

export type TeachingCue={board?:BoardState;hold?:true;discussionSeconds?:number};
const invalid=()=>new Error('Invalid teaching cue. Use @board with approved settings, @pause, or @discuss 5–180.');
function number(raw:string|undefined,min:number,max:number,integer=false){
  if(!raw||!(/^\d+(?:\.\d+)?$/.test(raw)))throw invalid();
  const n=Number(raw);
  if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw invalid();
  return n;
}
// Only exact allowlisted directives are parsed; no HTML, URLs, scripts or arbitrary tool calls.
export function parseTeachingCue(line:string,current:TeachingCue):TeachingCue|null{
  if(!/^@(board|pause|discuss)\b/i.test(line))return null;
  const [command,...args]=line.trim().toLowerCase().split(/\s+/);
  if(command==='@pause'){
    if(args.length||current.hold)throw invalid();
    return {...current,hold:true};
  }
  if(command==='@discuss'){
    if(args.length!==1||current.discussionSeconds!==undefined)throw invalid();
    return {...current,discussionSeconds:number(args[0],5,180,true)};
  }
  if(command!=='@board'||current.board)throw invalid();
  const [kind,...values]=args;
  let board:BoardState;
  switch(kind){
    case 'none':
      if(values.length)throw invalid();board=newBoard('none');break;
    case 'circuit':
      if(values.length!==2)throw invalid();board={kind,voltage:number(values[0],0,24),resistance:number(values[1],1,100)};break;
    case 'pendulum':
      if(values.length!==1)throw invalid();board={kind,length:number(values[0],0.1,2)};break;
    case 'microscope':{
      if(values.length!==1||!['4','10','40'].includes(values[0]))throw invalid();
      board={kind,objective:Number(values[0]) as 4|10|40};break;
    }
    case 'germination':{
      if(values.length!==4)throw invalid();
      const crop=values[0];
      if(crop!=='maize'&&crop!=='cowpea'&&crop!=='rice')throw invalid();
      board={kind,crop,moisture:number(values[1],0,100),temperature:number(values[2],0,55),day:number(values[3],0,21,true)};break;
    }
    default:throw invalid();
  }
  return {...current,board};
}
export function needsSupervisor(title:string,cue?:TeachingCue):boolean{
  return !!cue?.hold||/activity|exercise|discussion|practice|assessment/i.test(title);
}
export function discussionDelay(defaultSeconds:number,cue?:TeachingCue):number{
  return cue?.discussionSeconds??defaultSeconds;
}
export const QUEUE_LIMIT=20;
const key=(s:string)=>s.trim().replace(/\s+/g,' ').toLowerCase();
export function queueQuestion(queue:readonly string[],raw:string):string[]{
  const clean=raw.trim().replace(/\s+/g,' ');
  if(!clean||clean.length>300)throw new Error('Enter a question of 1–300 characters.');
  if(queue.some(q=>key(q)===key(clean)))throw new Error('This question is already waiting.');
  if(queue.length>=QUEUE_LIMIT)throw new Error('The question queue is full. Answer or remove a question first.');
  return [...queue,clean];
}
export function removeQueuedQuestion(queue:readonly string[],question:string):string[]{
  return queue.filter(q=>key(q)!==key(question));
}
