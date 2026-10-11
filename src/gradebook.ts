import type { LabRecord } from './store';
import type { Classroom, Student } from './native-storage';

export function gradebookSummary(classes:Classroom[],students:Student[],records:LabRecord[]) {
  return classes.map(room=>{
    const inClass=records.filter(r=>r.classroom.trim().toLowerCase()===room.name.trim().toLowerCase());
    const marked=inClass.filter(r=>Number.isInteger(r.grade)&&r.grade!==null&&r.grade!==undefined&&r.grade>=0&&r.grade<=100);
    const total=marked.reduce((sum,r)=>sum+(r.grade??0),0);
    return {id:room.id,name:room.name,students:students.filter(s=>s.classId===room.id).length,submitted:inClass.length,graded:marked.length,average:marked.length?Math.round(total/marked.length*10)/10:null};
  });
}
function cell(value:string|number|null|undefined) {
  const raw=value===null||value===undefined?'':String(value);
  // Prevent spreadsheet applications from executing formulas supplied in reports.
  const safe=/^[\s]*[=+\-@\t\r]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replace(/"/g,'""').replace(/\r\n|\r/g,'\n')+'"';
}
export function makeGradebookCsv(records:LabRecord[]):string {
  const rows=[
    ['Record ID','Date','Student','Class','Subject','Experiment','Observations','Conclusion','Score out of 100','Teacher feedback'],
    ...records.map(r=>[r.id,r.timestamp,r.student,r.classroom,r.subject,r.experimentTitle,r.observation,r.conclusion,r.grade??'',r.feedback??''])
  ];
  return '\uFEFF'+rows.map(row=>row.map(x=>cell(x)).join(',')).join('\r\n')+'\r\n';
}
export function downloadGradebook(records:LabRecord[]){
  const data=new Blob([makeGradebookCsv(records)],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(data);
  const link=document.createElement('a');
  link.href=url;link.download='scoolabs-teacher-gradebook.csv';document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
