import { useEffect, useMemo, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import {
  Activity, ArrowLeft, ArrowRight, Beaker, BookOpen, CheckCircle2, ChevronDown,
  ClipboardList, Download, FlaskConical, GraduationCap, Leaf, Menu, Microscope, Users,
  RotateCcw, Save, Settings2, ShieldCheck, SlidersHorizontal, Sprout, WifiOff, X, Zap,
} from 'lucide-react';
import { circuit, experiments, germination, microscope, titrate, type Crop, type Experiment, type Subject } from './engine';
import { exportRecords, type LabRecord, type LearnerProfile } from './store';
import { initialiseStore, readRecords, writeRecord, saveStudentProfile, getClassCatalog, getClassAssignments, loginStudent, logoutStudent, type StudentSession, type Classroom, type Assignment } from './native-storage';
import { IndicatorsLab, PendulumLab, OsmosisLab, SoilLab } from './AdvancedLabs';
import TeacherPanel from './TeacherPanel';
import { SeparationLab, LensLab, TranspirationLab, NutrientsLab } from './FinalLabs';

type Page = Subject | 'notebook' | 'teacher';
const SUBJECTS = {
  chemistry: { label: 'Chemistry', icon: FlaskConical, subtitle: 'Reactions, solutions and substances', short: 'Chemical reactions', theme: 'purple' },
  physics: { label: 'Physics', icon: Zap, subtitle: 'Motion, forces and electricity', short: 'Physical principles', theme: 'blue' },
  biology: { label: 'Biology', icon: Microscope, subtitle: 'Cells, tissues and living systems', short: 'Living organisms', theme: 'green' },
  agriculture: { label: 'Agriculture', icon: Sprout, subtitle: 'Soil, crops and agricultural science', short: 'Practical agriculture', theme: 'orange' },
} as const;
const subjectKeys: Subject[] = ['chemistry', 'physics', 'biology', 'agriculture'];

function NumberSlider({ label, value, unit, min, max, step = 1, onChange }: {
  label: string; value: number; unit: string; min: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  return <label className="control">
    <span className="control-head"><span>{label}</span><strong>{Number(value.toFixed(2))} {unit}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    <span className="range-hints"><span>{min} {unit}</span><span>{max} {unit}</span></span>
  </label>;
}

function LabIllustration({ subject }: { subject: Subject }) {
  const Icon = SUBJECTS[subject].icon;
  return <span className={'subject-icon '+subject}><Icon size={23} strokeWidth={1.8} /></span>;
}

function ChemistryLab({ onRecord }: { onRecord: (settings: string, observation: string) => void }) {
  const [base, setBase] = useState(0.1);
  const [added, setAdded] = useState(0);
  const result = titrate(base, added);
  const colour = result.indicator === 'colourless' ? '#c7eafa' : result.indicator === 'pale pink' ? '#fab0d0' : '#ec69a3';
  return <div className="lab-grid">
    <div className="lab-stage">
      <div className="stage-head"><span><Activity size={15}/> LIVE EXPERIMENT</span><span>Ideal conditions · 25°C</span></div>
      <div className="chem-scene" aria-label="Interactive titration equipment illustration">
        <div className="burette-assembly">
          <div className="burette-neck"><div className="burette-fill" style={{height: (100 - Math.min(100, added / 60 * 100))+'%'}}/></div>
          <div className="tap"/>
          <div className="droplet" style={{opacity: added > 0 ? 1 : 0}}/>
        </div>
        <div className="chem-flask"><div className="flask-liquid" style={{backgroundColor: colour}}/></div>
        <div className="bench" />
      </div>
      <div className="scene-caption">25 mL of 0.10 mol/L strong monoprotic acid + phenolphthalein</div>
      <div className="quick-actions">
        <button type="button" className="button-muted" onClick={() => setAdded(v => Math.min(60, Number((v + .1).toFixed(2))))}>+ 0.1 mL</button>
        <button type="button" className="button-muted" onClick={() => setAdded(v => Math.min(60, Number((v + 1).toFixed(2))))}>+ 1 mL</button>
        <button type="button" className="button-muted" onClick={() => setAdded(0)}><RotateCcw size={14}/> Reset</button>
      </div>
    </div>
    <div className="lab-controls">
      <div className="panel-kicker"><SlidersHorizontal size={16}/> EXPERIMENT CONTROLS</div>
      <NumberSlider label="Base concentration" value={base} unit="mol/L" min={0.05} max={0.2} step={0.01} onChange={setBase}/>
      <NumberSlider label="Base added from burette" value={added} unit="mL" min={0} max={60} step={0.1} onChange={setAdded}/>
      <div className="results-grid">
        <div className="stat"><span>Solution pH</span><strong>{result.ph.toFixed(2)}</strong></div>
        <div className="stat"><span>Equivalence volume</span><strong>{result.equivalenceMl.toFixed(1)} <small>mL</small></strong></div>
      </div>
      <div className="observation"><span className="small-label">OBSERVATION</span><p>Indicator: <strong>{result.indicator}</strong>. The solution is {result.excess === 'neutral' ? 'at stoichiometric equivalence' : 'in excess of ' + result.excess}.</p></div>
      <button className="button-primary" onClick={() => onRecord('Base: '+base+' mol/L; added: '+added+' mL; acid: 25 mL, 0.10 mol/L', 'pH '+result.ph.toFixed(2)+'; indicator '+result.indicator+'; equivalence '+result.equivalenceMl.toFixed(2)+' mL')}>Record these results <ArrowRight size={16}/></button>
      <p className="model-note">Model: strong acid/strong base at 25°C; ideal mixing. Phenolphthalein changes colour above pH ≈ 8.2, so the visible endpoint differs from exact equivalence.</p>
    </div>
  </div>;
}
function PhysicsLab({ onRecord }: { onRecord: (settings: string, observation: string) => void }) {
  const [voltage, setVoltage] = useState(6);
  const [resistance, setResistance] = useState(10);
  const result = circuit(voltage, resistance);
  return <div className="lab-grid">
    <div className="lab-stage">
      <div className="stage-head"><span><Activity size={15}/> LIVE EXPERIMENT</span><span>Ideal DC circuit</span></div>
      <div className="circuit-scene" aria-label="Diagram of a battery and resistor in a closed DC circuit">
        <svg viewBox="0 0 460 270" role="img" aria-label="Closed circuit with battery, resistor and current arrow">
          <path d="M95 70 H360 V207 H95 V70" fill="none" stroke="#77b3e8" strokeWidth="5" strokeLinejoin="round"/>
          <rect x="205" y="55" width="78" height="32" rx="6" fill="#e4f0fa" stroke="#3176aa" strokeWidth="2"/>
          <path d="M218 71 h10 l5 -7 l10 14 l10 -14 l10 14 h8" fill="none" stroke="#3176aa" strokeWidth="2.6"/>
          <rect x="81" y="114" width="28" height="52" fill="#eaf0f6"/>
          <path d="M85 123 h20 M89 140 h12 M85 153 h20" stroke="#3176aa" strokeWidth="3.5"/>
          <circle cx="360" cy="137" r="21" fill="#ecf5ff" stroke="#3688cd" strokeWidth="3"/><text x="360" y="143" textAnchor="middle" fontSize="17" fill="#175a9b">A</text>
          <text x="230" y="44" textAnchor="middle" fontSize="13" fill="#376780">R = {resistance} Ω</text>
          <text x="65" y="142" textAnchor="end" fontSize="13" fill="#376780">{voltage} V</text>
          <text x="360" y="181" textAnchor="middle" fontSize="13" fill="#376780">{result.current.toFixed(2)} A</text>
          <path d="M210 207 h45 m-8 -7 l9 7 -9 7" fill="none" stroke="#269d92" strokeWidth="3"/>
        </svg>
      </div>
      <div className="scene-caption">Change the supply voltage and resistance to observe the relationship.</div>
      <div className="formula-chip">V = I × R</div>
    </div>
    <div className="lab-controls">
      <div className="panel-kicker"><SlidersHorizontal size={16}/> CIRCUIT CONTROLS</div>
      <NumberSlider label="Supply voltage" value={voltage} unit="V" min={0} max={24} step={0.5} onChange={setVoltage}/>
      <NumberSlider label="Resistance" value={resistance} unit="Ω" min={1} max={100} step={1} onChange={setResistance}/>
      <div className="results-grid">
        <div className="stat"><span>Current (I)</span><strong>{result.current.toFixed(2)} <small>A</small></strong></div>
        <div className="stat"><span>Power (P)</span><strong>{result.power.toFixed(2)} <small>W</small></strong></div>
      </div>
      <div className="observation"><span className="small-label">OBSERVATION</span><p>With resistance held constant, current increases in proportion to voltage. The ammeter reads <strong>{result.current.toFixed(2)} A</strong>.</p></div>
      <button className="button-primary" onClick={() => onRecord('Voltage: '+voltage+' V; resistance: '+resistance+' Ω', 'Current: '+result.current.toFixed(3)+' A; power: '+result.power.toFixed(3)+' W')}>Record these results <ArrowRight size={16}/></button>
      <p className="model-note">Model: ideal ohmic resistor and perfect DC power source. Real instruments and components have tolerances.</p>
    </div>
  </div>;
}
function BiologyLab({ onRecord }: { onRecord: (settings: string, observation: string) => void }) {
  const [objective, setObjective] = useState<4 | 10 | 40>(10);
  const [slide, setSlide] = useState<'onion' | 'leaf' | 'cheek'>('onion');
  const [focus, setFocus] = useState(65);
  const result = microscope(objective);
  const blur = Math.abs(focus - 65) / 13;
  return <div className="lab-grid">
    <div className="lab-stage">
      <div className="stage-head"><span><Activity size={15}/> LIVE MICROSCOPE</span><span>Prepared specimen</span></div>
      <div className={'microscope-scene slide-'+slide}>
        <div className="microscope-view">
          <svg viewBox="0 0 320 320" aria-label={'Schematic cells on '+slide+' specimen slide'} style={{filter: 'blur('+blur+'px)', transform: 'scale('+(objective===40?1.4:objective===10?1.12:1)+')'}}>
            {Array.from({length:16}, (_, i) => {
              const x = (i%4)*82-3, y = Math.floor(i/4)*83-3;
              return <g key={i}>
                <rect x={x} y={y} width="79" height="80" rx={slide==='cheek'?30:5} fill={slide==='leaf'?'#a9d9ae':slide==='cheek'?'#e8b3c7':'#e5d2ed'} stroke={slide==='leaf'?'#398d52':'#845987'} strokeWidth="2.2"/>
                <ellipse cx={x+39} cy={y+40} rx="13" ry="10" fill={slide==='leaf'?'#4ca96b':'#9871a1'} opacity=".7"/>
                {slide==='leaf'&&<><circle cx={x+14} cy={y+20} r="5" fill="#4fa962"/><circle cx={x+62} cy={y+55} r="5" fill="#4fa962"/></>}
              </g>;
            })}
          </svg>
        </div>
      </div>
      <div className="scene-caption">Schematic teaching illustration, not an image of a real microscope slide.</div>
      <div className="formula-chip">Eyepiece 10× · Objective {objective}×</div>
    </div>
    <div className="lab-controls">
      <div className="panel-kicker"><SlidersHorizontal size={16}/> MICROSCOPE CONTROLS</div>
      <label className="control"><span className="control-head"><span>Specimen</span></span><select value={slide} onChange={e => setSlide(e.target.value as typeof slide)}><option value="onion">Onion epidermis</option><option value="leaf">Leaf tissue</option><option value="cheek">Human cheek cells</option></select></label>
      <label className="control"><span className="control-head"><span>Objective lens</span></span><div className="segmented">{([4,10,40] as const).map(n=><button key={n} className={objective===n?'active':''} onClick={()=>setObjective(n)}>{n}×</button>)}</div></label>
      <NumberSlider label="Focus adjustment" value={focus} unit="%" min={0} max={100} onChange={setFocus}/>
      <div className="results-grid">
        <div className="stat"><span>Total magnification</span><strong>{result.magnification}<small>×</small></strong></div>
        <div className="stat"><span>Field diameter (approx.)</span><strong>{result.fieldOfViewMm.toFixed(2)} <small>mm</small></strong></div>
      </div>
      <div className="observation"><span className="small-label">OBSERVATION</span><p>{blur < .6 ? 'The specimen is in focus.' : 'The image is blurred. Adjust the focus toward 65%.'} Identify the cell boundary, cytoplasm and nucleus where visible.</p></div>
      <button className="button-primary" onClick={() => onRecord('Slide: '+slide+'; objective '+objective+'×; eyepiece 10×; focus '+focus+'%', 'Magnification: '+result.magnification+'×; field diameter approx. '+result.fieldOfViewMm.toFixed(2)+' mm; '+(blur<.6?'in focus':'out of focus'))}>Record these results <ArrowRight size={16}/></button>
      <p className="model-note">Model: eyepiece field number 18 mm. Slide illustrations simplify real cell morphology and must not replace actual microscopy practice.</p>
    </div>
  </div>;
}
function AgricultureLab({ onRecord }: { onRecord: (settings: string, observation: string) => void }) {
  const [crop, setCrop] = useState<Crop>('maize');
  const [moisture, setMoisture] = useState(60);
  const [temperature, setTemperature] = useState(27);
  const [day, setDay] = useState(10);
  const result = germination(crop, moisture, temperature, day);
  return <div className="lab-grid">
    <div className="lab-stage">
      <div className="stage-head"><span><Activity size={15}/> MODELLED GROWTH</span><span>Illustrative conditions</span></div>
      <div className="plant-scene">
        <div className="plant-sun">☀</div>
        <div className="plant">
          <span className="plant-stem" style={{height: Math.min(116, result.heightCm*9)+'px'}}/>
          {result.heightCm > 1 && <><span className="plant-leaf left"/><span className="plant-leaf right"/></>}
          <span className="plant-seed"/>
        </div>
        <div className="soil"><span>SOIL</span></div>
      </div>
      <div className="scene-caption">Seedling growth is illustrative. Try changing water, temperature and days.</div>
      <div className="bar-mini" aria-label="Germination rate over 14 days">
        {Array.from({length:7},(_,i)=>{const val=germination(crop,moisture,temperature,(i+1)*2).percentage;return <div className="bar-column" key={i}><span style={{height:Math.max(3,val)+'%'}}/><small>D{(i+1)*2}</small></div>})}
      </div>
    </div>
    <div className="lab-controls">
      <div className="panel-kicker"><SlidersHorizontal size={16}/> GROWTH CONDITIONS</div>
      <label className="control"><span className="control-head"><span>Crop</span></span><select value={crop} onChange={e=>setCrop(e.target.value as Crop)}><option value="maize">Maize</option><option value="cowpea">Cowpea</option><option value="rice">Rice</option></select></label>
      <NumberSlider label="Moisture level" value={moisture} unit="%" min={0} max={100} onChange={setMoisture}/>
      <NumberSlider label="Temperature" value={temperature} unit="°C" min={0} max={45} onChange={setTemperature}/>
      <NumberSlider label="Elapsed time" value={day} unit="days" min={0} max={14} onChange={setDay}/>
      <div className="results-grid">
        <div className="stat"><span>Modelled germination</span><strong>{result.percentage}<small>%</small></strong></div>
        <div className="stat"><span>Modelled seedling height</span><strong>{result.heightCm.toFixed(1)} <small>cm</small></strong></div>
      </div>
      <button className="button-primary" onClick={()=>onRecord('Crop: '+crop+'; moisture '+moisture+'%; temperature '+temperature+'°C; days '+day, 'Illustrative germination: '+result.percentage+'%; seedling height: '+result.heightCm.toFixed(1)+' cm')}>Record these results <ArrowRight size={16}/></button>
      <p className="model-note">Illustrative teaching model only. Field growth depends on seed variety, soil, nutrients, oxygen and many other factors. These figures are not farm predictions.</p>
    </div>
  </div>;
}

function Records({records, onBack}: {records:LabRecord[];onBack:()=>void}) {
  return <section className="records-page">
    <button className="text-button" onClick={onBack}><ArrowLeft size={16}/> Back to laboratory</button>
    <div className="page-title"><div><span className="eyebrow">MY LEARNING</span><h1>Laboratory notebook</h1><p>Every observation is saved on this computer, including when you are offline.</p></div>
      <button className="button-outline" disabled={!records.length} onClick={()=>exportRecords(records)}><Download size={17}/> Export backup</button>
    </div>
    <div className="record-note"><ShieldCheck size={18}/> Your notes stay on this device. Export a backup before uninstalling Scoolabs or clearing the app data.</div>
    {records.length===0 ? <div className="empty-state"><ClipboardList size={38}/><h3>No observations saved yet</h3><p>Complete an experiment and choose “Record these results” to begin.</p><button className="button-primary" onClick={onBack}>Explore experiments <ArrowRight size={16}/></button></div>:
    <div className="records-table"><table><thead><tr><th>Experiment</th><th>Student</th><th>Class</th><th>Recorded</th><th>Observation</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td><strong>{r.experimentTitle}</strong><span>{SUBJECTS[r.subject].label}</span></td><td>{r.student}</td><td>{r.classroom}</td><td>{new Date(r.timestamp).toLocaleString()}</td><td><span>{r.observation}</span>{r.conclusion && <small>Conclusion: {r.conclusion}</small>}{r.grade!==null&&r.grade!==undefined&&<small><strong>Teacher score: {r.grade}/100</strong>{r.feedback?' · '+r.feedback:''}</small>}</td></tr>)}</tbody></table></div>}
  </section>;
}


