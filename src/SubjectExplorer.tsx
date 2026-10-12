import {useMemo,useState} from 'react';
import {Atom, ArrowRight, Beaker, BookOpen, FlaskConical, Microscope, Search, ShieldAlert, Sprout, Wrench, Zap} from 'lucide-react';
import type {Subject} from './engine';
import {experiments} from './engine';
import {searchLibrary,subjectApparatus,subjectConcepts,type Apparatus,type KeyConcept} from './subject-library';
import PeriodicTable from './PeriodicTable';

type Section='overview'|'concepts'|'apparatus'|'periodic';
const labels:Record<Subject,string>={chemistry:'Chemistry',physics:'Physics',biology:'Biology',agriculture:'Agricultural Science'};
const subjectDescriptions:Record<Subject,string>={
 chemistry:'Understand matter, explore elements and properties, inspect laboratory apparatus, then investigate reactions and solutions.',
 physics:'Discover forces, energy, electricity, motion and light before working with the instruments that measure them.',
 biology:'Study cells, life processes and living systems; examine biological equipment before exploring specimens and models.',
 agriculture:'Learn soils, crops, livestock and farming systems, then investigate the instruments and tools used in the field.'
};
const IconBySubject={chemistry:FlaskConical,physics:Zap,biology:Microscope,agriculture:Sprout};
function RelatedPractical({id,onOpen}:{id:string;onOpen:(id:string)=>void}){
 const experiment=experiments.find(e=>e.id===id);
 return experiment?<button type="button" className="text-button library-practical-link" onClick={()=>onOpen(id)}>Try related practical: {experiment.title}<ArrowRight size={15}/></button>:null;
}
function Concepts({subject,onOpen}:{subject:Subject;onOpen:(id:string)=>void}){
 const [search,setSearch]=useState('');
 const list=useMemo(()=>searchLibrary(subjectConcepts(subject),search),[subject,search]);
 return <section className="reference-section" aria-label={labels[subject]+' concepts'}>
  <div className="library-heading"><div><span className="eyebrow">FOUNDATIONAL KNOWLEDGE</span><h2>Key concepts</h2><p>Read the explanation, examine an example and challenge a common misconception.</p></div><BookOpen size={29}/></div>
  <label className="library-search"><Search size={17}/><span className="sr-only">Search key concepts</span><input aria-label="Search key concepts" type="search" placeholder="Search terms and topics…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  <div className="library-results-count" role="status">{list.length} topic{list.length===1?'':'s'} found</div>
  {list.length===0?<p className="library-empty">No concept matches. Try another science term.</p>:<div className="reference-list">
    {list.map((item:KeyConcept)=><details className="reference-item" key={item.id}>
       <summary><span className="reference-topic">{item.topic}</span><strong>{item.title}</strong><span className="reference-item-description">{item.overview}</span></summary>
       <div className="reference-details"><p><strong>Example:</strong> {item.example}</p><p><strong>Check your understanding:</strong> {item.misconception}</p>
          <RelatedPractical id={item.experimentId} onOpen={onOpen}/></div>
    </details>)}
  </div>}
 </section>;
}
function ApparatusLibrary({subject,onOpen}:{subject:Subject;onOpen:(id:string)=>void}){
 const [search,setSearch]=useState('');
 const list=useMemo(()=>searchLibrary(subjectApparatus(subject),search),[subject,search]);
 const [chosen,setChosen]=useState('');
 const selected=list.find(e=>e.id===chosen)??list[0];
 return <section className="reference-section" aria-label={labels[subject]+' apparatus'}>
   <div className="library-heading"><div><span className="eyebrow">INSTRUMENTS AND EQUIPMENT</span><h2>Apparatus and tools</h2><p>Identify instruments by name, learn their functions and practise safe handling concepts.</p></div><Wrench size={29}/></div>
   <label className="library-search"><Search size={17}/><span className="sr-only">Search apparatus</span><input aria-label="Search apparatus" type="search" placeholder="Find a tool or instrument…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <div className="library-results-count" role="status">{list.length} equipment guide{list.length===1?'':'s'}</div>
   {selected?<div className="apparatus-browser"><div className="apparatus-list">{list.map((item:Apparatus)=><button type="button" key={item.id} aria-pressed={selected.id===item.id} className={'apparatus-choice '+(selected.id===item.id?'active':'')} onClick={()=>setChosen(item.id)}><span className="apparatus-choice-symbol"><Beaker size={19}/></span><span><strong>{item.title}</strong><small>{item.category}</small></span><ArrowRight size={16}/></button>)}</div>
     <article className="apparatus-detail" aria-label={'Equipment guide: '+selected.title}>
       <div className="apparatus-illustration" role="img" aria-label={'Reference icon for '+selected.title+'; not a technical diagram'}><Beaker size={60} strokeWidth={1.3}/><span>{selected.category}</span></div>
       <span className="eyebrow">APPARATUS IDENTIFICATION</span><h3>{selected.title}</h3>
       <h4>What it is used for</h4><p>{selected.purpose}</p>
       <h4>How it is used</h4><p>{selected.howToUse}</p>
       <div className="apparatus-safety"><ShieldAlert size={18}/><div><strong>Safety and limitations</strong><p>{selected.safety}</p></div></div>
       <RelatedPractical id={selected.experimentId} onOpen={onOpen}/>
       <small className="apparatus-caveat">Reference icon only. Instrument-specific labeled diagrams and manipulable 3D models remain a planned upgrade.</small>
     </article></div>:<p className="library-empty">No matching apparatus. Try a different instrument name.</p>}
  </section>;
}
export default function SubjectExplorer({subject,onChoosePractical}:{subject:Subject;onChoosePractical:(id:string)=>void}){
 const [tab,setTab]=useState<Section>('overview');
 const Icon=IconBySubject[subject];
 const options:Section[]=subject==='chemistry'?['overview','concepts','periodic','apparatus']:['overview','concepts','apparatus'];
 const title=(id:Section)=>id==='overview'?'Subject overview':id==='concepts'?'Key concepts':id==='periodic'?'Periodic table':'Apparatus';
 return <section className="subject-explorer" aria-label={labels[subject]+' knowledge and apparatus hub'}>
   <div className="subject-hub-hero"><span className="subject-hub-icon"><Icon size={24}/></span><div><span className="eyebrow">EXPLORE THE SCIENCE</span>
      <h2>{labels[subject]} knowledge centre</h2><p>{subjectDescriptions[subject]}</p></div>
      <div className="subject-hub-facts"><strong>{subjectConcepts(subject).length}</strong><span>Core concepts</span><strong>{subjectApparatus(subject).length}</strong><span>Apparatus guides</span></div></div>
   <div role="tablist" aria-label={labels[subject]+' learning resources'} className="subject-hub-tabs">
     {options.map(option=><button role="tab" type="button" id={'hub-tab-'+subject+'-'+option} aria-controls={'hub-panel-'+subject} aria-selected={tab===option} key={option} onClick={()=>setTab(option)}>{title(option)}</button>)}
   </div>
   <div role="tabpanel" id={'hub-panel-'+subject} aria-labelledby={'hub-tab-'+subject+'-'+tab} className="subject-hub-body">
      {tab==='overview'?<div className="hub-overview">
        <p className="hub-overview-lead">Start with the science behind the experiment. Each reference topic points to an activity where you can apply what you learned.</p>
        <div className="hub-overview-cards">
         <button type="button" className="hub-feature-card" onClick={()=>setTab('concepts')}><BookOpen size={23}/><strong>Build understanding</strong><span>{subjectConcepts(subject).length} key ideas with examples and misconceptions</span><small>Explore concepts <ArrowRight size={14}/></small></button>
         <button type="button" className="hub-feature-card" onClick={()=>setTab('apparatus')}><Wrench size={23}/><strong>Know your instruments</strong><span>{subjectApparatus(subject).length} tools, functions and safety notes</span><small>Explore apparatus <ArrowRight size={14}/></small></button>
         {subject==='chemistry'?<button type="button" className="hub-feature-card" onClick={()=>setTab('periodic')}><Atom size={23}/><strong>Discover the elements</strong><span>Search all 118 elements and compare properties</span><small>Open periodic table <ArrowRight size={14}/></small></button>:
         <button type="button" className="hub-feature-card" onClick={()=>onChoosePractical(experiments.find(e=>e.subject===subject)!.id)}><Beaker size={23}/><strong>Learn by experimenting</strong><span>Apply concepts in guided virtual practicals</span><small>Open a practical <ArrowRight size={14}/></small></button>}
        </div>
      </div>:tab==='concepts'?<Concepts subject={subject} onOpen={onChoosePractical}/>:tab==='apparatus'?<ApparatusLibrary subject={subject} onOpen={onChoosePractical}/>:<PeriodicTable/>}
   </div>
 </section>;
}
