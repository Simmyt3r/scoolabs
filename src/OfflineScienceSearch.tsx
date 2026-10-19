import {useEffect, useMemo, useState} from 'react';
import {invoke, isTauri} from '@tauri-apps/api/core';
import {ArrowRight, BookOpen, CheckCircle2, Search, Sparkles, WifiOff} from 'lucide-react';
import {keywordSearch, scienceCorpus, type ScienceHit, type ScoredHit} from './scienceSearch';

type Subject = ScienceHit['subject'];
type InstalledPack = {
  verified:boolean;modelInstalled:boolean;scienceDatasets:number;
  modelInferenceEnabled:boolean;message:string;
};
const subjects: {id:Subject; name:string}[] = [
  {id:'chemistry',name:'Chemistry'},{id:'physics',name:'Physics'},
  {id:'biology',name:'Biology'},{id:'agriculture',name:'Agricultural Science'},
];
type Props = {onOpenExperiment:(experimentId:string)=>void};

export default function OfflineScienceSearch({onOpenExperiment}:Props){
  const [query,setQuery]=useState('');
  const [subject,setSubject]=useState<Subject>('physics');
  const [results,setResults]=useState<ScoredHit[]>([]);
  const [mode,setMode]=useState<'keyword'|'semantic'>('keyword');
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState('');
  const [warning,setWarning]=useState('');
  const [pack,setPack]=useState<InstalledPack|null>(null);
  const [checked,setChecked]=useState(false);
  const available=useMemo(()=>scienceCorpus.filter(item=>item.subject===subject).length,[subject]);

  useEffect(()=>{
    if(!isTauri()){setChecked(true);return;}
    let live=true;
    invoke<InstalledPack>('offline_assets_status')
      .then(status=>{if(live){setPack(status);setChecked(true);}})
      .catch(()=>{if(live){setChecked(true);setWarning('The local model package could not be verified.');}});
    return ()=>{live=false;};
  },[]);

  function findExact(){
    if(busy)return;
    const next=keywordSearch(query, scienceCorpus.filter(item=>item.subject===subject));
    setResults(next);setMode('keyword');setWarning('');
  }

  async function findByMeaning(){
    if(busy || !pack?.verified || !pack.modelInstalled)return;
    if(query.trim().length<3 || query.trim().length>300){
      setWarning('Enter a science question between 3 and 300 characters.');
      return;
    }
    setBusy(true);setProgress('Loading verified model from this computer…');setWarning('');
    try{
      // Lazy import keeps the ordinary classroom experience fast on low-RAM devices.
      const {semanticScienceSearch}=await import('./offlineAI');
      const next=await semanticScienceSearch(query,subject,(done,total)=>
        setProgress('Building local reference index: '+done+' / '+total));
      setResults(next);setMode('semantic');
      if(!next.length)setWarning('No sufficiently related sources were found. Try a more specific question.');
    }catch{
      setResults(keywordSearch(query,scienceCorpus.filter(item=>item.subject===subject)));
      setMode('keyword');
      setWarning('Offline AI search could not run on this computer. Showing standard science-reference matches instead.');
    }finally{setBusy(false);setProgress('');}
  }
  function changeSubject(next:Subject){
    if(busy)return;
    setSubject(next);setResults([]);setWarning('');setMode('keyword');
  }
  return <section className="offline-search" aria-label="Offline science reference search">
    <div className="page-title"><div><span className="eyebrow">SCOOLABS · LOCAL SCIENCE INTELLIGENCE</span>
      <h1>Find science explanations from verified references</h1>
      <p>Ask a question or search a concept. Every result is an existing science reference, not a new AI-generated scientific claim.</p>
    </div><div className="progress-badge"><WifiOff size={19}/><div><strong>Private, offline by design</strong><small>No student query is uploaded</small></div></div></div>
    <div className="learning-panel">
      <label className="small-label" htmlFor="scoolabs-search-subject">Science subject</label>
      <select id="scoolabs-search-subject" value={subject} disabled={busy}
        onChange={event=>changeSubject(event.target.value as Subject)}>
        {subjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <p className="learning-explainer">{available} locally bundled references are available for {subjects.find(x=>x.id===subject)?.name}.</p>
      <form onSubmit={e=>{e.preventDefault();findExact();}} className="offline-search-controls">
        <label className="library-search"><Search size={18}/>
          <input value={query} onChange={event=>setQuery(event.target.value)}
            maxLength={300} type="search" aria-label="Science reference question"
            placeholder="e.g. Why does voltage affect electric current?"/>
        </label>
        <button type="submit" className="button-outline" disabled={!query.trim()||busy}>Search references</button>
        <button type="button" className="button-primary" onClick={()=>void findByMeaning()}
          disabled={!query.trim()||busy||!pack?.verified||!pack.modelInstalled}>
          <Sparkles size={16}/> {busy?'Searching locally…':'Find by meaning (offline AI)'}
        </button>
      </form>
      <p className="learning-explainer" role="status">
        {busy?progress:pack?.verified?
          <><CheckCircle2 size={14}/> Local AI model package verified. Optional semantic retrieval is experimental.</>:
          checked?'AI model not available or not verified. Standard offline references remain searchable.':'Checking installed model…'}
      </p>
      {warning&&<div role="alert" className="record-note">{warning}</div>}
    </div>
    <div aria-live="polite" className="offline-search-results">
      <div className="library-heading"><div><span className="eyebrow">{mode==='semantic'?'LOCAL MODEL RETRIEVAL':'STANDARD REFERENCE SEARCH'}</span>
        <h2>{results.length} matching reference{results.length===1?'':'s'}</h2></div><BookOpen size={22}/></div>
      {results.length===0?<p className="library-empty">Enter a topic above to find chemistry, physics, biology or agriculture references.</p>:
        <div className="offline-search-result-list">
          {results.map(({hit})=><article className="atlas-card" key={hit.id}>
            <span className="eyebrow">{hit.subject.toUpperCase()}</span><h3>{hit.title}</h3>
            <p>{hit.evidence}</p>
            <p className="atlas-source">Source: {hit.sourceLabel}
              {hit.sourceUrl?' · Source URL: '+hit.sourceUrl:''}</p>
            {hit.experimentId&&<button className="text-button" type="button" onClick={()=>onOpenExperiment(hit.experimentId!)}>
              Open related practical <ArrowRight size={15}/></button>}
          </article>)}
        </div>}
      <p className="atlas-disclaimer"><BookOpen size={16}/> Similarity scores rank reference passages; they do not verify correctness, establish mastery or replace supervised science teaching. External source URLs are citations, not network requests.</p>
    </div>
  </section>;
}
