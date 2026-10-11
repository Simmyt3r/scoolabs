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
    ['Record ID','Date','Student','Class','Subject','Experiment','Assignment ID','Observations','Conclusion','Score out of 100','Teacher feedback'],
    ...records.map(r=>[r.id,r.timestamp,r.student,r.classroom,r.subject,r.experimentTitle,r.assignmentId??'',r.observation,r.conclusion,r.grade??'',r.feedback??''])
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

export function assignmentProgress(assignments:ReadonlyArray<{id:string;classId:string}>,students:Student[],classes:Classroom[],records:LabRecord[]){
  return assignments.map(assignment=>{
    const roster=students.filter(student=>student.classId===assignment.classId);
    const submitted=records.filter(record=>record.assignmentId===assignment.id);
    const graded=submitted.filter(record=>record.grade!==null&&record.grade!==undefined&&Number.isInteger(record.grade)&&record.grade>=0&&record.grade<=100);
    return {assignmentId:assignment.id,className:classes.find(room=>room.id===assignment.classId)?.name??'Unknown class',enrolled:roster.length,submitted:submitted.length,graded:graded.length,missing:Math.max(0,roster.length-submitted.length)};
  });
}