function StudentSignIn({onSignedIn}:{onSignedIn:(session:StudentSession)=>Promise<void>}) {
  const [accessCode,setAccessCode]=useState('');
  const [pin,setPin]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function handleLogin(){
    setBusy(true);setError('');
    try{
      const session=await loginStudent(accessCode,pin);
      await onSignedIn(session);
      setPin('');
    }catch(e){setError(String(e));}
    finally{setBusy(false);}
  }
  return <section className="student-signin">
    <div className="student-signin-icon"><GraduationCap size={29}/></div>
    <span className="eyebrow">OFFLINE STUDENT ACCESS</span>
    <h1>Enter your science laboratory</h1>
    <p>Ask your teacher for your personal access code and PIN. Your practical reports, assigned experiments and teacher feedback will stay linked to your account.</p>
    <form onSubmit={e=>{e.preventDefault();void handleLogin();}}>
      <label className="field">Student access code<input required maxLength={10} autoComplete="off" value={accessCode} onChange={e=>setAccessCode(e.target.value.toUpperCase())} placeholder="10-character code"/></label>
      <label className="field">Personal PIN<input required type="password" inputMode="numeric" minLength={6} maxLength={12} value={pin} onChange={e=>setPin(e.target.value)} placeholder="6–12 digit PIN"/></label>
      <button className="button-primary full" disabled={busy||accessCode.trim().length!==10||pin.length<6} type="submit">{busy?'Checking credentials...':'Sign in to laboratory'} <ArrowRight size={16}/></button>
      {error&&<div role="alert" className="error-message">{error}</div>}
    </form>
    <p className="signin-note">Scoolabs works without internet. Student access is issued locally by a school teacher. Teacher setup is available from the left menu.</p>
  </section>;
}

