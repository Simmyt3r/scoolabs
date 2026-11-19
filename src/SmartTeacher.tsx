import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,GraduationCap,Maximize,MessageCircle,MicOff,Pause,Play,Square,Volume2} from 'lucide-react';
import {answerQuestion,DEMO_PLAN,DEMO_TOPIC,prepareLesson,type Lesson,type Reply} from './smartTeacher';
import './smart-teacher.css';

type SpeechState='idle'|'speaking'|'paused'|'checkpoint';
type Exchange={question:string;reply:Reply};
const supported=()=>typeof window!=='undefined'&&'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
function localEnglishVoices():SpeechSynthesisVoice[]{
  return supported()?window.speechSynthesis.getVoices().filter(v=>v.localService&&/^en(-|_|$)/i.test(v.lang)):[];
}

export default function SmartTeacher(){
  const [topic,setTopic]=useState('');
  const [plan,setPlan]=useState('');
  const [lesson,setLesson]=useState<Lesson|null>(null);
  const [index,setIndex]=useState(0);
  const [question,setQuestion]=useState('');
  const [exchange,setExchange]=useState<Exchange|null>(null);
  const [error,setError]=useState('');
  const [voiceError,setVoiceError]=useState('');
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceId,setVoiceId]=useState('');
  const [rate,setRate]=useState(0.9);
  const [speech,setSpeech]=useState<SpeechState>('idle');
  const [questionsOpen,setQuestionsOpen]=useState(false);
  const [finished,setFinished]=useState(false);
  const [autoAdvance,setAutoAdvance]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  const generation=useRef(0);
  const active=useRef(false);
  const utterance=useRef<SpeechSynthesisUtterance|null>(null);
  const launch=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(!supported())return;
    const synth=window.speechSynthesis;
    const refresh=()=>setVoices(localEnglishVoices());
    refresh();synth.addEventListener('voiceschanged',refresh);
    return ()=>{
      synth.removeEventListener('voiceschanged',refresh);
      generation.current++;
      if(active.current)synth.cancel();
      active.current=false;utterance.current=null;
    };
  },[]);
  useEffect(()=>{
    if(lesson&&dialog.current&&!dialog.current.open)dialog.current.showModal();
  },[lesson]);
  const selectedVoice=voices.find(v=>v.voiceURI===voiceId)??voices[0];
  // In hands-free mode, leave a discussion pause after each narrated section.
  // Activity pages always require the classroom supervisor to continue manually.
  useEffect(()=>{
    if(!autoAdvance||!lesson||questionsOpen||finished||speech!=='checkpoint'||voiceError||index>=lesson.slides.length-1||/activity|exercise|discussion|practice|assessment/i.test(lesson.slides[index].title))return;
    const timer=window.setTimeout(()=>move(index+1,true),20000);
    return ()=>window.clearTimeout(timer);
  },[autoAdvance,lesson,index,questionsOpen,finished,speech,voiceError]);
  function stop(){
    generation.current++;
    if(supported()&&active.current)window.speechSynthesis.cancel();
    active.current=false;utterance.current=null;setSpeech('idle');
  }
  function speak(text:string,checkpoint:boolean){
    stop();setVoiceError('');
    if(!selectedVoice||!supported()){
      setVoiceError('No verified local English voice is available. Read the projected text aloud or install an offline Windows voice.');
      if(checkpoint)setSpeech('checkpoint');
      return;
    }
    const current=localEnglishVoices().find(v=>v.voiceURI===selectedVoice.voiceURI);
    if(!current){setVoiceError('The selected offline voice is unavailable. Use the text on screen.');return;}
    const id=++generation.current;
    const u=new SpeechSynthesisUtterance(text);
    u.voice=current;u.lang=current.lang;u.rate=rate;
    utterance.current=u;active.current=true;setSpeech('speaking');
    u.onend=()=>{
      if(generation.current!==id)return;
      active.current=false;utterance.current=null;setSpeech(checkpoint?'checkpoint':'idle');
    };
    u.onerror=()=>{
      if(generation.current!==id)return;
      active.current=false;utterance.current=null;setSpeech(checkpoint?'checkpoint':'idle');
      setVoiceError('Narration could not play. The lesson remains available on screen.');
    };
    try{if(window.speechSynthesis.paused)window.speechSynthesis.resume();window.speechSynthesis.speak(u);}catch{
      active.current=false;utterance.current=null;setSpeech('idle');
      setVoiceError('Narration is unavailable. Use the projected text.');
    }
  }
  function togglePause(){
    if(!supported()||!active.current)return;
    if(speech==='paused'){window.speechSynthesis.resume();setSpeech('speaking');}
    else if(speech==='speaking'){window.speechSynthesis.pause();setSpeech('paused');}
  }
  function startLesson(){
    try{
      const next=prepareLesson(topic,plan);
      stop();setError('');setVoiceError('');setLesson(next);setIndex(0);setExchange(null);
      setQuestion('');setQuestionsOpen(false);setFinished(false);
      if(autoAdvance)speak(next.slides[0].title+'. '+next.slides[0].text,true);
    }catch(e){setError(e instanceof Error?e.message:'Unable to prepare this lesson.');}
  }
  function exit(){
    stop();
    if(document.fullscreenElement===dialog.current)void document.exitFullscreen().catch(()=>undefined);
    dialog.current?.close();setLesson(null);
    requestAnimationFrame(()=>launch.current?.focus());
  }
  function move(next:number,read=false){
    if(!lesson||next<0||next>=lesson.slides.length)return;
    stop();setIndex(next);setQuestionsOpen(false);setQuestion('');setExchange(null);setVoiceError('');setFinished(false);
    if(read)speak(lesson.slides[next].title+'. '+lesson.slides[next].text,true);
  }
  function ask(){
    if(!lesson||!question.trim())return;
    stop();setExchange({question:question.trim(),reply:answerQuestion(lesson,question.trim())});setQuestion('');
  }
  function openQuestions(){
    stop();setQuestionsOpen(true);setExchange(null);setQuestion('');
  }
  async function fullscreen(){
    const element=dialog.current;
    if(!element)return;
    try{
      if(document.fullscreenElement===element)await document.exitFullscreen();
      else if(element.requestFullscreen)await element.requestFullscreen();
      else setVoiceError('Fullscreen is unavailable; the classroom view still fills the application window.');
    }catch{setVoiceError('Fullscreen is unavailable; the classroom view still fills the application window.');}
  }
  const slide=lesson?.slides[index];
  return <section className="smart-teacher" aria-label="Smart Teacher workspace">
    <div className="page-title"><div><span className="eyebrow">SCOOLABS · CLASSROOM TEACHING</span>
      <h1>Smart Teacher</h1><p>Prepare a lesson, project it on a TV or classroom screen, and pause for learner questions. No student account or internet connection is needed.</p></div>
      <div className="progress-badge"><GraduationCap size={22}/><div><strong>Offline classroom</strong><small>Teacher-supplied content</small></div></div></div>
    <div className="st-setup">
      <div className="st-panel"><h2>Prepare a lesson</h2>
        <p>Paste the actual teaching notes, not just a list of objectives. Use headings starting with # to divide the lesson. Optional Q: and A: pairs supply approved answers.</p>
        <form onSubmit={e=>{e.preventDefault();startLesson();}}>
          <label className="st-field">Lesson topic<input required maxLength={150} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Photosynthesis"/></label>
          <label className="st-field">Lesson plan<textarea required rows={14} maxLength={20000} value={plan} onChange={e=>setPlan(e.target.value)} placeholder={'# Introduction\nPaste the introduction here.\n# Explanation\nPaste the teaching notes.\n# Class activity\nDescribe the activity.\n# Recap\nSummarise the lesson.\n# Questions and answers\nQ: ...\nA: ...'}/></label>
          <p className="st-hint">{plan.length.toLocaleString()} / 20,000 characters · session-only, not saved</p>
          <label className="st-field">Offline narration voice<select value={selectedVoice?.voiceURI??''} onChange={e=>setVoiceId(e.target.value)} disabled={!voices.length}>
            {!voices.length&&<option value="">No local English voice detected</option>}
            {voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select></label>
          <label className="st-field">Speaking speed: {rate.toFixed(1)}×<input type="range" min={0.7} max={1.2} step={0.1} value={rate} onChange={e=>setRate(Number(e.target.value))}/></label>
          <label className="st-auto"><input type="checkbox" checked={autoAdvance} onChange={e=>setAutoAdvance(e.target.checked)}/> Hands-free narration: advance after 20 seconds of discussion; activity sections wait for the supervisor.</label>
          {error&&<p role="alert" className="st-error">{error}</p>}
          <div className="st-actions"><button ref={launch} className="button-primary" type="submit">Start classroom <ArrowRight size={18}/></button>
            <button className="button-outline" type="button" onClick={()=>{setTopic(DEMO_TOPIC);setPlan(DEMO_PLAN);setError('');}}>Load sample lesson</button></div>
        </form>
      </div>
      <aside className="st-panel"><h2><BookOpen size={20}/> How it teaches</h2>
        <ol><li>Present a large, readable section of the lesson.</li><li>Read it aloud using an installed local English voice, when available.</li><li>Pause for discussion and classroom activities after every section.</li><li>Type learner questions. Approved answers are repeated verbatim; related notes are labelled as excerpts.</li><li>Advance to the next section and recap.</li></ol>
        <p><MicOff size={17}/> This version uses typed questions. Microphone recognition, generative explanations and automatic lesson authoring are not yet included.</p>
        <p>Keep a responsible adult present, verify the lesson content before teaching, and do not enter student personal information. Project the application onto a connected TV or projector using Windows display settings.</p>
      </aside>
    </div>
    {lesson&&slide&&<dialog ref={dialog} className="st-classroom" aria-label="Classroom presentation" onCancel={e=>{e.preventDefault();exit();}}>
      <div className="st-classroom-inner">
        <header className="st-classroom-header"><div><span className="st-overline">SCOOLABS SMART TEACHER</span><strong>{lesson.topic}</strong></div>
          <div className="st-actions"><button type="button" onClick={()=>void fullscreen()}><Maximize size={20}/> Fullscreen</button><button type="button" onClick={exit}><ArrowLeft size={20}/> Exit lesson</button></div></header>
        <progress aria-label="Lesson progress" max={lesson.slides.length} value={finished?lesson.slides.length:index+1}/>
        <div className="st-stage" role="region" aria-label="Lesson content" aria-live="polite">
          {finished?<><span className="st-overline">LESSON COMPLETE</span><h2>Well done, class.</h2><p>Review the lesson and discuss any questions with your teacher.</p></>:
            <><span className="st-overline">SECTION {index+1} OF {lesson.slides.length}</span><h2>{slide.title}</h2><div className="st-slide-text">{slide.text}</div></>}
          {speech==='checkpoint'&&!questionsOpen&&!finished&&<p className="st-checkpoint" role="status">Discussion break. Ask the class a question or invite learners to ask theirs before continuing. {autoAdvance&&!voiceError&&index<lesson.slides.length-1&&!/activity|exercise|discussion|practice|assessment/i.test(slide.title)?'Next section begins automatically after 20 seconds.':''}</p>}
          {questionsOpen&&<section className="st-questions" aria-label="Class questions">
            <h3><MessageCircle size={24}/> Ask the Smart Teacher</h3>
            <form onSubmit={e=>{e.preventDefault();ask();}}>
              <label className="st-field">Learner question<input autoFocus value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} placeholder="Type a question from the class"/></label>
              <button type="submit" disabled={!question.trim()}>Ask question</button>
            </form>
            {exchange&&<div className="st-answer"><strong>{exchange.question}</strong><p>{exchange.reply.text}</p><small>{exchange.reply.source}{exchange.reply.kind==='excerpt'?' · This excerpt may not directly answer the question.':''}</small>
              <button type="button" onClick={()=>speak(exchange.reply.text,false)}><Volume2 size={19}/> Read response</button></div>}
            <button type="button" onClick={()=>{stop();setQuestionsOpen(false);}}>Return to lesson</button>
          </section>}
          {voiceError&&<p role="alert" className="st-checkpoint">{voiceError}</p>}
        </div>
        <footer className="st-controls">
          <div className="st-actions">
            <button type="button" disabled={index===0} onClick={()=>move(index-1)}><ArrowLeft size={19}/> Previous</button>
            {!finished&&<button type="button" disabled={questionsOpen||speech==='speaking'||speech==='paused'} onClick={()=>speak(slide.title+'. '+slide.text,true)}><Play size={20}/> Read section</button>}
            <button type="button" disabled={speech!=='speaking'&&speech!=='paused'} onClick={togglePause}>{speech==='paused'?<Play size={19}/>:<Pause size={19}/>} {speech==='paused'?'Resume':'Pause'}</button>
            <button type="button" disabled={speech!=='speaking'&&speech!=='paused'} onClick={stop}><Square size={18}/> Stop</button>
            <button type="button" aria-pressed={autoAdvance} onClick={()=>setAutoAdvance(v=>!v)}>Auto advance: {autoAdvance?'on':'off'}</button>
            <button type="button" disabled={questionsOpen} onClick={openQuestions}><MessageCircle size={20}/> Questions</button>
          </div>
          <div className="st-actions">{index<lesson.slides.length-1?<><button type="button" onClick={()=>move(index+1)}>Next <ArrowRight size={19}/></button><button type="button" onClick={()=>move(index+1,true)}>Next and read <Volume2 size={19}/></button></>:<button type="button" disabled={finished} onClick={()=>{stop();setQuestionsOpen(false);setFinished(true);}}>Finish lesson</button>}</div>
        </footer>
      </div>
    </dialog>}
  </section>;
}
