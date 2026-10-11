import type {Measurement,MeasurementKind} from './measurements';
import { fitOhmsLaw } from './measurements';
type Props={readings:Measurement[];kind:MeasurementKind;onCapture:()=>void;onClear:()=>void};
export default function MeasurementLog({readings,kind,onCapture,onClear}:Props){
 const chemistry=kind==='titration';
 const xMax=chemistry?60:24;
 const yMax=chemistry?14:24;
 const xLabel=chemistry?'Base added (mL)':'Voltage (V)';
 const yLabel=chemistry?'pH':'Current (A)';
 const fit=!chemistry?fitOhmsLaw(readings):null;
 const points=readings.map(p=>(50+p.x/xMax*350).toFixed(1)+','+(180-p.y/yMax*147).toFixed(1)).join(' ');
 return <section className="measurement-log" aria-label={chemistry?'Titration observation sheet':'Circuit observation sheet'}>
   <header className="measurement-log-head"><div><strong>Instrument observation sheet</strong><small>Capture readings manually as you change the controls. Maximum 20 readings.</small></div>
     <div className="measurement-log-actions"><button type="button" className="button-muted" onClick={onCapture}>Capture reading</button><button type="button" className="button-muted" onClick={onClear} disabled={!readings.length}>Clear</button></div>
   </header>
   <div className="measurement-data-grid"><div className="measurement-chart">
     <svg viewBox="0 0 440 230" role="img" aria-label={yLabel+' plotted against '+xLabel+'; '+readings.length+' manually captured points'}>
       {Array.from({length:5},(_,i)=><g key={i}><line x1="50" x2="400" y1={180-i*36.75} y2={180-i*36.75} stroke="#dce8ed" strokeDasharray="4 5"/><text x="43" y={184-i*36.75} textAnchor="end" fill="#648493" fontSize="10">{(i*yMax/4).toFixed(chemistry?1:0)}</text></g>)}
       <line x1="50" y1="33" x2="50" y2="180" stroke="#7696a5" strokeWidth="1.5"/><line x1="50" y1="180" x2="400" y2="180" stroke="#7696a5" strokeWidth="1.5"/>
       {Array.from({length:5},(_,i)=><text key={i} x={50+i*87.5} y="195" textAnchor="middle" fill="#648493" fontSize="10">{i*xMax/4}</text>)}
       {readings.length>=2&&<polyline points={points} fill="none" stroke="#168e83" strokeWidth="2.4" strokeLinejoin="round"/>}
       {readings.map(p=><circle key={p.x} cx={50+p.x/xMax*350} cy={180-p.y/yMax*147} r="4.5" fill="#108d84" stroke="white" strokeWidth="1.4"/>)}
       <text x="225" y="222" textAnchor="middle" fontSize="11" fill="#355c6e">{xLabel}</text><text x="15" y="28" fontSize="11" fill="#355c6e">{yLabel}</text>
     </svg>
     {!readings.length&&<p>No measurements recorded. Set the instrument controls and select Capture reading.</p>}
   </div>
   <div className="measurement-table-wrap">
     <table><thead><tr><th>{xLabel}</th><th>{yLabel}</th></tr></thead><tbody>
       {!readings.length?<tr><td colSpan={2}>Waiting for a reading</td></tr>:readings.map(p=><tr key={p.x}><td>{p.x.toFixed(chemistry?1:2)}</td><td>{p.y.toFixed(chemistry?2:3)}</td></tr>)}
     </tbody></table>
     {fit&&<p className="measurement-fit">Model-derived estimate: R = {fit.resistance.toFixed(2)} Ω</p>}
   </div></div>
   <p className="measurement-caveat">These are ideal simulation outputs captured by the student, not independently measured physical instrument data. {chemistry?'The sharp pH change is predicted by ideal strong acid/base chemistry.':'Resistance estimates assume an ideal ohmic resistor and a fixed resistance for all captured rows.'}</p>
 </section>;
}
