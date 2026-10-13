import {useState} from 'react';
import {Beaker, Microscope, Ruler, Sprout} from 'lucide-react';
import type {Subject} from './engine';

type Part={name:string;purpose:string};
type Sketch='beaker'|'burette'|'metre'|'microscope'|'hoe'|'filter-funnel'|'measuring-cylinder'|'meter'|'convex-lens'|'potometer'|'petri-dish'|'watering-can'|'rain-gauge'|'generic';
export function apparatusSketch(title:string):Sketch{
  const t=title.toLowerCase();
  if(t==='beaker')return 'beaker';
  if(t==='burette')return 'burette';
  if(t==='metre rule')return 'metre';
  if(t==='compound light microscope')return 'microscope';
  if(t==='hoe')return 'hoe';
  if(t==='filter funnel')return 'filter-funnel';
  if(t==='measuring cylinder')return 'measuring-cylinder';
  if(t==='ammeter'||t==='voltmeter')return 'meter';
  if(t==='convex lens')return 'convex-lens';
  if(t==='potometer')return 'potometer';
  if(t==='petri dish')return 'petri-dish';
  if(t==='watering can')return 'watering-can';
  if(t==='rain gauge')return 'rain-gauge';
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
  ],
  'filter-funnel':[
    {name:'Funnel bowl',purpose:'Receives the mixture and supports the folded filter paper.'},
    {name:'Filter paper',purpose:'Retains suitable insoluble particles while liquid passes through.'},
    {name:'Stem',purpose:'Channels filtrate into a receiving container.'}
  ],
  'measuring-cylinder':[
    {name:'Graduated scale',purpose:'Provides a volume estimate; read the meniscus at eye level.'},
    {name:'Meniscus',purpose:'Curved liquid surface whose lower level is read for many aqueous liquids.'},
    {name:'Base',purpose:'Supports the cylinder upright on a stable bench.'}
  ],
  meter:[
    {name:'Display',purpose:'Indicates the measured current or potential difference, depending on the meter.'},
    {name:'Terminals',purpose:'Connect suitable leads to the correct input sockets.'},
    {name:'Measurement mode',purpose:'The meter type and selected range must match the circuit being tested.'}
  ],
  'convex-lens':[
    {name:'Converging lens',purpose:'Refracts paraxial light rays toward a focal region.'},
    {name:'Optical axis',purpose:'Reference axis used for object and image positions.'},
    {name:'Focal region',purpose:'Parallel rays converge near the focal plane in the ideal model.'}
  ],
  potometer:[
    {name:'Leafy shoot',purpose:'Provides the plant tissues taking up water during the experiment.'},
    {name:'Capillary tube',purpose:'A narrow tube in which bubble displacement can be monitored.'},
    {name:'Air bubble',purpose:'Its movement estimates water uptake volume, not direct transpiration.'}
  ],
  'petri-dish':[
    {name:'Lid',purpose:'Covers the dish to reduce contamination during observation.'},
    {name:'Dish base',purpose:'Holds a suitable specimen or prepared medium.'},
    {name:'Sample area',purpose:'A representative observation space, not an identified microbial culture.'}
  ],
  'watering-can':[
    {name:'Water container',purpose:'Holds the water for controlled application.'},
    {name:'Handle',purpose:'Allows the user to lift and tip the filled container.'},
    {name:'Rose or spout',purpose:'Distributes water onto the soil surface.'}
  ],
  'rain-gauge':[
    {name:'Collection opening',purpose:'Receives rainfall over a known aperture area.'},
    {name:'Graduated collector',purpose:'Allows the amount collected to be read using a calibrated scale.'},
    {name:'Upright support',purpose:'Keeps the instrument level and suitably positioned outdoors.'}
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

      {sketch==='filter-funnel'&&<>
        <path d="M83 44h164l-66 82v62" fill="#d1f2e9" fillOpacity=".35" stroke={partStroke(0,active)} strokeWidth="5"/>
        <path d="M110 52l55 66 55-66z" fill="#fff1c9" stroke={partStroke(1,active)} strokeWidth="3"/>
        <path d="M165 128v62" stroke={partStroke(2,active)} strokeWidth="7"/>
        <path d="M124 197h82" stroke={stroke} strokeWidth="3"/>
        <text x="242" y="68">paper</text><path d="M229 70l-28 8" stroke={stroke} strokeWidth="2"/>
      </>}
      {sketch==='measuring-cylinder'&&<>
        <path d="M137 35h56v141h-56z" fill="#ecfaf9" stroke={partStroke(0,active)} strokeWidth="4"/>
        {Array.from({length:8},(_,i)=><path key={i} d={'M138 '+(47+i*14)+'h'+(i%2===0?22:13)} stroke={partStroke(0,active)} strokeWidth="2"/>)}
        <path d="M141 120q24 9 48 0v48h-48z" fill="#84d6dd" fillOpacity=".65"/>
        <path d="M141 120q24 9 48 0" stroke={partStroke(1,active)} strokeWidth="3" fill="none"/>
        <path d="M120 185h90" stroke={partStroke(2,active)} strokeWidth="9"/>
        <text x="214" y="124">meniscus</text><path d="M207 127l-18 3" stroke={stroke} strokeWidth="1.6"/>
      </>}
      {sketch==='meter'&&<>
        <rect x="95" y="48" width="140" height="116" rx="18" stroke={stroke} strokeWidth="5" fill="#e6f6f2"/>
        <rect x="121" y="64" width="89" height="55" rx="6" fill="white" stroke={partStroke(0,active)} strokeWidth="3"/>
        <text x="165" y="102" textAnchor="middle" fontSize="32">{title==='Ammeter'?'A':'V'}</text>
        <circle cx="126" cy="142" r="8" fill="#cb4949" stroke={partStroke(1,active)} strokeWidth="3"/>
        <circle cx="205" cy="142" r="8" fill="#3d5864" stroke={partStroke(1,active)} strokeWidth="3"/>
        <path d="M146 136h40" stroke={partStroke(2,active)} strokeWidth="3"/>
        <text x="165" y="190" textAnchor="middle">Idealised circuit meter</text>
      </>}
      {sketch==='convex-lens'&&<>
        <path d="M165 25q-30 78 0 166q30-88 0-166z" fill="#c5f3f0" stroke={partStroke(0,active)} strokeWidth="4"/>
        <path d="M28 107h274" stroke={partStroke(1,active)} strokeDasharray="6 7" strokeWidth="2.5"/>
        <path d="M40 50h125l80 57" stroke={partStroke(2,active)} strokeWidth="2.5" fill="none"/>
        <path d="M40 164h125l80-57" stroke={partStroke(2,active)} strokeWidth="2.5" fill="none"/>
        <circle cx="245" cy="107" r="5" fill="#e2a34a"/>
        <text x="251" y="94">F</text>
      </>}
      {sketch==='potometer'&&<>
        <path d="M143 108l-12-45-27-23M143 108l21-58 31-17M143 108l-48-4" stroke={partStroke(0,active)} strokeWidth="8" fill="none"/>
        <ellipse cx="104" cy="40" rx="25" ry="11" fill="#93caa7" stroke={partStroke(0,active)} strokeWidth="2"/>
        <ellipse cx="200" cy="32" rx="28" ry="12" fill="#93caa7" stroke={partStroke(0,active)} strokeWidth="2"/>
        <path d="M141 110v35h107v35" stroke={partStroke(1,active)} strokeWidth="12" fill="none"/>
        <path d="M141 110v35h107v35" stroke="#9bdfe2" strokeWidth="7" fill="none"/>
        <circle cx="201" cy="145" r="7" fill="#fff6d9" stroke={partStroke(2,active)} strokeWidth="3"/>
        <text x="207" y="126">bubble</text>
      </>}
      {sketch==='petri-dish'&&<>
        <ellipse cx="165" cy="113" rx="100" ry="48" fill="#e5faf4" stroke={partStroke(1,active)} strokeWidth="5"/>
        <path d="M65 113v25c0 27 44 49 100 49s100-22 100-49v-25" fill="#d5f1ed" stroke={partStroke(1,active)} strokeWidth="4"/>
        <ellipse cx="165" cy="90" rx="100" ry="45" fill="#e7fbff" fillOpacity=".55" stroke={partStroke(0,active)} strokeWidth="4"/>
        <circle cx="132" cy="103" r="8" fill="#8cccbd" stroke={partStroke(2,active)} strokeWidth="2"/>
        <circle cx="199" cy="105" r="6" fill="#8cccbd" stroke={partStroke(2,active)} strokeWidth="2"/>
        <text x="165" y="209" textAnchor="middle">covered sample dish</text>
      </>}
      {sketch==='watering-can'&&<>
        <path d="M94 95h143l-22 90H114z" fill="#b4d8e8" stroke={partStroke(0,active)} strokeWidth="5"/>
        <path d="M99 106Q41 81 52 153q3 25 51 18" stroke={partStroke(1,active)} strokeWidth="12" fill="none"/>
        <path d="M232 114l64-52M291 61l11 17" stroke={partStroke(2,active)} strokeWidth="12"/>
        <path d="M291 78l-16 7" stroke={partStroke(2,active)} strokeWidth="5"/>
        <circle cx="271" cy="102" r="4" fill="#5cbadd"/><circle cx="292" cy="106" r="4" fill="#5cbadd"/>
        <text x="166" y="205" textAnchor="middle">watering can</text>
      </>}
      {sketch==='rain-gauge'&&<>
        <path d="M102 36h126l-45 50v91h-36V86z" fill="#e4f5f8" stroke={partStroke(0,active)} strokeWidth="4"/>
        <path d="M148 122h34v48h-34z" fill="#9edbe6"/>
        {Array.from({length:6},(_,i)=><path key={i} d={'M149 '+(99+i*13)+'h'+(i%2?16:27)} stroke={partStroke(1,active)} strokeWidth="2"/>)}
        <path d="M164 178v24M131 202h66" stroke={partStroke(2,active)} strokeWidth="7"/>
        <text x="215" y="107">scale</text><path d="M208 109l-29 9" stroke={stroke} strokeWidth="2"/>
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
