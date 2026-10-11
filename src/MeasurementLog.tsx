import type {Measurement,MeasurementKind} from './measurements';
import {fitOhmsLaw,fitPendulumGravity,fitPotometerUptake,measurementAxes} from './measurements';
type Props={readings:Measurement[];kind:MeasurementKind;onCapture:()=>void;onClear:()=>void};
export default function MeasurementLog({readings,kind,onCapture,onClear}:Props){
  const spec=measurementAxes[kind];
  const fit=kind==='ohms-law'?fitOhmsLaw(readings):null;
  const gravity=kind==='pendulum'?fitPendulumGravity(readings):null;
  const uptake=kind==='potometer'?fitPotometerUptake(readings):null;
  const points=readings.map(p=>(50+p.x/spec.xMax*350).toFixed(1)+','+(180-p.y/spec.yMax*147).toFixed(1)).join(' ');
  return <section className="measurement-log" aria-label={spec.region}>
    <header className="measurement-log-head"><div><strong>Instrument observation sheet</strong><small>Capture readings manually as you change the controls. Maximum 20 readings.</small></div>
      <div className="measurement-log-actions"><button type="button" className="button-muted" onClick={onCapture}>Capture reading</button><button type="button" className="button-muted" onClick={onClear} disabled={!readings.length}>Clear</button></div>
    </header>
    <div className="measurement-data-grid"><div className="measurement-chart">
      <svg viewBox="0 0 440 230" role="img" aria-label={spec.yLabel+' plotted against '+spec.xLabel+'; '+readings.length+' manually captured points'}>
        {Array.from({length:5},(_,i)=><g key={i}><line x1="50" x2="400" y1={180-i*36.75} y2={180-i*36.75} stroke="#dce8ed" strokeDasharray="4 5"/><text x="43" y={184-i*36.75} textAnchor="end" fill="#648493" fontSize="10">{(i*spec.yMax/4).toFixed(kind==='potometer'?0:1)}</text></g>)}
        <line x1="50" y1="33" x2="50" y2="180" stroke="#7696a5" strokeWidth="1.5"/><line x1="50" y1="180" x2="400" y2="180" stroke="#7696a5" strokeWidth="1.5"/>
        {Array.from({length:5},(_,i)=><text key={i} x={50+i*87.5} y="195" textAnchor="middle" fill="#648493" fontSize="10">{(i*spec.xMax/4).toFixed(spec.xMax===3?2:spec.xMax===30?1:0)}</text>)}
        {readings.length>=2&&<polyline points={points} fill="none" stroke="#168e83" strokeWidth="2.4" strokeLinejoin="round"/>}
        {readings.map(p=><circle key={p.x} cx={50+p.x/spec.xMax*350} cy={180-p.y/spec.yMax*147} r="4.5" fill="#108d84" stroke="white" strokeWidth="1.4"/>)}
        <text x="225" y="222" textAnchor="middle" fontSize="11" fill="#355c6e">{spec.xLabel}</text>
        <text x="15" y="28" fontSize="11" fill="#355c6e">{spec.yLabel}</text>
      </svg>
      {!readings.length&&<p>No measurements recorded. Set the instrument controls and select Capture reading.</p>}
    </div>
    <div className="measurement-table-wrap">
      <table><thead><tr><th>{spec.xLabel}</th><th>{spec.yLabel}</th></tr></thead>
        <tbody>{!readings.length?<tr><td colSpan={2}>Waiting for a reading</td></tr>:readings.map(p=><tr key={p.x}><td>{p.x.toFixed(spec.xDigits)}</td><td>{p.y.toFixed(spec.yDigits)}</td></tr>)}</tbody></table>
      {fit&&<p className="measurement-fit">Model-derived estimate: R = {fit.resistance.toFixed(2)} Ω</p>}
      {gravity!==null&&<p className="measurement-fit">Model-derived g ≈ {gravity.toFixed(2)} m/s²</p>}
      {uptake!==null&&<p className="measurement-fit">Model-derived uptake ≈ {uptake.toFixed(2)} µL/min</p>}
    </div></div>
    <p className="measurement-caveat">Ideal simulation outputs explicitly captured by the student, not independently measured physical instrument data. {spec.caveat}</p>
  </section>;
}
