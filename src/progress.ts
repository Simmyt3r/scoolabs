import { experiments, type Subject } from './engine';
import type { LabRecord } from './store';
import type { Assignment, KnowledgeResult } from './native-storage';

/** Student-facing progress is activity tracking, never a declaration of mastery. */
export type SubjectActivity={
  subject:Subject;
  available:number;
  tried:number;
  reports:number;
  checked:number;
};

export type ProgressSummary={
  availablePracticals:number;
  triedPracticals:number;
  reportCount:number;
  pendingAssignments:number;
  assignedCount:number;
  submittedAssignments:number;
  assessedReports:number;
  awaitingMarking:number;
  averageTeacherScore:number|null;
  completedChecks:number;
  perfectChecks:number;
  subjectActivity:SubjectActivity[];
  nextAssignment:Assignment|null;
  nextExperimentId:string|null;
  recentFeedback:LabRecord[];
};

export function studentProgress(
  records:readonly LabRecord[],
  assignments:readonly Assignment[],
  checks:readonly KnowledgeResult[],
):ProgressSummary{
  const ready=experiments.filter(e=>e.ready);
  const tried=new Set(records.map(r=>r.experimentId));
  const linked=new Set(records.map(r=>r.assignmentId).filter((id):id is string=>typeof id==='string'&&id.length>0));
  const open=assignments.filter(a=>!linked.has(a.id));
  const graded=records.filter(r=>r.grade!==null&&r.grade!==undefined&&Number.isInteger(r.grade)&&r.grade>=0&&r.grade<=100);
  const assessed=graded.reduce((sum,r)=>sum+(r.grade??0),0);
  const checkIds=new Set(checks.filter(r=>r.correct>=0&&r.correct<=2&&ready.some(e=>e.id===r.experimentId)).map(r=>r.experimentId));
  const latest=new Map<string,KnowledgeResult>();
  for(const result of checks){
    if(!ready.some(e=>e.id===result.experimentId))continue;
    const previous=latest.get(result.experimentId);
    if(!previous||Date.parse(result.updatedAt)>Date.parse(previous.updatedAt))latest.set(result.experimentId,result);
  }
  const nextAssignment=open.find(a=>ready.some(e=>e.id===a.experimentId))??null;
  const nextUntried=ready.find(e=>!tried.has(e.id));
  const nextExperimentId=nextAssignment?.experimentId??nextUntried?.id??ready[0]?.id??null;
  const subjects:Subject[]=['chemistry','physics','biology','agriculture'];
  return {
    availablePracticals:ready.length,
    triedPracticals:ready.filter(e=>tried.has(e.id)).length,
    reportCount:records.length,
    pendingAssignments:open.length,
    assignedCount:assignments.length,
    submittedAssignments:assignments.length-open.length,
    assessedReports:graded.length,
    awaitingMarking:records.filter(r=>r.assignmentId&&linked.has(r.assignmentId)&&
      assignments.some(a=>a.id===r.assignmentId)&&
      (r.grade===null||r.grade===undefined)).length,
    averageTeacherScore:graded.length?Math.round(assessed/graded.length*10)/10:null,
    completedChecks:checkIds.size,
    perfectChecks:[...latest.values()].filter(r=>r.correct===2).length,
    subjectActivity:subjects.map(subject=>{
      const available=ready.filter(e=>e.subject===subject);
      return {
        subject,available:available.length,
        tried:available.filter(e=>tried.has(e.id)).length,
        reports:records.filter(r=>available.some(e=>e.id===r.experimentId)).length,
        checked:available.filter(e=>checkIds.has(e.id)).length
      };
    }),
    nextAssignment,
    nextExperimentId,
    recentFeedback:graded.filter(r=>typeof r.feedback==='string'&&r.feedback.trim().length>0)
      .slice().sort((a,b)=>b.timestamp.localeCompare(a.timestamp)).slice(0,3),
  };
}
