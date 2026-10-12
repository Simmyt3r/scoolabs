import {useState} from 'react';
import {Beaker, Microscope, Ruler, Sprout} from 'lucide-react';
import type {Subject} from './engine';

type Part={name:string;purpose:string};
type Sketch='beaker'|'burette'|'metre'|'microscope'|'hoe'|'generic';
export function apparatusSketch(title:string):Sketch{
  const t=title.toLowerCase();
  if(t==='beaker')return 'beaker';
  if(t==='burette')return 'burette';
  if(t==='metre rule')return 'metre';
  if(t==='compound light microscope')return 'microscope';
  if(t==='hoe')return 'hoe';
  return 'generic';
}
const labelledParts:Record<Exclude<Sketch,'generic'>,Part[]>={
  beaker:[
    {name:'Rim and spout',purpose:'Helps pour the liquid from the container.'},
    {name:'Graduation marks',purpose:'Give only approximate volume estimates.'},
    {name:'Vessel body',purpose:'Holds substances for mixing or suitable heating.'}
  ],
  burette:[
    {name:'Graduated barrel',purpose:'Used to read the starting and final liquid levels.'},
    {name:'Stopcock',purpose:'Controls liquid release as the tip is opened or closed.'},
    {name:'Delivery tip',purpose:'Directs the dispensed liquid into a receiving flask.'}
  ],
  metre:[
    {name:'Length scale',purpose:'Shows centimetre and millimetre divisions.'},
    {name:'Zero mark',purpose:'Starting reference for a length measurement.'},
    {name:'Reading position',purpose:'Read with the eye perpendicular to the markings to limit parallax.'}
  ],
  microscope:[
    {name:'Eyepiece',purpose:'Magnifies the intermediate image for the observer.'},
    {name:'Objective lenses',purpose:'Provide the main specimen magnification; start with low power.'},
    {name:'Stage and focus',purpose:'Supports the slide and adjusts focus without crushing it.'}
  ],
  hoe:[
    {name:'Handle',purpose:'Allows controlled leverage while keeping hands clear of the cutting edge.'},
    {name:'Metal head',purpose:'Breaks surface soil and cuts small weeds.'},
    {name:'Working space',purpose:'Keep people away from the swing arc before using the tool.'}
  ]
};
const stroke='#21677a',accent='#18a896',fill='#d1f2e9';
const partStroke=(i:number,current:number)=>i===current?'#dc8a36':stroke;
export default function ApparatusDiagram({title,subject}:{title:string;subject:Subject}){
 const sketch=apparatusSketch(title);
 const [active,setActive]=useState(0);
 const parts=sketch==='generic'?null:labelledParts[sketch];
 const Generic={chemistry:Beaker,physics:Ruler,biology:Microscope,agriculture:Sprout}[subject];
 return <div className="apparatus-diagram" aria-label={'Diagram for '+title}>
   <div className="apparatus-diagram-art">
    {sketch==='generic'?<div className="apparatus-generic"><Generic size={64} strokeWidth={1.2}/><small>Reference symbol, not a technical drawing</small></div>:
    <svg viewBox="0 0 330 218" role="img" aria-label={'Simplified, labelled diagram of '+title} strokeLinecap="round" strokeLinejoin="round">
      {sketch==='beaker'&&<>
       <path d="M109 49h112M116 49v116q0 12 12 12h74q12 0 12-12V49" stroke={partStroke(0,active)} strokeWidth="5" fill="none"/>
       <path d="M119 119h92v45q0 11-11 11h-70q-11 0-11-11z" fill={fill} stroke="none"/>
       <path d="M131 77h26M131 94h18M131 111h26M131 128h18M131 145h26" stroke={partStroke(1,active)} strokeWidth="3"/>
       <path d="M116 52l-16 10 20 6" fill="none" stroke={partStroke(0,active)} strokeWidth="3"/>
       <text x="170" y="199" textAnchor="middle">Mixing vessel</text>
      </>}
      {sketch==='burette'&&<>
        <path d="M150 23v116h28V23" fill="#e8faf6" stroke={partStroke(0,active)} strokeWidth="4"/>
        {Array.from({length:9},(_,i)=><path key={i} d={'M151 '+(34+i*12)+'h'+(i%2===0?14:9)} stroke={partStroke(0,active)} strokeWidth="2"/>)}
        <path d="M142 145h44M166 139v21M163 166v22" stroke={partStroke(1,active)} strokeWidth="5"/>
        <path d="M165 188v13" stroke={partStroke(2,active)} strokeWidth="3"/>
        <circle cx="165" cy="146" r="7" fill={fill} stroke={partStroke(1,active)} strokeWidth="3"/>
        <text x="208" y="58">scale</text><path d="M199 59l-21 8" stroke={stroke} strokeWidth="1.6"/>
        <text x="205" y="151">valve</text><path d="M202 147h-21" stroke={stroke} strokeWidth="1.6"/>
      </>}
      {sketch==='metre'&&<>
        <rect x="30" y="78" width="269" height="58" rx="4" fill="#f1dcae" stroke={partStroke(0,active)} strokeWidth="3"/>
        {Array.from({length:25},(_,i)=><path key={i} d={'M'+(41+i*10)+' 83v'+(i%5===0?'22':'12')} stroke={partStroke(0,active)} strokeWidth="1.7"/>)}
        <path d="M41 78v58" stroke={partStroke(1,active)} strokeWidth="4"/>
        <path d="M207 59v19" stroke={partStroke(2,active)} strokeWidth="3"/><text x="207" y="48" textAnchor="middle">Eye above mark</text>
        <text x="165" y="166" textAnchor="middle">Length scale · schematic</text>
      </>}
      {sketch==='microscope'&&<>
       <path d="M129 44l27-13 20 42-25 12z" fill="#d6f5ed" stroke={partStroke(0,active)} strokeWidth="4"/>
       <path d="M160 79l16 27-11 9-25-31" fill="#d1e9f6" stroke={partStroke(1,active)} strokeWidth="4"/>
       <path d="M145 111h54l13 9H125z" fill="#f6efe4" stroke={partStroke(2,active)} strokeWidth="4"/>
       <path d="M180 107q45 10 38 54q-5 30-35 34" fill="none" stroke={stroke} strokeWidth="10"/>
       <circle cx="204" cy="151" r="11" fill={fill} stroke={partStroke(2,active)} strokeWidth="3"/>
       <path d="M123 197h108" stroke={stroke} strokeWidth="12"/>
       <text x="197" y="30">eyepiece</text><path d="M187 33l-14 15" stroke={stroke} strokeWidth="1.8"/>
       <text x="34" y="97">objectives</text><path d="M105 95l45-13" stroke={stroke} strokeWidth="1.8"/>
       <text x="34" y="147">stage</text><path d="M74 143l62-27" stroke={stroke} strokeWidth="1.8"/>
      </>}
      {sketch==='hoe'&&<>
       <path d="M90 41l130 121" stroke={partStroke(0,active)} strokeWidth="15"/>
       <path d="M210 147l-24 24 53 39 39-42z" fill="#afc1c8" stroke={partStroke(1,active)} strokeWidth="4"/>
       <path d="M62 195h244" stroke="#96bb99" strokeDasharray="7 8" strokeWidth="2"/>
       <path d="M142 189q45-14 91-8" fill="none" stroke={partStroke(2,active)} strokeDasharray="4 5" strokeWidth="2"/>
       <text x="66" y="27">handle</text><path d="M86 34l28 26" stroke={stroke} strokeWidth="2"/>
       <text x="245" y="123">head</text><path d="M246 132l-8 38" stroke={stroke} strokeWidth="2"/>
      </>}
      <circle cx="20" cy="20" r="6" fill={accent}/><text x="32" y="24">SIMPLIFIED SCHEMATIC</text>
    </svg>}
   </div>
   {parts&&<div className="apparatus-part-inspector"><strong>Explore the labelled parts</strong>
      <div className="apparatus-part-tabs" role="group" aria-label={title+' diagram parts'}>
        {parts.map((part,i)=><button key={part.name} type="button" className={active===i?'active':''} aria-pressed={active===i} onClick={()=>setActive(i)}>{part.name}</button>)}
      </div>
      <p aria-live="polite">{parts[active].purpose}</p>
   </div>}
   <p className="apparatus-diagram-caption">Illustrative schematic, not a scaled or certified assembly drawing. Refer to a trained teacher for real equipment handling.</p>
 </div>;
}
