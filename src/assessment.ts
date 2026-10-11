import type { LabRecord } from './store';

export const RUBRIC = [
  { id:'method', label:'Method and settings', maximum:25, hint:'Records usable experimental setup and variables' },
  { id:'observations', label:'Observations', maximum:35, hint:'Reports relevant outcomes with quantities where appropriate' },
  { id:'reasoning', label:'Scientific reasoning', maximum:30, hint:'Explains results and recognises model limitations' },
  { id:'clarity', label:'Report clarity', maximum:10, hint:'Uses a clear conclusion and understandable language' },
] as const;

export type RubricKey = typeof RUBRIC[number]['id'];
export type RubricScores = Record<RubricKey,number>;
export type RubricInputs = Record<RubricKey,string>;
export const EMPTY_RUBRIC:RubricInputs={method:'',observations:'',reasoning:'',clarity:''};
const PREFIX='Scoolabs rubric v1:';
const safe = (text:string)=>text.replace(/\r\n|\r/g,'\n').trim();

export function scoreRubric(inputs:RubricInputs):{scores:RubricScores;total:number}|null {
  const scores = {} as RubricScores;
  for(const criterion of RUBRIC){
    const raw=inputs[criterion.id].trim();
    const parsed=Number(raw);
    if(raw==='' || !Number.isInteger(parsed) || parsed<0 || parsed>criterion.maximum)return null;
    scores[criterion.id]=parsed;
  }
  return {scores,total:RUBRIC.reduce((sum,c)=>sum+scores[c.id],0)};
}
export function rubricFeedback(scores:RubricScores,comment:string):string {
  const values=RUBRIC.map(c=>scores[c.id]+'/'+c.maximum).join('; ');
  const note=safe(comment);
  return PREFIX+' '+values+'\n'+(note?'Teacher feedback: '+note:'');
}
export function parseRubricFeedback(text:string|null|undefined):{inputs:RubricInputs;comment:string}|null {
  if(!text?.startsWith(PREFIX))return null;
  const lines=text.split('\n');
  const raw=lines[0].slice(PREFIX.length).trim().split('; ');
  if(raw.length!==RUBRIC.length)return null;
  const inputs={...EMPTY_RUBRIC};
  for(let i=0;i<RUBRIC.length;i++){
    const criterion=RUBRIC[i];
    const match=raw[i].match(/^(\d+)\/(\d+)$/);
    if(!match || Number(match[2])!==criterion.maximum)return null;
    inputs[criterion.id]=match[1];
  }
  if(!scoreRubric(inputs))return null;
  const body=lines.slice(1).join('\n');
  return {inputs,comment:body.startsWith('Teacher feedback: ')?body.slice(18):body};
}

export function reportMetadata(record:LabRecord,assignmentTitle?:string){
  return {
    title:record.experimentTitle,
    student:record.student,
    classroom:record.classroom,
    experimentId:record.experimentId,
    subject:record.subject,
    date:record.timestamp,
    assignment:record.assignmentId?(assignmentTitle||'Assigned practical'):'Personal practical',
    settings:record.settings,
    observations:record.observation,
    conclusion:record.conclusion,
    grade:record.grade??null,
    feedback:record.feedback??'',
    rubric:parseRubricFeedback(record.feedback),
  };
}
