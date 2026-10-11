/** Manually captured outputs of ideal desktop simulations, not physical sensor readings. */
export type Measurement={x:number;y:number};
export type MeasurementKind='titration'|'ohms-law'|'pendulum'|'potometer';
export const MAX_READINGS=20;
export const measurementAxes:Record<MeasurementKind,{xLabel:string;yLabel:string;xMax:number;yMax:number;xDigits:number;yDigits:number;region:string;caveat:string}>={
  titration:{xLabel:'Base added (mL)',yLabel:'pH',xMax:60,yMax:14,xDigits:1,yDigits:2,region:'Titration observation sheet',caveat:'The sharp pH change is a strong-acid / strong-base idealisation.'},
  'ohms-law':{xLabel:'Voltage (V)',yLabel:'Current (A)',xMax:24,yMax:24,xDigits:2,yDigits:3,region:'Circuit observation sheet',caveat:'The calculations assume an ideal resistor with no change in resistance.'},
  pendulum:{xLabel:'Pendulum length (m)',yLabel:'Period squared (s²)',xMax:3,yMax:14,xDigits:2,yDigits:3,region:'Pendulum observation sheet',caveat:'T² is calculated from the small-angle period; it is not a stopwatch measurement.'},
  potometer:{xLabel:'Elapsed time (min)',yLabel:'Water uptake (µL)',xMax:30,yMax:800,xDigits:1,yDigits:2,region:'Potometer observation sheet',caveat:'This is modelled water uptake, not directly observed transpiration.'}
};
export function addMeasurement(items:readonly Measurement[],x:number,y:number,kind:MeasurementKind):Measurement[]{
  const spec=measurementAxes[kind];
  if(!spec||![x,y].every(Number.isFinite)||x<0||x>spec.xMax||y<0||y>spec.yMax)
    throw new RangeError('Instrument reading outside expected range.');
  const measurement={x:Number(x.toFixed(3)),y:Number(y.toFixed(4))};
  const filtered=items.filter(point=>point.x!==measurement.x);
  return [...filtered,measurement].sort((a,b)=>a.x-b.x).slice(-MAX_READINGS);
}
export function fittedSlope(items:readonly Measurement[]):number|null{
  if(items.length<2||new Set(items.map(p=>p.x)).size<2)return null;
  if(items.some(p=>![p.x,p.y].every(Number.isFinite)||p.x<0||p.y<0))return null;
  const denominator=items.reduce((sum,p)=>sum+p.x*p.x,0);
  const numerator=items.reduce((sum,p)=>sum+p.x*p.y,0);
  return denominator>0&&numerator>0?numerator/denominator:null;
}
export function fitOhmsLaw(items:readonly Measurement[]):{resistance:number;slope:number}|null{
  const slope=fittedSlope(items);
  return slope===null?null:{slope,resistance:1/slope};
}
export function fitPendulumGravity(items:readonly Measurement[]):number|null{
  const slope=fittedSlope(items);
  return slope===null?null:4*Math.PI*Math.PI/slope;
}
export function fitPotometerUptake(items:readonly Measurement[]):number|null{
  return fittedSlope(items);
}
export function readingSummary(items:readonly Measurement[],kind:MeasurementKind):string{
  const axes=measurementAxes[kind];
  if(!axes)throw new RangeError('Unknown instrument');
  if(!items.length)return 'No instrument readings captured.';
  return axes.xLabel+' -> '+axes.yLabel+': '+items.map(p=>p.x.toFixed(axes.xDigits)+' -> '+p.y.toFixed(axes.yDigits)).join('; ');
}
