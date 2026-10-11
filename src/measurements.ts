/** Explicit, classroom-sized observation log. No observations are invented automatically. */
export type Measurement={x:number;y:number};
export type MeasurementKind='titration'|'ohms-law';
export const MAX_READINGS=20;
export function addMeasurement(items:readonly Measurement[],x:number,y:number,kind:MeasurementKind):Measurement[]{
  const [minX,maxX,minY,maxY]=kind==='titration'?[0,60,0,14]:[0,24,0,24];
  if(![x,y].every(Number.isFinite)||x<minX||x>maxX||y<minY||y>maxY)throw new RangeError('Instrument reading outside expected range.');
  const measurement={x:Number(x.toFixed(3)),y:Number(y.toFixed(4))};
  const filtered=items.filter(point=>point.x!==measurement.x);
  return [...filtered,measurement].sort((a,b)=>a.x-b.x).slice(-MAX_READINGS);
}
export function fitOhmsLaw(items:readonly Measurement[]):{resistance:number;slope:number}|null{
  if(items.length<2||new Set(items.map(p=>p.x)).size<2)return null;
  if(items.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0))return null;
  const denominator=items.reduce((sum,p)=>sum+p.x*p.x,0);
  const numerator=items.reduce((sum,p)=>sum+p.x*p.y,0);
  if(denominator<=0||numerator<=0)return null;
  const slope=numerator/denominator;
  return {slope,resistance:1/slope};
}
export function readingSummary(items:readonly Measurement[],kind:MeasurementKind):string{
  if(!items.length)return 'No instrument readings captured.';
  const label=kind==='titration'?'Burette volume (mL) -> pH':'Voltage (V) -> current (A)';
  return label+': '+items.map(p=>p.x.toFixed(kind==='titration'?1:2)+' -> '+p.y.toFixed(kind==='titration'?2:3)).join('; ');
}
