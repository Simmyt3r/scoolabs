import {useMemo,useState} from 'react';
import {ArrowRight, Atom, BookOpen, FlaskConical, Leaf, Search} from 'lucide-react';
import rawCards from './data/reference-atlas.json';
import rawConstants from './data/physical-constants.json';
import type {Subject} from './engine';
import {experiments} from './engine';

export type ReferenceCard={
  id:string;subject:Subject;category:string;title:string;overview:string;
  experimentId:string;limitation:string;
  equation?:string;workedExample?:string;scientificName?:string;observation?:string;
};
export type PhysicalConstant={id:string;name:string;valueText:string;uncertainty:string;unit:string;source:string};

export const atlasCards:ReferenceCard[]=rawCards as ReferenceCard[];
export const physicalConstants:PhysicalConstant[]=rawConstants as PhysicalConstant[];
export function filterAtlas(subject:Subject,query:string,category='all'){
  const q=query.trim().toLocaleLowerCase('en');
  return atlasCards.filter(card=>card.subject===subject&&(category==='all'||card.category===category)&&
    (!q||[card.title,card.category,card.overview,card.equation||'',card.scientificName||''].some(value=>value.toLocaleLowerCase('en').includes(q))));
}
const subhead:Record<string,string>={
 physics:'Physical quantities, equations, worked examples and verified CODATA constants.',
 biology:'Microscopy specimens, cell structures and biological classification examples.',
 agriculture:'Crops and livestock important to introductory agricultural science.'
};

export default function ReferenceAtlas({subject,onChoosePractical}:{
  subject:Subject;onChoosePractical:(id:string)=>void;
}){
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [selection,setSelection]=useState<string|null>(null);
  const [showConstants,setShowConstants]=useState(false);
  const categories=useMemo(()=>[...new Set(atlasCards.filter(c=>c.subject===subject).map(c=>c.category))], [subject]);
  const entries=useMemo(()=>filterAtlas(subject,query,category),[subject,query,category]);
  const chosen=entries.find(e=>e.id===selection)??entries[0];
  const Icon=subject==='physics'?Atom:subject==='biology'?FlaskConical:Leaf;
  return <section className="reference-atlas" aria-label={subject+' interactive reference atlas'}>
    <div className="library-heading"><div><span className="eyebrow">SUBJECT REFERENCE</span><h2>{subject==='physics'?'Formulas and physical constants':subject==='biology'?'Specimens and biological structures':'Crops and livestock'}</h2>
      <p>{subhead[subject]}</p></div><Icon size={30}/></div>
    <div className="atlas-filter-bar">
      <label className="library-search"><Search size={16}/><input type="search" aria-label="Search reference cards" placeholder="Search formula, specimen, crop or topic…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <select aria-label="Filter reference category" value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="all">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
    </div>
    <p className="library-results-count" role="status">{entries.length} reference card{entries.length===1?'':'s'}</p>
    {entries.length===0?<p className="library-empty">No matching reference. Try a different topic or category.</p>:
      <div className="atlas-layout">
        <div className="atlas-list" aria-label="Reference topics">{entries.map(card=><button key={card.id} type="button" aria-pressed={card.id===chosen?.id}
          className={'atlas-choice '+(card.id===chosen?.id?'active':'')} onClick={()=>setSelection(card.id)}>
          <small>{card.category}</small><strong>{card.title}</strong><ArrowRight size={15}/></button>)}</div>
        {chosen&&<article className="atlas-card" key={chosen.id} aria-label={'Reference: '+chosen.title}>
          <span className="eyebrow">{chosen.category.toUpperCase()}</span><h3>{chosen.title}</h3>
          {chosen.scientificName&&<p className="atlas-scientific"><em>{chosen.scientificName}</em></p>}
          <p>{chosen.overview}</p>
          {chosen.equation&&<div className="atlas-equation"><span>REFERENCE EQUATION</span><strong>{chosen.equation}</strong></div>}
          {chosen.workedExample&&<section><h4>Worked example</h4><p>{chosen.workedExample}</p></section>}
          {chosen.observation&&<section><h4>What to observe or compare</h4><p>{chosen.observation}</p></section>}
          <section className="atlas-limitation"><h4>Scientific note</h4><p>{chosen.limitation}</p></section>
          <button type="button" className="button-outline" onClick={()=>onChoosePractical(chosen.experimentId)}>
            Explore related practical: {experiments.find(e=>e.id===chosen.experimentId)?.title??'Science lesson'} <ArrowRight size={15}/></button>
        </article>}
      </div>}
    {subject==='physics'&&<div className="physics-constants">
      <div className="library-heading"><div><span className="eyebrow">SCIENTIFIC REFERENCE DATA</span><h3>NIST fundamental physical constants</h3>
      <p>Selected 2022 CODATA values downloaded, validated and packaged before installation. No internet needed in the classroom.</p></div>
      <button type="button" className="button-outline" aria-expanded={showConstants} onClick={()=>setShowConstants(v=>!v)}>
        {showConstants?'Hide constants':'View '+physicalConstants.length+' constants'}</button></div>
      {showConstants&&<div className="physics-constants-scroll"><table><thead><tr><th>Quantity</th><th>Recommended value</th><th>Unit</th><th>Uncertainty</th></tr></thead><tbody>
        {physicalConstants.map(item=><tr key={item.name}><th scope="row">{item.name}</th><td>{item.valueText}</td><td>{item.unit||'dimensionless'}</td><td>{item.uncertainty}</td></tr>)}
      </tbody></table></div>}
      <p className="atlas-source">Source: NIST CODATA 2022 fundamental physical constants, reference database version 9.0 (May 2024). Numerical strings preserve source precision. Consult the bundled data provenance for details.</p>
    </div>}
    <p className="atlas-disclaimer"><BookOpen size={16}/> These are introductory educational reference cards, not medical, veterinary, agronomic or laboratory-safety instructions. Independent teacher review is pending.</p>
  </section>;
}
