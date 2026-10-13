import {useMemo,useState} from 'react';
import {Search,FlaskConical} from 'lucide-react';
import compoundsRaw from './data/compounds.json';
export interface Compound {cid:number;name:string;formula:string;molecularWeight:number;iupacName:string;source:string}
export const compounds:Compound[]=compoundsRaw as Compound[];
export default function CompoundReference(){
 const [query,setQuery]=useState('');
 const filtered=useMemo(()=>compounds.filter(x=>[x.name,x.formula,x.iupacName,String(x.cid)].some(s=>s.toLowerCase().includes(query.trim().toLowerCase()))),[query]);
 return <section className="compound-ref" aria-label="Common chemical compounds">
   <div className="library-heading"><div><span className="eyebrow">CHEMISTRY REFERENCE</span><h2>Common compounds and properties</h2><p>Search molecular formulas and molecular weights retrieved from NIH PubChem, bundled for offline learning.</p></div><FlaskConical size={28}/></div>
   <label className="library-search"><Search size={16}/><input aria-label="Search chemical compounds" type="search" placeholder="Search water, ethanol or formula…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <p className="library-results-count" role="status">{filtered.length} of {compounds.length} verified compound references</p>
   {compounds.length===0?<div className="library-empty"><strong>Compound reference data not yet bundled.</strong><p>The dataset acquisition workflow must download and validate the source before these records appear. All other learning resources continue to work offline.</p></div>:filtered.length===0?<p className="library-empty">No matching compound in this curated selection.</p>:
   <div className="compound-grid">{filtered.map(c=><article className="compound-card" key={c.cid}>
     <span className="eyebrow">PUBCHEM CID {c.cid}</span><h3>{c.name}</h3><strong>{c.formula}</strong>
     <dl><div><dt>Molecular weight</dt><dd>{c.molecularWeight} g/mol</dd></div>
       <div><dt>IUPAC name</dt><dd>{c.iupacName||'Not available in source'}</dd></div></dl>
     <a href={c.source} target="_blank" rel="noreferrer">PubChem source record</a>
   </article>)}</div>}
   <p className="apparatus-caveat">Properties are chemical identifiers and selected reference values, not lab procedures or safety-data sheets. Source links require internet; bundled records do not.</p>
 </section>
}
