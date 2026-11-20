import {useEffect,useRef,useState} from 'react';
import {invoke,isTauri} from '@tauri-apps/api/core';
import {BoardVisual} from './ClassroomBoard';
import {elapsedClock,type PublicFrame} from './classroomBoard';
import './smart-teacher.css';

export function ProjectorDisplay({frame}:{frame:PublicFrame|null}){
  if(!frame||frame.mode==='blank'||frame.mode==='waiting')return <main className="st-tv st-tv-waiting" aria-label="Classroom display"><span>SCOOLABS SMART TEACHER</span><h1>{frame?.mode==='blank'?'Classroom pause':'Waiting for the lesson'}</h1><p>Please wait for your teacher.</p></main>;
  return <main className="st-tv" aria-label="Classroom display">
    <header><div><span>SCOOLABS SMART TEACHER</span><strong>{frame.topic}</strong></div><div className="st-tv-status">{frame.status}<small>{elapsedClock(frame.elapsedSeconds)} / {frame.targetMinutes} min</small></div></header>
    <progress aria-label="Lesson progress" max={frame.total||1} value={frame.section}/>
    <article className={'st-tv-content '+(frame.board.kind!=='none'?'st-tv-board':'')}>
      <div className="st-tv-copy"><span className="st-overline">{frame.mode==='lesson'?'SECTION '+frame.section+' OF '+frame.total:frame.mode==='assessment'?'CLASS ASSESSMENT':frame.mode==='question'?'CLASS DISCUSSION':'LESSON COMPLETE'}</span><h1>{frame.title}</h1><p>{frame.text}</p>
      {frame.response&&<div className="st-tv-answer"><strong>{frame.response}</strong>{frame.source&&<small>{frame.source}</small>}</div>}</div>
      <BoardVisual board={frame.board}/>
    </article>
    <footer>Scoolabs · Classroom display</footer>
  </main>;
}
export default function ClassroomProjector(){
  const [frame,setFrame]=useState<PublicFrame|null>(null);
  useEffect(()=>{
    if(!isTauri())return;
    let disposed=false;let timer:number|undefined;
    let expiry:number|undefined;
    const poll=async()=>{
      // Blank locally if the bridge stalls, independently of the native five-second lease.
      if(expiry===undefined)expiry=window.setTimeout(()=>{if(!disposed)setFrame(null);expiry=undefined;},5500);
      try{
        const data=await invoke<PublicFrame|null>('read_classroom_frame');
        if(!disposed){window.clearTimeout(expiry);expiry=undefined;setFrame(data);}
      }catch{if(!disposed)setFrame(null);}
      finally{if(!disposed)timer=window.setTimeout(poll,250);}
    };
    void poll();
    return ()=>{disposed=true;window.clearTimeout(timer);window.clearTimeout(expiry);};
  },[]);
  return <ProjectorDisplay frame={frame}/>;
}
// Main-window coordinator. Heartbeats publish only the current allowlisted frame.
export function useProjector(frame:PublicFrame){
  const live=useRef(frame);live.current=frame;
  const sessionRef=useRef<string|null>(null);
  const [session,setSession]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  const [opening,setOpening]=useState(false);
  const [connected,setConnected]=useState(false);
  const lifecycle=useRef(0);
  const seq=useRef(0);
  const mounted=useRef(true);
  useEffect(()=>{
    mounted.current=true;
    return ()=>{mounted.current=false;lifecycle.current++;const current=sessionRef.current;sessionRef.current=null;if(current)void invoke('close_classroom_projector',{session:current}).catch(()=>undefined);};
  },[]);
  async function open(){
    if(!isTauri()||opening||sessionRef.current)return;
    const request=++lifecycle.current;setOpening(true);setNotice('Opening classroom display…');
    try{
      const id=await invoke<string>('open_classroom_projector');
      if(!mounted.current||request!==lifecycle.current){void invoke('close_classroom_projector',{session:id}).catch(()=>undefined);return;}
      sessionRef.current=id;seq.current=0;setSession(id);setConnected(false);
      setNotice('Move the classroom display to the extended TV and maximize it.');
    }catch{if(mounted.current&&request===lifecycle.current)setNotice('Unable to open separate display. Continue using the main classroom view.');}
    finally{if(mounted.current&&request===lifecycle.current)setOpening(false);}
  }
  function close(){
    lifecycle.current++;setOpening(false);setConnected(false);
    const current=sessionRef.current;sessionRef.current=null;setSession(null);
    setNotice('');
    if(current)void invoke('close_classroom_projector',{session:current}).catch(()=>{if(mounted.current)setNotice('Display close could not be confirmed; the display lease will expire.');});
  }
  useEffect(()=>{
    if(!session)return;
    let disposed=false;let timer:number|undefined;
    const send=async()=>{
      const id=++seq.current;
      try{await invoke('publish_classroom_frame',{session,seq:id,frame:live.current});if(!disposed){setConnected(true);}}
      catch{if(!disposed&&sessionRef.current===session){sessionRef.current=null;setSession(null);setConnected(false);setNotice('Separate display disconnected. Reopen it or use the main classroom view.');}}
      finally{if(!disposed&&sessionRef.current===session)timer=window.setTimeout(send,250);}
    };
    void send();
    return ()=>{disposed=true;window.clearTimeout(timer);};
  },[session]);
  return {open,close,opening,connected,notice,active:session!==null};
}