function App() {
  const [page,setPage]=useState<Page>('chemistry');
  const [activeId,setActiveId]=useState('titration');
  const [records,setRecords]=useState<LabRecord[]>([]);
  const [profile,setProfile]=useState<LearnerProfile>({name:'',classroom:''});
  const [studentSession,setStudentSession]=useState<StudentSession|null>(null);
  const [sidebar,setSidebar]=useState(false);
  const [draft,setDraft]=useState<{settings:string;observation:string}|null>(null);
  const [conclusion,setConclusion]=useState('');
  const [saved,setSaved]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [profileDraft,setProfileDraft]=useState<LearnerProfile>(profile);
  const [error,setError]=useState('');
  const [storageError,setStorageError]=useState('');
  const [storageReady,setStorageReady]=useState(false);
  const [classCatalog,setClassCatalog]=useState<Classroom[]>([]);
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  useEffect(()=>{
    let active=true;
    initialiseStore().then(data=>{
      if(!active)return;
      setProfile(data.profile);setProfileDraft(data.profile);setRecords(data.records);setClassCatalog(data.classes);
    }).catch(e=>{if(active)setStorageError('Unable to initialise native storage: '+String(e))}).finally(()=>{if(active)setStorageReady(true)});
    return ()=>{active=false};
  },[]);
  useEffect(()=>{
    if(!storageReady || !profile.classroom || (isTauri() && !studentSession))return;
    getClassAssignments(profile.classroom,studentSession?.token).then(setAssignments).catch(e=>setStorageError(String(e)));
  },[profile.classroom,studentSession?.token,storageReady]);
  const selected=experiments.find(x=>x.id===activeId)!;
  const subject=(page==='notebook'||page==='teacher') ? 'chemistry' : page;
  const visible=useMemo(()=>experiments.filter(x=>x.subject===subject),[subject]);
  const completed=new Set(records.map(r=>r.experimentId)).size;
  async function onSignedIn(session:StudentSession){
    const identity={name:session.studentName,classroom:session.classroom};
    setStudentSession(session);setProfile(identity);setProfileDraft(identity);
    setRecords(await readRecords(identity,session.token));
    setAssignments(await getClassAssignments(identity.classroom,session.token));
    setError('');setStorageError('');
  }
  async function signOut(){
    if(studentSession) await logoutStudent(studentSession.token).catch(()=>undefined);
    setStudentSession(null);setProfile({name:'',classroom:''});setRecords([]);setAssignments([]);
    setDraft(null);setSaved(false);setError('');
    setPage('chemistry');
  }
  function navigate(next:Page) {
    setPage(next);setSidebar(false);setSaved(false);setDraft(null);
    if(next!=='notebook'&&next!=='teacher'){const first=experiments.find(x=>x.subject===next&&x.ready);if(first)setActiveId(first.id);}
  }
  function startRecord(settings:string,observation:string) {
    setDraft({settings,observation});setConclusion('');setSaved(false);setError('');
  }
  async function persistRecord() {
    if(!draft)return;
    if(!storageReady || storageError){setError('Storage is not ready. Resolve the storage error before saving.');return;}
    if(!profile.name.trim()||!profile.classroom.trim()){setError('Enter your name and class to save an observation.');return;}
    const record:LabRecord={id:crypto.randomUUID(),timestamp:new Date().toISOString(),student:profile.name.trim(),classroom:profile.classroom.trim(),experimentId:selected.id,experimentTitle:selected.title,subject:selected.subject,settings:draft.settings,observation:draft.observation,conclusion:conclusion.trim()};
    try{
      if(!isTauri())await saveStudentProfile(profile);
      await writeRecord(record,studentSession?.token);
      setRecords(await readRecords(profile,studentSession?.token));
      setDraft(null);setSaved(true);setError('');
    }catch(e){setError('Could not save this record to native storage: '+String(e));}
  }
  async function persistProfile(){
    try{
      await saveStudentProfile(profileDraft);
      setProfile(profileDraft);
      setRecords(await readRecords(profileDraft,studentSession?.token));
      setShowProfile(false);setError('');
    }catch(e){setError('Unable to save student profile: '+String(e));}
  }
  return <div className="app-shell">
    {sidebar && <div className="mobile-scrim" onClick={()=>setSidebar(false)}/>}
    <aside className={'sidebar '+(sidebar?'open':'')}>
      <div className="brand"><span className="brand-mark"><FlaskConical size={22}/></span><span><strong>Scoo<span>labs</span></strong><small>VIRTUAL SCIENCE LAB</small></span><button className="close-menu" onClick={()=>setSidebar(false)} aria-label="Close menu"><X size={19}/></button></div>
      <div className="nav-heading">WORKSPACE</div>
      <nav aria-label="Main navigation">
        {subjectKeys.map(s=>{const Icon=SUBJECTS[s].icon;return <button key={s} onClick={()=>navigate(s)} className={'nav-link '+(page===s?'selected':'')}><Icon size={19}/>{SUBJECTS[s].label}<span className="nav-count">{experiments.filter(e=>e.subject===s&&e.ready).length}</span></button>})}
        <div className="nav-rule"/>
        <button onClick={()=>navigate('notebook')} className={'nav-link '+(page==='notebook'?'selected':'')}><BookOpen size={19}/> My notebook <span className="nav-count">{records.length}</span></button>
        <button onClick={()=>navigate('teacher')} className={'nav-link '+(page==='teacher'?'selected':'')}><Users size={19}/> Teacher workspace</button>
      </nav>
      <div className="side-spacer"/>
      <div className="offline-card"><div><WifiOff size={17}/> 100% offline learning</div><p>All experiments and observations work without internet access.</p><span className="offline-dot"/> Ready to learn</div>
      <div className="side-footer">Scoolabs v0.3.0 <span>·</span> Silabs Technologies</div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" onClick={()=>setSidebar(true)} aria-label="Open menu"><Menu size={22}/></button><span className="breadcrumb">Workspace</span><span className="breadcrumb-sep">/</span><strong>{page==='notebook'?'My notebook':page==='teacher'?'Teacher workspace':SUBJECTS[page].label}</strong></div><div className="topbar-right"><span className="offline-indicator"><span/> Offline ready</span><button className="user-button" onClick={()=>{if(isTauri()){if(studentSession)void signOut();else navigate('chemistry');}else{setProfileDraft(profile);getClassCatalog().then(setClassCatalog).catch(()=>undefined);setShowProfile(true);}}}><GraduationCap size={16}/>{isTauri()?(studentSession?'Sign out: '+studentSession.studentName:'Student sign in'):(profile.name||'Student profile')}<ChevronDown size={14}/></button></div></header>
      <div className="content-pad">
        {storageError&&<div role="alert" className="storage-warning">{storageError}</div>}
        {!storageReady&&<div className="record-note">Opening offline database...</div>}
        {page==='teacher'?<TeacherPanel/>:isTauri()&&!studentSession?<StudentSignIn onSignedIn={onSignedIn}/>:page==='notebook'?<Records records={records} onBack={()=>navigate('chemistry')}/>:
          <>
          <div className="page-title"><div><span className="eyebrow">DISCOVER · EXPERIMENT · LEARN</span><h1>Welcome to the {SUBJECTS[subject].label} Lab<span className="title-period">.</span></h1><p>{SUBJECTS[subject].subtitle}. Explore through practice, not just theory.</p></div><div className="progress-badge"><CheckCircle2 size={18}/><div><strong>{completed} activities recorded</strong><small>{records.length} saved observations</small></div></div></div>
          <div className="subject-grid">
            {subjectKeys.map(s=>{const data=SUBJECTS[s];return <button key={s} className={'subject-card '+(subject===s?'current':'')} onClick={()=>navigate(s)}><LabIllustration subject={s}/><span><strong>{data.label}</strong><small>{data.short}</small></span><ArrowRight size={16} className="subject-arrow"/></button>})}
          </div>
          <div className="section-heading"><div><span className="eyebrow">PRACTICAL LEARNING</span><h2>Choose an experiment</h2></div><span>{visible.filter(x=>x.ready).length} available · {visible.length} planned</span></div>
          <div className="experiment-tabs" role="group" aria-label="Select an experiment">{visible.map(exp=><button key={exp.id} className={'experiment-pill '+(activeId===exp.id?'active':'')} disabled={!exp.ready} title={exp.ready?exp.description:'Planned for a future version'} onClick={()=>{setActiveId(exp.id);setSaved(false);setDraft(null)}}>{exp.ready&&<span className="live-dot"/>}{exp.title}{!exp.ready&&<small>Coming soon</small>}</button>)}</div>
          <div className="experiment-intro"><div><div className="experiment-tag"><Beaker size={14}/> VIRTUAL PRACTICAL · {selected.level}</div><h2>{selected.title}</h2><p>{selected.description}</p></div><div className="duration">{selected.minutes} MIN <span>•</span> GUIDED MODE</div></div>
          {assignments.filter(a=>a.experimentId===selected.id).map(a=><div className="record-note" key={a.id}><ClipboardList size={18}/><span><strong>Class assignment: {a.title}</strong> {a.instructions}</span></div>)}
          {selected.id==='titration'?<ChemistryLab onRecord={startRecord}/>:selected.id==='ohms-law'?<PhysicsLab onRecord={startRecord}/>:selected.id==='microscopy'?<BiologyLab onRecord={startRecord}/>:selected.id==='germination'?<AgricultureLab onRecord={startRecord}/>:selected.id==='ph-indicators'?<IndicatorsLab onRecord={startRecord}/>:selected.id==='pendulum'?<PendulumLab onRecord={startRecord}/>:selected.id==='osmosis'?<OsmosisLab onRecord={startRecord}/> :selected.id==='soil'?<SoilLab onRecord={startRecord}/>:selected.id==='separation'?<SeparationLab onRecord={startRecord}/>:selected.id==='convex-lens'?<LensLab onRecord={startRecord}/>:selected.id==='transpiration'?<TranspirationLab onRecord={startRecord}/>:<NutrientsLab onRecord={startRecord}/>}
          {saved&&<div className="success-alert"><CheckCircle2 size={18}/> Observation saved to your offline notebook. <button onClick={()=>navigate('notebook')}>Open notebook <ArrowRight size={14}/></button></div>}
          <div className="objectives"><div><ClipboardList size={20}/><strong>Learning objectives</strong></div><div className="objectives-list">{selected.objectives.map((objective,i)=><span key={objective}><CheckCircle2 size={16}/>{i+1}. {objective}</span>)}</div></div>
          </>
        }
        <footer className="content-footer"><span>Simeon's Laboratories and Co Technologies Ltd</span><span>Designed for Nigerian classrooms · Offline first</span></footer>
      </div>
    </main>
    {draft&&<div className="modal-backdrop" role="presentation"><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="record-title"><button className="dialog-close" onClick={()=>setDraft(null)} aria-label="Close"><X size={20}/></button><span className="eyebrow">LABORATORY NOTEBOOK</span><h2 id="record-title">Save your experiment</h2><p>Record your observation and conclusion locally on this computer.</p><div className="dialog-data"><strong>Observation</strong><span>{draft.observation}</span><small>{draft.settings}</small></div>{isTauri()?<div className="record-note"><ShieldCheck size={17}/> Signed in as {profile.name} ({profile.classroom}). This record will be saved to your authenticated student account.</div>:<div className="form-two"><label>Student name<input value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} placeholder="e.g. Ada Musa"/></label><label>Class<input value={profile.classroom} onChange={e=>setProfile(p=>({...p,classroom:e.target.value}))} placeholder="e.g. SS2A"/></label></div>}<label className="field">Conclusion (optional)<textarea rows={3} placeholder="What did you discover?" value={conclusion} onChange={e=>setConclusion(e.target.value)}/></label>{error&&<div role="alert" className="error-message">{error}</div>}<button className="button-primary full" onClick={persistRecord} disabled={!storageReady||!!storageError}><Save size={17}/> Save to notebook</button></div></div>}
    {showProfile&&!isTauri()&&<div className="modal-backdrop"><div className="dialog compact" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="dialog-close" onClick={()=>setShowProfile(false)} aria-label="Close"><X size={20}/></button><span className="eyebrow">LOCAL PROFILE</span><h2 id="profile-title">Student profile</h2><p>Set your identity for practical records on this computer.</p><label className="field">Full name<input value={profileDraft.name} onChange={e=>setProfileDraft({...profileDraft,name:e.target.value})} placeholder="Your name"/></label><label className="field">Class<input list="known-classes" value={profileDraft.classroom} onChange={e=>setProfileDraft({...profileDraft,classroom:e.target.value})} placeholder="SS2A"/><datalist id="known-classes">{classCatalog.map(c=><option key={c.id} value={c.name}/>)}</datalist></label><button className="button-primary full" onClick={persistProfile} disabled={!storageReady||!!storageError}><Settings2 size={16}/> Save profile</button></div></div>}
  </div>;
}

export default App;
