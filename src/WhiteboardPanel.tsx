import {useState,type ChangeEvent} from 'react';
import {boardKinds,boardLabels,boardReadout,newBoard,suggestBoard,type BoardKind,type BoardState} from './classroomBoard';
import type {Crop} from './engine';

export function BoardVisual({board}:{board:BoardState}){
  if(board.kind==='none')return null;
  const v=boardReadout(board);
  return <section className="st-board-visual" aria-label="Digital whiteboard">
    <div className="st-board-title"><strong>{boardLabels[board.kind]}</strong><span>Illustrative simulation</span></div>
    <div className="st-board-layout">
      <svg viewBox="0 0 420 230" role="img" aria-label={boardLabels[board.kind]+' schematic'} className="st-board-diagram">
        {board.kind==='circuit'&&<>
          <path d="M90 55H160 M260 55H335V175H232 M188 175H90V55" stroke="#173449" strokeWidth="4" fill="none" strokeLinejoin="round"/>
          <path d="M160 55l10 -12 12 24 12 -24 12 24 12 -24 12 24 12 -24 18 12" stroke="#087d72" strokeWidth="4" fill="none"/>
          <path d="M188 150v50 M232 161v28" stroke="#173449" strokeWidth="5"/>
          <circle cx="335" cy="115" r="23" fill="#e8f5f2" stroke="#087d72" strokeWidth="3"/><text x="335" y="121" textAnchor="middle" fontWeight="bold" fontSize="20">A</text>
          {board.voltage>0&&<path d="M154 175h-42l9 -7m-9 7l9 7" stroke="#087d72" strokeWidth="3" fill="none"/>}
          <text x="210" y="29" textAnchor="middle" fontSize="17" fontWeight="bold">{board.resistance} Ω</text>
          <text x="210" y="220" textAnchor="middle" fontSize="17" fontWeight="bold">{board.voltage} V</text>
          <text x="335" y="153" textAnchor="middle" fontSize="14">{v.primary}</text>
        </>}
        {board.kind==='pendulum'&&<>
          <path d="M100 25h220" stroke="#173449" strokeWidth="6"/><circle cx="210" cy="30" r="5" fill="#173449"/>
          <path d="M210 30v175" stroke="#8ba9b3" strokeWidth="2" strokeDasharray="5 5"/>
          <path d={'M210 30L'+(210+Math.sin(8*Math.PI/180)*(60+board.length/2*100))+' '+(30+Math.cos(8*Math.PI/180)*(60+board.length/2*100))} stroke="#087d72" strokeWidth="4"/>
          <circle cx={210+Math.sin(8*Math.PI/180)*(60+board.length/2*100)} cy={30+Math.cos(8*Math.PI/180)*(60+board.length/2*100)} r="16" fill="#087d72"/>
          <text x="85" y="115" fontSize="17">L = {board.length.toFixed(2)} m</text><text x="245" y="55" fontSize="14">8° (small angle)</text>
        </>}
        {board.kind==='microscope'&&<>
          <defs><clipPath id="st-cell-field"><circle cx="210" cy="115" r="103"/></clipPath></defs>
          <circle cx="210" cy="115" r="107" fill="#173449"/>
          <g clipPath="url(#st-cell-field)" transform={'translate(210 115) scale('+(board.objective===40?1.8:board.objective===10?1.2:0.85)+') translate(-210 -115)'}>
            {Array.from({length:30},(_,i)=>{const x=48+i%6*54,y=5+Math.floor(i/6)*44;return <g key={i}><rect x={x} y={y} width="53" height="43" rx="4" fill="#b4dcb8" stroke="#387752" strokeWidth="2"/><circle cx={x+32} cy={y+22} r="6" fill="#387752"/></g>;})}
          </g>
          <text x="210" y="219" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#fff">{v.primary}</text>
        </>}
        {board.kind==='germination'&&<>
          <rect x="20" y="150" width="380" height="66" rx="8" fill="#b78b65"/>
          {Array.from({length:10},(_,i)=>{const r=Number.parseFloat(v.primary),x=45+i*37,h=Math.min(105,Number.parseFloat(v.secondary)*5);return <g key={i}><ellipse cx={x} cy="164" rx="9" ry="5" fill="#705134"/>{i<Math.round(r/10)&&<><path d={'M'+x+' 158v-'+Math.max(18,h)} stroke="#087d72" strokeWidth="4"/><ellipse cx={x-7} cy={158-Math.max(18,h)+5} rx="10" ry="5" transform={'rotate(30 '+(x-7)+' '+(163-Math.max(18,h))+')'} fill="#4c9a5b"/><ellipse cx={x+7} cy={158-Math.max(18,h)+4} rx="10" ry="5" fill="#4c9a5b"/></>}</g>})}
          <text x="210" y="25" textAnchor="middle" fontSize="18" fontWeight="bold">{board.crop} · Day {board.day}</text><text x="210" y="49" textAnchor="middle" fontSize="14">{board.moisture}% moisture · {board.temperature}°C</text>
        </>}
      </svg>
      <div className="st-board-data"><strong className="st-board-formula">{v.formula}</strong><div><small>{board.kind==='circuit'?'Current':board.kind==='pendulum'?'Period':board.kind==='microscope'?'Magnification':'Germinated'}</small><b>{v.primary}</b></div><div><small>{board.kind==='circuit'?'Power':board.kind==='pendulum'?'10 cycles':board.kind==='microscope'?'Field of view':'Model height'}</small><b>{v.secondary}</b></div></div>
    </div><p className="st-board-note">{v.note}</p>
  </section>;
}
function Slider({label,min,max,step,value,onChange,unit}:{label:string;min:number;max:number;step:number;value:number;onChange:(n:number)=>void;unit:string}){
  return <label className="st-board-slider">{label} <strong>{value} {unit}</strong><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(e:ChangeEvent<HTMLInputElement>)=>onChange(Number(e.target.value))}/></label>;
}
export default function ClassroomBoard({board,topic,onChange}:{board:BoardState;topic:string;onChange:(b:BoardState)=>void}){
  const [expanded,setExpanded]=useState(false);
  const suggested=suggestBoard(topic);
  return <section className="st-board-controls" aria-label="Whiteboard controls">
    <div className="st-actions"><button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Hide whiteboard controls':'Digital whiteboard'}</button>{board.kind!=='none'&&<button type="button" onClick={()=>onChange(newBoard('none'))}>Clear whiteboard</button>}</div>
    {expanded&&<><label className="st-field">Teaching demonstration<select value={board.kind} onChange={e=>onChange(newBoard(e.target.value as BoardKind))}>{boardKinds.map(k=><option value={k} key={k}>{boardLabels[k]}</option>)}</select></label>
    {suggested!=='none'&&board.kind==='none'&&<button type="button" onClick={()=>onChange(newBoard(suggested))}>Use suggested demonstration</button>}
    {board.kind==='circuit'&&<><Slider label="Supply voltage" unit="V" min={0} max={24} step={0.5} value={board.voltage} onChange={voltage=>onChange({...board,voltage})}/><Slider label="Resistance" unit="Ω" min={1} max={100} step={1} value={board.resistance} onChange={resistance=>onChange({...board,resistance})}/></>}
    {board.kind==='pendulum'&&<Slider label="Length" unit="m" min={0.1} max={2} step={0.05} value={board.length} onChange={length=>onChange({...board,length})}/>}
    {board.kind==='microscope'&&<label className="st-field">Objective lens<select value={board.objective} onChange={e=>onChange({...board,objective:Number(e.target.value) as 4|10|40})}><option value={4}>4×</option><option value={10}>10×</option><option value={40}>40×</option></select></label>}
    {board.kind==='germination'&&<><label className="st-field">Crop<select value={board.crop} onChange={e=>onChange({...board,crop:e.target.value as Crop})}><option value="maize">Maize</option><option value="cowpea">Cowpea</option><option value="rice">Rice</option></select></label><Slider label="Moisture" unit="%" min={0} max={100} step={5} value={board.moisture} onChange={moisture=>onChange({...board,moisture})}/><Slider label="Temperature" unit="°C" min={0} max={55} step={1} value={board.temperature} onChange={temperature=>onChange({...board,temperature})}/><Slider label="Day" unit="" min={0} max={21} step={1} value={board.day} onChange={day=>onChange({...board,day})}/></>}
    </>}
    <BoardVisual board={board}/>
  </section>;
}
