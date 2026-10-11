import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, GraduationCap, LockKeyhole, LogOut, Plus, ShieldCheck, Users } from 'lucide-react';
import { experiments } from './engine';
import { backupSchoolDatabase, listSchoolBackups, restoreSchoolBackup, teacherAccessCodes, resetStudentPin, type StudentEnrolment, type SchoolBackup, addTeacher, createAssignment, createClass, enrollStudent, gradeRecord, loginTeacher, logoutTeacher, setupTeacher, teacherAccounts, teacherSnapshot, type TeacherAccount, type TeacherSession, type TeacherSnapshot } from './native-storage';
import type { LabRecord } from './store';
import { gradebookSummary, downloadGradebook } from './gradebook';

function GradeEntry({record,token,refresh}:{record:LabRecord;token:string;refresh:()=>Promise<void>}) {
  const [score,setScore]=useState(String(record.grade??''));
  const [feedback,setFeedback]=useState(record.feedback??'');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function grade(){
    const parsed=Number(score);
    if(score.trim()==='' || !Number.isInteger(parsed)||parsed<0||parsed>100){setError('Use a whole score from 0 to 100.');return;}
    setBusy(true);setError('');
    try{await gradeRecord(token,record.id,parsed,feedback);await refresh();}
    catch(e){setError(String(e))}
    finally{setBusy(false)}
  }
  return <div className="teacher-record" key={record.id}>
    <div className="teacher-record-main"><strong>{record.student}</strong><small>{record.classroom} · {record.experimentTitle} · {new Date(record.timestamp).toLocaleString()}</small><span>{record.observation}</span>{record.conclusion&&<span>Conclusion: {record.conclusion}</span>}</div>
    <div className="grade-fields"><label>Score / 100<input aria-label={'Score for '+record.student} type="number" value={score} min="0" max="100" onChange={e=>setScore(e.target.value)}/></label><label>Feedback<input aria-label={'Feedback for '+record.student} type="text" maxLength={2000} placeholder="Comment on report" value={feedback} onChange={e=>setFeedback(e.target.value)}/></label><button disabled={busy} className="button-outline" onClick={grade}>{busy?'Saving':'Mark'}</button></div>
    {error&&<div role="alert" className="error-message">{error}</div>}
  </div>;
}
export default function TeacherPanel() {
  const [accounts,setAccounts]=useState<TeacherAccount[]>([]);
  const [loading,setLoading]=useState(true);
  const [backupPath,setBackupPath]=useState('');
  const [backups,setBackups]=useState<SchoolBackup[]>([]);
  const [restoreName,setRestoreName]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [session,setSession]=useState<TeacherSession|null>(null);
  const [snapshot,setSnapshot]=useState<TeacherSnapshot|null>(null);
  const [name,setName]=useState('');
  const [pin,setPin]=useState('');
  const [teacherId,setTeacherId]=useState('');
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [className,setClassName]=useState('');
  const [level,setLevel]=useState('SS 1');
  const [classId,setClassId]=useState('');
  const [studentName,setStudentName]=useState('');
  const [studentPin,setStudentPin]=useState('');
  const [accessCodes,setAccessCodes]=useState<StudentEnrolment[]>([]);
  const [issued,setIssued]=useState<{name:string;code:string;pin:string}|null>(null);
  const [resetPins,setResetPins]=useState<Record<string,string>>({});
  const [assignmentName,setAssignmentName]=useState('');
  const [instructions,setInstructions]=useState('');
  const [experimentId,setExperimentId]=useState('titration');
  const [section,setSection]=useState<'classes'|'assignments'|'reports'|'teachers'|'recovery'>('classes');

  useEffect(()=>{let mounted=true;teacherAccounts().then(a=>{if(mounted){setAccounts(a);setTeacherId(a[0]?.id??'')}}).catch(e=>{if(mounted)setError(String(e))}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[]);

  async function refresh(token=session?.token){
    if(!token)return;
    const fresh=await teacherSnapshot(token);
    setSnapshot(fresh);
    setAccessCodes(await teacherAccessCodes(token));
    if(!classId && fresh.classes.length)setClassId(fresh.classes[0].id);
  }
  async function perform(action:()=>Promise<void>,success:string,refreshRecords=true){
    setBusy(true);setError('');setMessage('');
    try{await action();if(refreshRecords)await refresh();setMessage(success);}
    catch(e){setError(String(e));}
    finally{setBusy(false)}
  }
  async function setup(){
    await perform(async()=>{await setupTeacher(name,pin);const a=await teacherAccounts();setAccounts(a);setTeacherId(a[0]?.id??'');setPin('');setName('')},'Lead teacher created. Sign in using the PIN you chose.',false);
  }
  async function login(){
    setBusy(true);setError('');
    try{const s=await loginTeacher(teacherId,pin);setSession(s);setPin('');await refresh(s.token);}
    catch(e){setError(String(e))}
    finally{setBusy(false)}
  }
  async function logout(){
    if(session)await logoutTeacher(session.token).catch(()=>undefined);
    setSession(null);setSnapshot(null);setMessage('');setPin('');setError('');setIssued(null);setAccessCodes([]);
  }
  async function restore(){
    if(!session || !restoreName || confirmation!=='RESTORE SCHOOL DATA')return;
    setBusy(true);setError('');setMessage('');
    try{
      const rollback=await restoreSchoolBackup(session.token,restoreName,confirmation);
      const fresh=await teacherAccounts();
      setAccounts(fresh);setTeacherId(fresh[0]?.id??'');
      setSession(null);setSnapshot(null);setPin('');
      setRestoreName('');setConfirmation('');setBackupPath('');
      setMessage('School database restored. The previous database was saved at '+rollback+'. Close and reopen Scoolabs, then sign in using a teacher account from the restored backup.');
    } catch(e){setError(String(e));}
    finally{setBusy(false)}
  }
  if(loading)return <div className="teacher-page"><h1>Teacher workspace</h1><p>Loading local school data...</p></div>;
  if(!session)return <div className="teacher-page">
    <span className="eyebrow">OFFLINE CLASSROOM MANAGEMENT</span><h1>Teacher workspace</h1><p>Manage classes, students, laboratory assignments and marking without internet access.</p>
    <div className="teacher-login-card"><div className="teacher-lock"><LockKeyhole size={25}/></div><h2>{accounts.length?'Sign in as a teacher':'Set up your first teacher account'}</h2>
      <p>{accounts.length?'Enter your private PIN to access teacher tools.':'The first teacher created on this computer becomes its local administrator. Choose a memorable 6–12 digit PIN.'}</p>
      {accounts.length?<label className="field">Teacher<select value={teacherId} onChange={e=>setTeacherId(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>:<label className="field">Teacher name<input value={name} maxLength={120} onChange={e=>setName(e.target.value)} placeholder="Full name"/></label>}
      <label className="field">6–12 digit PIN<input type="password" inputMode="numeric" minLength={6} maxLength={12} value={pin} onChange={e=>setPin(e.target.value)} placeholder="Private PIN"/></label>
      <button className="button-primary full" disabled={busy} onClick={accounts.length?login:setup}>{busy?'Working...':accounts.length?'Unlock teacher dashboard':'Create lead teacher'} <ArrowRight size={16}/></button>
      {error&&<p role="alert" className="error-message">{error}</p>}{message&&<p role="status" className="success-message">{message}</p>}
      <small className="teacher-security-note">Teacher PINs are hashed in local SQLite storage. Keep the computer and database backups physically secure. Students do not yet have individual password-protected accounts.</small>
    </div>
  </div>;
  const classes=snapshot?.classes??[], students=snapshot?.students??[], assignments=snapshot?.assignments??[], records=snapshot?.records??[];
  const classProgress=gradebookSummary(classes,students,records);
  return <div className="teacher-page">
    <div className="teacher-head"><div><span className="eyebrow">LOCAL TEACHER DASHBOARD</span><h1>Classroom administration</h1><p>Signed in as {session.teacherName}. Teacher changes are stored on this computer.</p></div><div className="teacher-head-buttons"><button className="button-outline" disabled={busy} onClick={()=>perform(async()=>{setBackupPath(await backupSchoolDatabase(session.token))},'Native SQLite backup created.',false)}>Back up database</button><button className="button-outline" onClick={logout}><LogOut size={16}/> Sign out</button></div></div>
    {backupPath&&<div className="record-note"><ShieldCheck size={17}/><span>SQLite backup saved at: <code>{backupPath}</code>. Copy the file to secure removable storage. It contains student data and hashed teacher credentials.</span></div>}
    <div className="teacher-stats"><div><Users/><strong>{classes.length}</strong><span>Classes</span></div><div><GraduationCap/><strong>{students.length}</strong><span>Enrolled students</span></div><div><BookOpen/><strong>{assignments.length}</strong><span>Assignments</span></div><div><ClipboardList/><strong>{records.length}</strong><span>Practical reports</span></div></div>
    <div className="teacher-sections">{([['classes','Classes & students'],['assignments','Assignments'],['reports','Mark reports'],['teachers','Teacher accounts'],['recovery','Recovery']] as const).map(([id,label])=><button key={id} className={section===id?'active':''} onClick={()=>{setSection(id);setMessage('');setError('');if(id==='recovery')listSchoolBackups(session.token).then(setBackups).catch(e=>setError(String(e)))}}>{label}</button>)}</div>
    {section==='classes'&&<div className="teacher-panels">
      <div className="teacher-form-card"><h3><Plus size={17}/> Create class</h3><label className="field">Class name<input value={className} maxLength={100} placeholder="e.g. SS2A" onChange={e=>setClassName(e.target.value)}/></label><label className="field">Level<select value={level} onChange={e=>setLevel(e.target.value)}>{['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'].map(x=><option key={x}>{x}</option>)}</select></label><button className="button-primary" disabled={busy} onClick={()=>perform(async()=>{await createClass(session.token,className,level);setClassName('')},'Class created successfully.')}>Create class</button></div>
      <div className="teacher-form-card"><h3><GraduationCap size={17}/> Enrol student</h3><label className="field">Class<select value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Select class</option>{classes.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label className="field">Student full name<input value={studentName} maxLength={120} placeholder="Student's name" onChange={e=>setStudentName(e.target.value)}/></label><label className="field">Initial student PIN<input type="password" inputMode="numeric" minLength={6} maxLength={12} value={studentPin} placeholder="Choose a 6–12 digit PIN" onChange={e=>setStudentPin(e.target.value)}/></label><button className="button-primary" disabled={busy||!classId||!studentName.trim()||!/^[0-9]{6,12}$/.test(studentPin)} onClick={()=>perform(async()=>{const enrolled=await enrollStudent(session.token,classId,studentName,studentPin);setIssued({name:studentName,code:enrolled.accessCode,pin:studentPin});setStudentName('');setStudentPin('')},'Student account created. Deliver the credentials privately.')}>Create student account</button>{issued&&<div className="issued-credentials" role="status"><strong>Credentials for {issued.name}</strong><span>Code: <code>{issued.code}</code></span><span>PIN: <code>{issued.pin}</code></span><small>Share privately with this student, then clear this notice. These are local login credentials.</small><button className="button-outline" onClick={()=>setIssued(null)}>Clear credentials</button></div>}</div>
      <div className="teacher-list-card full-span"><h3>Class register</h3>{!classes.length?<p>No classes created. Start by adding a class.</p>:classes.map(c=><div className="teacher-list-item" key={c.id}><strong>{c.name} <small>({c.level})</small></strong><span>{students.filter(s=>s.classId===c.id).length} students</span><div className="teacher-student-list">{students.filter(s=>s.classId===c.id).map(s=><div className="student-register-entry" key={s.id}><strong>{s.name}</strong><span>Access code: {accessCodes.find(a=>a.studentId===s.id)?.accessCode??'Not issued'}</span><div className="reset-pin"><input aria-label={'New PIN for '+s.name} type="password" inputMode="numeric" placeholder="New student PIN" value={resetPins[s.id]??''} onChange={e=>setResetPins(v=>({...v,[s.id]:e.target.value}))}/><button className="button-outline" disabled={busy||!/^[0-9]{6,12}$/.test(resetPins[s.id]??'')} onClick={()=>perform(async()=>{const out=await resetStudentPin(session.token,s.id,resetPins[s.id]);setResetPins(v=>({...v,[s.id]:''}));setIssued({name:s.name,code:out.accessCode,pin:resetPins[s.id]})},'Student credentials updated. Previous student sessions were signed out.')}>Set / reset PIN</button></div></div>)}</div></div>)}</div>
    </div>}
    {section==='assignments'&&<div className="teacher-panels"><div className="teacher-form-card"><h3><Plus size={17}/> New practical assignment</h3><label className="field">Assign to class<select value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field">Experiment<select value={experimentId} onChange={e=>setExperimentId(e.target.value)}>{experiments.filter(e=>e.ready).map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label><label className="field">Title<input value={assignmentName} placeholder="e.g. Practical 2: Pendulum" maxLength={150} onChange={e=>setAssignmentName(e.target.value)}/></label><label className="field">Instructions<textarea maxLength={5000} rows={4} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="What should students observe and report?"/></label><button disabled={busy||!classId} className="button-primary" onClick={()=>perform(async()=>{await createAssignment(session.token,classId,experimentId,assignmentName,instructions);setAssignmentName('');setInstructions('')},'Practical assigned to the class.')}>Assign practical</button></div><div className="teacher-list-card"><h3>Published class assignments</h3>{assignments.length===0?<p>No assignments yet.</p>:assignments.map(a=><div className="teacher-list-item" key={a.id}><strong>{a.title}</strong><small>{classes.find(c=>c.id===a.classId)?.name} · {experiments.find(e=>e.id===a.experimentId)?.title}</small><span>{a.instructions}</span></div>)}</div></div>}
    {section==='reports'&&<div className="teacher-list-card"><div className="teacher-report-heading"><h3>Laboratory reports <span>· {records.length} total</span></h3><button className="button-outline" disabled={!records.length} onClick={()=>downloadGradebook(records)}>Export gradebook CSV</button></div><p>Score student observations from 0–100. Grades remain in the local school database.</p><div className="class-progress-grid">{classProgress.map(c=><div key={c.id} className="class-progress-card"><strong>{c.name}</strong><span>{c.students} enrolled · {c.submitted} reports</span><span>{c.graded} marked · Average {c.average===null?'Not graded':c.average+'/100'}</span></div>)}</div>{records.length===0?<div className="empty-state">Student notebook entries will appear here after students save them.</div>:records.map(r=><GradeEntry key={r.id} record={r} token={session.token} refresh={()=>refresh()}/>)}</div>}
    {section==='teachers'&&<div className="teacher-panels"><div className="teacher-form-card"><h3><ShieldCheck size={17}/> Add teacher</h3><label className="field">Teacher name<input value={name} onChange={e=>setName(e.target.value)} maxLength={120} placeholder="Full name"/></label><label className="field">New teacher PIN<input value={pin} onChange={e=>setPin(e.target.value)} minLength={6} maxLength={12} inputMode="numeric" type="password" placeholder="6–12 digits"/></label><button className="button-primary" disabled={busy} onClick={()=>perform(async()=>{await addTeacher(session.token,name,pin);setAccounts(await teacherAccounts());setName('');setPin('')},'Teacher account created.',false)}>Add teacher</button></div><div className="teacher-list-card"><h3>Teacher accounts</h3>{accounts.map(a=><div className="teacher-list-item" key={a.id}><strong>{a.name}</strong></div>)}</div></div>}

    {section==='recovery'&&<div className="teacher-panels">
      <div className="teacher-form-card"><h3><ShieldCheck size={17}/> Local database backups</h3><p className="recovery-note">Backups contain every teacher, class, student, assignment and grade on this computer. Store them securely.</p>
      <button className="button-primary" disabled={busy} onClick={()=>perform(async()=>{setBackupPath(await backupSchoolDatabase(session.token));setBackups(await listSchoolBackups(session.token))},'A new SQLite backup was created.',false)}>Create backup</button>
      {backupPath&&<p className="recovery-path">Created at: {backupPath}</p>}
      <h3>Available Scoolabs backups</h3>{backups.length===0?<p className="recovery-note">There are no Scoolabs backups on this computer.</p>:backups.map(b=><div className="teacher-list-item" key={b.filename}><span>{b.filename}</span><small>{(b.bytes/1024).toFixed(1)} KB · {new Date(b.modifiedUnix*1000).toLocaleString()}</small></div>)}</div>
      <div className="teacher-form-card"><h3>Restore an earlier school database</h3><p className="recovery-warning">Warning: restoration replaces all current classes, accounts, grades and reports. A separate safety snapshot is created before replacement. All teacher sessions are invalidated.</p>
      <label className="field">Select a backup<select value={restoreName} onChange={e=>setRestoreName(e.target.value)}><option value="">Select a backup</option>{backups.map(b=><option key={b.filename} value={b.filename}>{b.filename}</option>)}</select></label>
      <label className="field">Type RESTORE SCHOOL DATA to confirm<input autoComplete="off" value={confirmation} placeholder="RESTORE SCHOOL DATA" onChange={e=>setConfirmation(e.target.value)}/></label>
      <button className="button-outline" disabled={busy||!restoreName||confirmation!=='RESTORE SCHOOL DATA'} onClick={restore}>Restore selected database</button>
      <p className="recovery-note">Only backups created by Scoolabs in its local backup folder can be selected. The app checks database integrity and required tables before restoring.</p></div>
    </div>}
    {error&&<div role="alert" className="error-message">{error}</div>}
    {message&&<div role="status" className="success-alert"><CheckCircle2 size={17}/>{message}</div>}
  </div>;
}
