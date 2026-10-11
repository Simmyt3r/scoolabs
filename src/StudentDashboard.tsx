import {ArrowRight, BookOpen, ClipboardCheck, ClipboardList, FlaskConical, GraduationCap, Microscope, Sprout, Zap} from 'lucide-react';
import {experiments, type Subject} from './engine';
import type {LabRecord} from './store';
import type {Assignment,KnowledgeResult} from './native-storage';
import {studentProgress} from './progress';
import {parseRubricFeedback} from './assessment';

const meta:Record<Subject,{name:string;icon:typeof FlaskConical;theme:string}>={
  chemistry:{name:'Chemistry',icon:FlaskConical,theme:'purple'},
  physics:{name:'Physics',icon:Zap,theme:'blue'},
  biology:{name:'Biology',icon:Microscope,theme:'green'},
  agriculture:{name:'Agriculture',icon:Sprout,theme:'orange'}
};
type Props={
  records:LabRecord[];
  assignments:Assignment[];
  checks:KnowledgeResult[];
  studentName:string;
  classroom:string;
  isPreview:boolean;
  onOpenExperiment:(id:string)=>void;
  onAssignments:()=>void;
  onNotebook:()=>void;
};
export default function StudentDashboard({records,assignments,checks,studentName,classroom,isPreview,onOpenExperiment,onAssignments,onNotebook}:Props){
  const progress=studentProgress(records,assignments,checks);
  const next=experiments.find(e=>e.id===progress.nextExperimentId);
  const firstName=studentName.trim().split(/\s+/)[0]||'student';
  return <section className="student-dashboard" aria-label="Student progress dashboard">
    <div className="page-title"><div><span className="eyebrow">YOUR OFFLINE LEARNING SPACE</span>
      <h1>Welcome, {firstName}</h1>
      <p>{classroom?classroom+' · ':''}A clear overview of the practicals you have tried and the work still ahead.</p></div>
      <div className="progress-badge"><GraduationCap size={20}/><div><strong>Learning overview</strong><small>{isPreview?'Browser preview':'Stored on this computer'}</small></div></div>
    </div>
    {isPreview&&<div className="record-note"><BookOpen size={17}/> Browser preview mode. These figures use local browser notebook data. Secure student accounts and assignment grades require the installed desktop application.</div>}
    <div className="learning-stats">
      <div><span>Practicals tried</span><strong>{progress.triedPracticals}<small> / {progress.availablePracticals}</small></strong><small>Different laboratory experiments with saved reports</small></div>
      <div><span>Reports saved</span><strong>{progress.reportCount}</strong><small>{progress.assessedReports} marked by a teacher</small></div>
      <div><span>Assignments pending</span><strong>{progress.pendingAssignments}</strong><small>{progress.submittedAssignments} of {progress.assignedCount} submitted</small></div>
      <div><span>Self-checks attempted</span><strong>{progress.completedChecks}<small> / {progress.availablePracticals}</small></strong><small>{progress.perfectChecks} with both answers correct</small></div>
    </div>
    <div className="learning-panels">
      <section className="learning-panel learning-next">
        <div className="learning-panel-heading"><div><span className="eyebrow">RECOMMENDED NEXT STEP</span><h2>{progress.nextAssignment?'Your next assignment':'Continue your learning'}</h2></div></div>
        {next?<><h3>{progress.nextAssignment?.title??next.title}</h3>
          <p>{progress.nextAssignment?.instructions||next.description}</p>
          <div className="next-practical-meta"><span>{meta[next.subject].name}</span><span>{next.level}</span><span>About {next.minutes} min</span></div>
          <button className="button-primary" onClick={()=>onOpenExperiment(next.id)}>Open practical <ArrowRight size={17}/></button>
        </>:<p>No practical is currently available.</p>}
        <div className="learning-next-links"><button className="text-button" onClick={onAssignments}>View class assignments <ArrowRight size={15}/></button>
          <button className="text-button" onClick={onNotebook}>Open my notebook <ArrowRight size={15}/></button></div>
      </section>
      <section className="learning-panel"><div className="learning-panel-heading"><div><span className="eyebrow">SUBJECT ACTIVITY</span><h2>By science subject</h2></div></div>
        <div className="learning-subjects">{progress.subjectActivity.map(item=>{
          const subject=meta[item.subject],Icon=subject.icon;
          const pct=item.available?Math.round(item.tried/item.available*100):0;
          return <div className="learning-subject" key={item.subject}>
            <div className="learning-subject-row"><Icon size={16}/><strong>{subject.name}</strong><span>{item.tried}/{item.available} tried</span></div>
            <div className="learning-meter" role="progressbar" aria-label={subject.name+' practicals tried'} aria-valuemin={0} aria-valuemax={item.available} aria-valuenow={item.tried}>
              <span className={'learning-fill '+subject.theme} style={{width:pct+'%'}}/>
            </div><small>{item.reports} reports · {item.checked} self-checks</small>
          </div>;
        })}</div>
        <p className="learning-explainer">Activity counts describe participation, not scientific mastery or certification.</p>
      </section>
    </div>
    <div className="learning-panels">
      <section className="learning-panel"><div className="learning-panel-heading"><div><span className="eyebrow">CLASS ASSIGNMENTS</span><h2>Submission progress</h2></div><ClipboardList size={19}/></div>
        {assignments.length?<><div className="learning-metric"><strong>{progress.submittedAssignments}/{progress.assignedCount}</strong><span>Assigned practicals submitted</span></div>
          <p>{progress.pendingAssignments} awaiting submission. {progress.awaitingMarking} submitted reports awaiting a teacher mark.</p></>:
          <p>No class assignments currently assigned to this student{isPreview?' in browser preview':''}.</p>}
        <button className="text-button" onClick={onAssignments}>Open assignments <ArrowRight size={14}/></button>
      </section>
      <section className="learning-panel"><div className="learning-panel-heading"><div><span className="eyebrow">TEACHER ASSESSMENT</span><h2>Your feedback</h2></div><ClipboardCheck size={19}/></div>
        <div className="learning-metric"><strong>{progress.averageTeacherScore===null?'Not marked':progress.averageTeacherScore+'/100'}</strong><span>{progress.assessedReports} officially marked reports</span></div>
        {progress.recentFeedback.length>0?<div className="learning-feedback">{progress.recentFeedback.map(r=><div key={r.id}>
          <strong>{r.experimentTitle} · {r.grade}/100</strong><p>{parseRubricFeedback(r.feedback)?.comment||r.feedback}</p>
        </div>)}</div>:<p>Teacher comments will appear here after your practical reports are marked.</p>}
        <button className="text-button" onClick={onNotebook}>Review practical reports <ArrowRight size={14}/></button>
      </section>
    </div>
  </section>;
}
