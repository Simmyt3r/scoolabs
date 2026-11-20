import {useEffect,useRef,useState} from 'react';
import {invoke,isTauri} from '@tauri-apps/api/core';
import {ArrowLeft,ArrowRight,BookOpen,GraduationCap,Maximize,MessageCircle,Mic,MicOff,Pause,Play,Square,Volume2} from 'lucide-react';
import {answerQuestion,DEMO_PLAN,DEMO_TOPIC,prepareLesson,type Lesson,type Reply} from './lessonEngine';
import {importTextLesson,lessonReferences,LESSON_FILE_MAX,makeLessonFile,parseLessonFile,referenceDraft,type LessonFile} from './lessonLibrary';
import {answerRequest,draftRequest,parseModelDraft,validateSuggestion,type ModelResult,type ModelSuggestion} from './localTeacherModel';
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
  const [referenceSubject,setReferenceSubject]=useState('physics');
  const [referenceId,setReferenceId]=useState('');
  const [draftReview,setDraftReview]=useState(false);
  const [reviewed,setReviewed]=useState(false);
  const [fileStatus,setFileStatus]=useState('');
  const [fileBusy,setFileBusy]=useState(false);
  const [quizIndex,setQuizIndex]=useState<number|null>(null);
  const [revealed,setRevealed]=useState(false);
  const [listening,setListening]=useState(false);
  const [voiceNotice,setVoiceNotice]=useState('');
  const [autoSpeakReply,setAutoSpeakReply]=useState(true);
  const [modelReady,setModelReady]=useState(false);
  const [modelChecking,setModelChecking]=useState(false);
  const [modelBusy,setModelBusy]=useState(false);
  const [modelNotice,setModelNotice]=useState('');
  const [modelSuggestion,setModelSuggestion]=useState<ModelSuggestion|null>(null);
  const [showModelReview,setShowModelReview]=useState(false);
  const modelRun=useRef(0);
  const modelPending=useRef(false);
  const modelCheckRun=useRef(0);
  const voiceRun=useRef(0);
  const voicePending=useRef(false);
  const voiceRequest=useRef<string|null>(null);
  const mounted=useRef(true);
  const dialog=useRef<HTMLDialogElement>(null);
  const generation=useRef(0);
  const active=useRef(false);
  const utterance=useRef<SpeechSynthesisUtterance|null>(null);
  const launch=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    mounted.current=true;
    return ()=>{mounted.current=false;voiceRun.current++;modelRun.current++;modelCheckRun.current++;if(voiceRequest.current)void invoke('cancel_class_question',{requestId:voiceRequest.current}).catch(()=>undefined);};
  },[]);
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
    if(!autoAdvance||!lesson||questionsOpen||quizIndex!==null||finished||speech!=='checkpoint'||voiceError||index>=lesson.slides.length-1||/activity|exercise|discussion|practice|assessment/i.test(lesson.slides[index].title))return;
    const timer=window.setTimeout(()=>move(index+1,true),20000);
    return ()=>window.clearTimeout(timer);
  },[autoAdvance,lesson,index,questionsOpen,quizIndex,finished,speech,voiceError]);
  function cancelListening(){
    if(!voicePending.current)return;
    voiceRun.current++;setVoiceNotice('Stopping microphone…');
    if(voiceRequest.current)void invoke('cancel_class_question',{requestId:voiceRequest.current}).catch(()=>undefined);
  }
  async function listen(){
    if(!isTauri()||voicePending.current)return;
    stop();setVoiceNotice('Listening for one question on the local Windows recognizer. Speak now.');
    const id=++voiceRun.current;const requestId=crypto.randomUUID();voiceRequest.current=requestId;voicePending.current=true;setListening(true);
    try{
      const result=await invoke<{text:string;confidence:number}>('recognize_class_question',{requestId});
      if(!mounted.current||voiceRun.current!==id)return;
      setQuestion(result.text);setVoiceNotice('Check or correct the transcript, then select Ask question.');
    }catch(e){if(mounted.current&&voiceRun.current===id)setVoiceNotice(typeof e==='string'?e:'Microphone recognition failed. Type the question instead.');}
    finally{voicePending.current=false;voiceRequest.current=null;if(mounted.current){setListening(false);if(voiceRun.current!==id)setVoiceNotice('Microphone stopped.');}}
  }
  function stop(){
    cancelListening();
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
  function useFile(file:LessonFile,message:string){
    setTopic(file.topic);setPlan(file.plan);setDraftReview(true);setReviewed(false);setError('');setFileStatus(message);
  }
  function createDraft(){
    try{useFile(referenceDraft(referenceId),'Draft prepared from the selected local reference. Review and adapt it for the class before starting.');}
    catch(e){setError(e instanceof Error?e.message:'Could not prepare draft.');}
  }
  async function openFile(file:File){
    if(fileBusy)return;setFileBusy(true);setError('');setFileStatus('');
    try{
      if(file.size>LESSON_FILE_MAX)throw new Error('Lesson file is too large.');
      const raw=await file.text();
      const isJson=/\.json$/i.test(file.name);
      const lessonFile=isJson?parseLessonFile(raw):/\.(txt|md)$/i.test(file.name)?importTextLesson(raw,topic.trim()||file.name.replace(/\.(txt|md)$/i,'').slice(0,150)):null;
      if(!lessonFile)throw new Error('Use a Scoolabs JSON file or plain text / Markdown notes.');
      useFile(lessonFile,'Lesson imported locally. Review the content before teaching.');
    }catch(e){setError(e instanceof Error?e.message:'Unable to read lesson file.');}
    finally{setFileBusy(false);}
  }
  function exportFile(){
    let url:string|undefined;
    try{
      if(draftReview&&!reviewed)throw new Error('Review the draft before exporting it.');
      const data=makeLessonFile(topic,plan);
      url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='scoolabs-'+(data.topic.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'lesson')+'.lesson.json';
      document.body.appendChild(link);link.click();link.remove();setFileStatus('Lesson file prepared. Use your browser or Windows download location to save or share it.');setError('');
    }catch(e){setError(e instanceof Error?e.message:'Unable to export lesson.');}
    finally{if(url){const release=url;window.setTimeout(()=>URL.revokeObjectURL(release),1000);}}
  }
  function invalidateModel(){
    modelRun.current++;modelPending.current=false;setModelBusy(false);setModelSuggestion(null);setShowModelReview(false);setModelNotice('');
  }
  async function checkModel(){
    if(!isTauri()||modelChecking||modelPending.current)return;
    const id=++modelCheckRun.current;setModelChecking(true);setModelReady(false);setModelNotice('Checking local model service…');
    try{
      const result=await invoke<{available:boolean;message:string}>('local_teacher_status');
      if(mounted.current&&modelCheckRun.current===id){setModelReady(result.available);setModelNotice(result.message);}
    }catch{if(mounted.current&&modelCheckRun.current===id)setModelNotice('Local model connection failed. Prepared lessons still work.');}
    finally{if(mounted.current&&modelCheckRun.current===id)setModelChecking(false);}
  }
  async function generateDraft(){
    if(!isTauri()||!modelReady||modelPending.current||fileBusy)return;
    let request;
    try{request=draftRequest(topic,plan,referenceId);}catch(e){setError(e instanceof Error?e.message:'Enter valid lesson details.');return;}
    const id=++modelRun.current;modelPending.current=true;setModelBusy(true);setModelNotice('Preparing a local AI draft. This may take several minutes.');setError('');
    try{
      const result=await invoke<ModelResult>('local_teacher_generate',{request});
      if(!mounted.current||modelRun.current!==id)return;
      useFile(parseModelDraft(request.topic,result),'AI-generated draft. Check every claim, example and answer before classroom use.');setModelNotice('Draft prepared for supervisor review.');
    }catch(e){if(mounted.current&&modelRun.current===id)setModelNotice(typeof e==='string'?e:e instanceof Error?e.message:'Generation failed. Your original notes remain unchanged.');}
    finally{if(mounted.current&&modelRun.current===id){modelPending.current=false;setModelBusy(false);}}
  }
  async function suggestAnswer(){
    if(!lesson||!exchange||!modelReady||modelPending.current||voicePending.current||exchange.reply.kind==='approved')return;
    const request=answerRequest(lesson,exchange.question);
    if(!request){setModelNotice('No relevant approved lesson passage was found. Ask the supervising teacher.');return;}
    stop();const id=++modelRun.current;modelPending.current=true;setModelBusy(true);setModelSuggestion(null);setShowModelReview(false);setModelNotice('Preparing a possible answer from this lesson…');
    try{
      const result=await invoke<ModelResult>('local_teacher_generate',{request});
      if(!mounted.current||modelRun.current!==id)return;
      const suggestion=validateSuggestion(request,result);
      setModelSuggestion(suggestion);setModelNotice(suggestion?'A suggestion is ready for supervisor review. Blank the TV before revealing it.':'The model abstained. Ask the supervising teacher.');
    }catch(e){if(mounted.current&&modelRun.current===id)setModelNotice(typeof e==='string'?e:e instanceof Error?e.message:'Model unavailable. The original response is still available.');}
    finally{if(mounted.current&&modelRun.current===id){modelPending.current=false;setModelBusy(false);}}
  }
  function acceptSuggestion(){
    if(!modelSuggestion||!exchange||!showModelReview)return;
    const text=modelSuggestion.text;
    setExchange({question:exchange.question,reply:{kind:'reviewed-ai',text,source:'Supervisor-reviewed AI suggestion · '+modelSuggestion.sources.map(p=>p.id).join(', ')}});
    setModelSuggestion(null);setShowModelReview(false);setModelNotice('Suggestion accepted by the supervisor.');
    if(autoSpeakReply&&selectedVoice)speak(text,false);
  }
  function startLesson(){
    try{
      if(fileBusy||modelPending.current)throw new Error('Finish preparing the lesson first.');
      if(draftReview&&!reviewed)throw new Error('Confirm that you reviewed this lesson before teaching.');
      const next=prepareLesson(topic,plan);
      invalidateModel();stop();setError('');setVoiceError('');setLesson(next);setIndex(0);setExchange(null);
      setQuestion('');setQuestionsOpen(false);setQuizIndex(null);setRevealed(false);setFinished(false);
      if(autoAdvance)speak(next.slides[0].title+'. '+next.slides[0].text,true);
    }catch(e){setError(e instanceof Error?e.message:'Unable to prepare this lesson.');}
  }
  function exit(){
    invalidateModel();stop();
    if(document.fullscreenElement===dialog.current)void document.exitFullscreen().catch(()=>undefined);
    dialog.current?.close();setLesson(null);
    requestAnimationFrame(()=>launch.current?.focus());
  }
  function move(next:number,read=false){
    if(!lesson||next<0||next>=lesson.slides.length)return;
    invalidateModel();stop();setIndex(next);setQuestionsOpen(false);setQuizIndex(null);setRevealed(false);setQuestion('');setExchange(null);setVoiceError('');setFinished(false);
    if(read)speak(lesson.slides[next].title+'. '+lesson.slides[next].text,true);
  }
  function ask(){
    if(!lesson||!question.trim()||voicePending.current)return;
    invalidateModel();stop();const reply=answerQuestion(lesson,question.trim());setExchange({question:question.trim(),reply});setQuestion('');setVoiceNotice('');
    if(autoSpeakReply&&selectedVoice)speak((reply.kind==='excerpt'?'Here is a related excerpt, not a confirmed answer. ':'')+reply.text,false);
  }
  function openQuestions(){
    invalidateModel();stop();setQuizIndex(null);setRevealed(false);setQuestionsOpen(true);setExchange(null);setQuestion('');setVoiceNotice('');
  }
  function openQuiz(){
    if(!lesson?.questions.length)return;
    invalidateModel();stop();setQuestionsOpen(false);setQuizIndex(0);setRevealed(false);
  }
  function closeQuiz(){stop();setQuizIndex(null);setRevealed(false);}
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
  const quiz=quizIndex===null?undefined:lesson?.questions[quizIndex];
  return <section className="smart-teacher" aria-label="Smart Teacher workspace">
    <div className="page-title"><div><span className="eyebrow">SCOOLABS · CLASSROOM TEACHING</span>
      <h1>Smart Teacher</h1><p>Prepare a lesson, project it on a TV or classroom screen, and pause for learner questions. No student account or internet connection is needed.</p></div>
      <div className="progress-badge"><GraduationCap size={22}/><div><strong>Offline classroom</strong><small>Teacher-supplied content</small></div></div></div>
    <div className="st-setup">
      <div className="st-panel"><h2>Prepare a lesson</h2>
        <p>Paste the actual teaching notes, not just a list of objectives. Use headings starting with # to divide the lesson. Optional Q: and A: pairs supply approved answers.</p>
        <div className="st-library-tools">
          <h3>Prepare from the offline reference library</h3>
          <p>Choose a bundled science reference to assemble an editable lesson draft with its original facts and limitations.</p>
          <label className="st-field">Reference subject<select value={referenceSubject} onChange={e=>{setReferenceSubject(e.target.value);setReferenceId('');}}><option value="physics">Physics</option><option value="chemistry">Chemistry</option><option value="biology">Biology</option><option value="agriculture">Agricultural Science</option></select></label>
          <label className="st-field">Reference topic<select value={referenceId} onChange={e=>setReferenceId(e.target.value)}><option value="">Choose a topic</option>{lessonReferences.filter(ref=>ref.subject===referenceSubject).map(ref=><option key={ref.id} value={ref.id}>{ref.title}</option>)}</select></label>
          <button type="button" className="button-outline" disabled={!referenceId||fileBusy||modelBusy} onClick={createDraft}>Prepare reference draft</button>
          <label className="st-field">Import lesson file<input type="file" accept=".json,.txt,.md" disabled={fileBusy||modelBusy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void openFile(file);}}/></label>
          {fileStatus&&<p role="status">{fileStatus}</p>}
          <div className="st-model-card"><h3>Optional local generative teacher</h3><p>Requires a separately installed, school-approved llama-server model. No model is downloaded by Scoolabs. Prepared lessons work without it. Use the topic and teaching outline below to request a draft; verify the draft before teaching.</p><button type="button" className="button-outline" disabled={!isTauri()||modelChecking||modelBusy} onClick={()=>void checkModel()}>{modelChecking?'Checking…':modelReady?'Recheck local model':'Check local model'}</button>{modelReady&&<button className="button-outline" type="button" onClick={()=>{invalidateModel();setModelReady(false);}}>Disconnect model</button>}<p role="status">{modelNotice||(!isTauri()?'Generative model connection is available in the installed desktop application only.':'Local model is not connected.')}</p></div>
        </div>
        <form onSubmit={e=>{e.preventDefault();startLesson();}}>
          <label className="st-field">Lesson topic<input required maxLength={150} value={topic} disabled={fileBusy||modelBusy} onChange={e=>{setTopic(e.target.value);setReviewed(false);}} placeholder="e.g. Photosynthesis"/></label>
          <label className="st-field">Lesson plan<textarea required rows={14} maxLength={20000} value={plan} disabled={fileBusy||modelBusy} onChange={e=>{setPlan(e.target.value);setReviewed(false);}} placeholder={'# Introduction\nPaste the introduction here.\n# Explanation\nPaste the teaching notes.\n# Class activity\nDescribe the activity.\n# Recap\nSummarise the lesson.\n# Questions and answers\nQ: ...\nA: ...'}/></label>
          <p className="st-hint">{plan.length.toLocaleString()} / 20,000 characters · session-only until exported</p>
          <button className="button-outline" type="button" disabled={!modelReady||fileBusy||modelBusy||!topic.trim()||!plan.trim()} onClick={()=>void generateDraft()}>Generate AI lesson draft</button>
          {modelBusy&&<button className="button-outline" type="button" onClick={invalidateModel}>Discard pending generation</button>}
          {draftReview&&<label className="st-auto"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> I have reviewed these notes, answers and limitations for my class.</label>}
          <label className="st-field">Offline narration voice<select value={selectedVoice?.voiceURI??''} onChange={e=>setVoiceId(e.target.value)} disabled={!voices.length}>
            {!voices.length&&<option value="">No local English voice detected</option>}
            {voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select></label>
          <label className="st-field">Speaking speed: {rate.toFixed(1)}×<input type="range" min={0.7} max={1.2} step={0.1} value={rate} onChange={e=>setRate(Number(e.target.value))}/></label>
          <label className="st-auto"><input type="checkbox" checked={autoSpeakReply} onChange={e=>setAutoSpeakReply(e.target.checked)}/> Read classroom answers aloud automatically when a local voice is available.</label>
          <label className="st-auto"><input type="checkbox" checked={autoAdvance} onChange={e=>setAutoAdvance(e.target.checked)}/> Hands-free narration: advance after 20 seconds of discussion; activity sections wait for the supervisor.</label>
          {error&&<p role="alert" className="st-error">{error}</p>}
          <div className="st-actions"><button ref={launch} className="button-primary" type="submit" disabled={fileBusy||modelBusy||(draftReview&&!reviewed)}>Start classroom <ArrowRight size={18}/></button>
            <button className="button-outline" type="button" disabled={fileBusy||modelBusy} onClick={()=>{setTopic(DEMO_TOPIC);setPlan(DEMO_PLAN);setError('');setFileStatus('');setDraftReview(false);setReviewed(false);}}>Load sample lesson</button>
            <button className="button-outline" type="button" disabled={fileBusy||modelBusy||!topic.trim()||!plan.trim()||(draftReview&&!reviewed)} onClick={exportFile}>Export lesson file</button></div>
        </form>
      </div>
      <aside className="st-panel"><h2><BookOpen size={20}/> How it teaches</h2>
        <ol><li>Present a large, readable section of the lesson.</li><li>Read it aloud using an installed local English voice, when available.</li><li>Pause for discussion and classroom activities after every section.</li><li>Type learner questions. Approved answers are repeated verbatim; related notes are labelled as excerpts.</li><li>Advance to the next section and recap.</li></ol>
        <p><Mic size={17}/> Windows desktop users can explicitly start one short offline microphone session using an installed English recognizer. Confirm the transcript before asking. Browser preview and unavailable microphones retain typed questions. An optional local language model can propose lesson drafts and answers, but a supervisor must review them before use.</p>
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
          {speech==='checkpoint'&&!questionsOpen&&quizIndex===null&&!finished&&<p className="st-checkpoint" role="status">Discussion break. Ask the class a question or invite learners to ask theirs before continuing. {autoAdvance&&!voiceError&&index<lesson.slides.length-1&&!/activity|exercise|discussion|practice|assessment/i.test(slide.title)?'Next section begins automatically after 20 seconds.':''}</p>}
          {questionsOpen&&<section className="st-questions" aria-label="Class questions">
            <h3><MessageCircle size={24}/> Ask the Smart Teacher</h3>
            <form onSubmit={e=>{e.preventDefault();ask();}}>
              <label className="st-field">Learner question<input autoFocus value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} disabled={listening} placeholder="Type a question from the class"/></label>
              <button type="submit" disabled={!question.trim()||listening}>Ask question</button>
            </form>
            <div className="st-actions"><button type="button" disabled={!isTauri()||listening||modelBusy} onClick={()=>void listen()}><Mic size={20}/> Listen to question</button><button type="button" disabled={!listening} onClick={()=>cancelListening()}><MicOff size={20}/> Stop listening</button></div>
            {listening&&<p className="st-checkpoint" role="status">Microphone active or stopping. One short session only.</p>}
            <p className="st-voice-note" role="status">{voiceNotice||(!isTauri()?'Microphone recognition is available in the Windows desktop application only. Type a question here.':'The microphone opens only after Listen to question. Audio is not saved by Scoolabs. Confirm the transcript before submitting.')}</p>
            {exchange&&<div className="st-answer"><strong>{exchange.question}</strong><p>{exchange.reply.text}</p><small>{exchange.reply.source}{exchange.reply.kind==='excerpt'?' · This excerpt may not directly answer the question.':''}</small>
              <button type="button" disabled={listening} onClick={()=>speak((exchange.reply.kind==='excerpt'?'Here is a related excerpt, not a confirmed answer. ':'')+exchange.reply.text,false)}><Volume2 size={19}/> Read response</button></div>}
            {modelReady&&exchange&&exchange.reply.kind!=='approved'&&exchange.reply.kind!=='reviewed-ai'&&<div className="st-model-review"><button type="button" disabled={modelBusy||listening} onClick={()=>void suggestAnswer()}>Suggest AI answer</button>{modelBusy&&<button type="button" onClick={invalidateModel}>Discard pending suggestion</button>}<p role="status">{modelNotice}</p>{modelSuggestion&&!showModelReview&&<button type="button" onClick={()=>setShowModelReview(true)}>Show suggestion for supervisor (blank TV first)</button>}{modelSuggestion&&showModelReview&&<div className="st-answer"><strong>Unverified AI suggestion — do not teach until checked</strong><p>{modelSuggestion.text}</p><details open><summary>Supplied evidence (verify the answer against it)</summary>{modelSuggestion.sources.map(p=><p key={p.id}>{p.id}: {p.text}</p>)}</details><div className="st-actions"><button type="button" onClick={acceptSuggestion}>Approve and present answer</button><button type="button" onClick={()=>{setModelSuggestion(null);setShowModelReview(false);setModelNotice('Suggestion rejected.');}}>Reject suggestion</button></div></div>}</div>}
            <button type="button" onClick={()=>{invalidateModel();stop();setQuestionsOpen(false);}}>Return to lesson</button>
          </section>}
          {quiz&&quizIndex!==null&&<section className="st-questions" aria-label="Class assessment"><h3>Class check · {quizIndex+1} / {lesson.questions.length}</h3><p className="st-quiz-question">{quiz.question}</p><button type="button" onClick={()=>speak(quiz.question,false)}><Volume2 size={19}/> Read question</button><p>Discuss your answer before the supervisor reveals it.</p>{revealed?<div className="st-answer"><strong>Approved answer</strong><p>{quiz.answer}</p><button type="button" onClick={()=>speak(quiz.answer,false)}><Volume2 size={19}/> Read answer</button></div>:<button type="button" onClick={()=>{stop();setRevealed(true);}}>Reveal answer</button>}<div className="st-actions"><button type="button" disabled={quizIndex===0} onClick={()=>{stop();setQuizIndex(quizIndex-1);setRevealed(false);}}>Previous question</button>{quizIndex<lesson.questions.length-1&&<button type="button" disabled={!revealed} onClick={()=>{stop();setQuizIndex(quizIndex+1);setRevealed(false);}}>Next question</button>}<button type="button" onClick={closeQuiz}>Return to lesson</button></div></section>}
          {voiceError&&<p role="alert" className="st-checkpoint">{voiceError}</p>}
        </div>
        <footer className="st-controls">
          <div className="st-actions">
            <button type="button" disabled={index===0} onClick={()=>move(index-1)}><ArrowLeft size={19}/> Previous</button>
            {!finished&&<button type="button" disabled={questionsOpen||quizIndex!==null||speech==='speaking'||speech==='paused'} onClick={()=>speak(slide.title+'. '+slide.text,true)}><Play size={20}/> Read section</button>}
            <button type="button" disabled={speech!=='speaking'&&speech!=='paused'} onClick={togglePause}>{speech==='paused'?<Play size={19}/>:<Pause size={19}/>} {speech==='paused'?'Resume':'Pause'}</button>
            <button type="button" disabled={speech!=='speaking'&&speech!=='paused'} onClick={stop}><Square size={18}/> Stop</button>
            <button type="button" aria-pressed={autoAdvance} onClick={()=>setAutoAdvance(v=>!v)}>Auto advance: {autoAdvance?'on':'off'}</button>
            <button type="button" disabled={questionsOpen} onClick={openQuestions}><MessageCircle size={20}/> Questions</button>
            <button type="button" disabled={quizIndex!==null||!lesson.questions.length} onClick={openQuiz}>Class check</button>
          </div>
          <div className="st-actions">{index<lesson.slides.length-1?<><button type="button" onClick={()=>move(index+1)}>Next <ArrowRight size={19}/></button><button type="button" onClick={()=>move(index+1,true)}>Next and read <Volume2 size={19}/></button></>:<button type="button" disabled={finished} onClick={()=>{invalidateModel();stop();setQuestionsOpen(false);setQuizIndex(null);setRevealed(false);setFinished(true);}}>Finish lesson</button>}</div>
        </footer>
      </div>
    </dialog>}
  </section>;
}
