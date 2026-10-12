import {useMemo,useState} from 'react';
import {Atom, Search, GitCompareArrows} from 'lucide-react';
import {elements,elementGroups,elementCategory,elementDescription,type PeriodicElement} from './subject-library';
function numberText(n:number|null,digits=3){return n===null?'Not established':Number(n.toPrecision(digits)).toString();}
function descriptor(element:PeriodicElement){
  return element.category.replace(/,.*$/,'').replace(/\b\w/g,ch=>ch.toUpperCase());
}
function ElementDetails({element,onCompare,compareSelected}:{element:PeriodicElement;onCompare:()=>void;compareSelected:boolean}){
  return <section className="periodic-detail" aria-label={'Element properties: '+element.name}>
    <div className="periodic-detail-head">
      <div className={'periodic-detail-mark element-'+elementCategory(element)}><small>{element.number}</small><strong>{element.symbol}</strong><span>{element.name}</span></div>
      <div><span className="eyebrow">CHEMICAL ELEMENT</span><h3>{element.name}</h3><p>{descriptor(element)} · Period {element.period}{element.group!==null?' · Group '+element.group:''}</p>
        <button type="button" className="button-outline" aria-pressed={compareSelected} onClick={onCompare}><GitCompareArrows size={15}/>{compareSelected?'Remove comparison':'Add to comparison'}</button>
      </div>
    </div>
    <dl className="periodic-properties">
      <div><dt>Atomic number</dt><dd>{element.number}</dd></div>
      <div><dt>Relative atomic mass</dt><dd>{numberText(element.atomicMass,6)}</dd></div>
      <div><dt>Physical phase (reference)</dt><dd>{element.phase}</dd></div>
      <div><dt>Electronegativity (Pauling)</dt><dd>{numberText(element.electronegativity)}</dd></div>
      <div><dt>Electron configuration</dt><dd>{element.configuration??'Unavailable in source'}</dd></div>
      <div><dt>Electron shells</dt><dd>{element.shells?.join(' · ')??'Unavailable in source'}</dd></div>
      <div><dt>Melting point (K)</dt><dd>{numberText(element.meltKelvin,5)}</dd></div>
      <div><dt>Boiling point (K)</dt><dd>{numberText(element.boilKelvin,5)}</dd></div>
      <div><dt>Density</dt><dd>{element.density===null?'Not established':numberText(element.density,6)+' '+(element.densityUnit??'source unit unspecified')}</dd></div>
    </dl>
    <p className="periodic-detail-caution">{elementDescription(element)}</p>
  </section>;
}
export default function PeriodicTable(){
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [selected,setSelected]=useState<number>(8);
  const [pinned,setPinned]=useState<number[]>([]);
  const selectedElement=elements.find(e=>e.number===selected)??elements[0];
  const visible=useMemo(()=>elements.filter(e=>(category==='all'||elementCategory(e)===category)&&
    [e.name,e.symbol,String(e.number),e.category].some(x=>x.toLowerCase().includes(query.trim().toLowerCase()))),[query,category]);
  const visibleSet=new Set(visible.map(e=>e.number));
  function togglePinned(num:number){setPinned(current=>current.includes(num)?current.filter(x=>x!==num):current.length>=2?[current[1],num]:[...current,num]);}
  return <section className="periodic-explorer" aria-label="Interactive periodic table">
    <div className="library-heading"><div><span className="eyebrow">CHEMISTRY REFERENCE</span><h2>Interactive periodic table</h2><p>Explore all 118 recognized chemical elements. Select one to examine its properties or compare any two.</p></div><Atom size={35}/></div>
    <div className="periodic-filters"><label className="library-search"><Search size={17}/><span className="sr-only">Search elements</span><input aria-label="Search elements" type="search" placeholder="Find element, symbol or atomic number…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <select aria-label="Filter element family" value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="all">All element families</option>{elementGroups.map(g=><option key={g} value={g}>{g.replace(/-/g,' ')}</option>)}
      </select><span className="periodic-result-count">{visible.length} / 118</span>
    </div>
    <div className="periodic-scroll" role="region" aria-label="Scrollable periodic table grid" tabIndex={0}>
      <div className="periodic-grid">
        {elements.map(e=><button type="button" key={e.number} title={e.name+' ('+e.symbol+')'} aria-label={e.name+', atomic number '+e.number}
            aria-pressed={e.number===selected} className={'periodic-tile element-'+elementCategory(e)+' '+(e.number===selected?'periodic-selected ':'')+(!visibleSet.has(e.number)?'periodic-muted':'')}
            style={{gridColumn:e.col,gridRow:e.row}} onClick={()=>setSelected(e.number)}>
          <small>{e.number}</small><strong>{e.symbol}</strong><span>{e.name}</span>
        </button>)}
      </div>
    </div>
    {visible.length===0&&<p role="status" className="library-empty">No matching element. Try a different symbol, number or family.</p>}
    <div className="periodic-legend">{elementGroups.map(g=><span key={g}><i className={'element-'+g}/>{g.replace(/-/g,' ')}</span>)}</div>
    <div className="periodic-explanations">
      <ElementDetails element={selectedElement} onCompare={()=>togglePinned(selectedElement.number)} compareSelected={pinned.includes(selectedElement.number)}/>
      {pinned.length>0&&<section className="periodic-comparison" aria-label="Compare elements">
        <div className="library-heading"><h3>Compare elements</h3><button type="button" className="text-button" onClick={()=>setPinned([])}>Clear selection</button></div>
        {pinned.length<2?<p>Select one more element and choose Add to comparison.</p>:<table><thead><tr><th>Property</th>{pinned.map(n=><th key={n}>{elements[n-1].name}</th>)}</tr></thead><tbody>
          {([['Atomic number',e=>String(e.number)],['Atomic mass',e=>numberText(e.atomicMass,6)],['Category',e=>descriptor(e)],['Period',e=>String(e.period)],['Electronegativity',e=>numberText(e.electronegativity)],['Phase',e=>e.phase]] as [string,(el:PeriodicElement)=>string][]).map(([label,format])=><tr key={label}><th>{label}</th>{pinned.map(n=><td key={n}>{format(elements[n-1])}</td>)}</tr>)}
        </tbody></table>}
      </section>}
    </div>
    <p className="library-source">Dataset adapted from Bowserinator's Periodic-Table-JSON (CC BY-SA 3.0). Units and missing values are displayed explicitly. Some properties of very heavy elements are predictions. See Help & About for attribution.</p>
  </section>;
}
