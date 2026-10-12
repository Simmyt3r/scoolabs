import rawElements from './data/elements.json';
import rawConcepts from './data/concepts.json';
import rawApparatus from './data/apparatus.json';
import type {Subject} from './engine';

export type PeriodicElement={
  number:number;symbol:string;name:string;atomicMass:number|null;group:number|null;period:number;
  category:string;phase:string;col:number;row:number;shells:number[]|null;configuration:string|null;
  electronegativity:number|null;meltKelvin:number|null;boilKelvin:number|null;
  density:number|null;densityUnit:string|null;source:string|null;
};
export type KeyConcept={id:string;subject:Subject;topic:string;title:string;overview:string;
  example:string;misconception:string;experimentId:string};
export type Apparatus={id:string;subject:Subject;category:string;title:string;purpose:string;
  howToUse:string;safety:string;experimentId:string};
export const elements:PeriodicElement[]=rawElements as PeriodicElement[];
export const concepts:KeyConcept[]=rawConcepts as KeyConcept[];
export const apparatus:Apparatus[]=rawApparatus as Apparatus[];
export const elementGroups=[
  'alkali-metal','alkaline-earth-metal','transition-metal','post-transition-metal','metalloid',
  'nonmetal','halogen','noble-gas','lanthanoid','actinoid','other'
] as const;
export type ElementGroup=typeof elementGroups[number];
export function elementCategory(element:PeriodicElement):ElementGroup{
  const text=element.category.toLowerCase();
  if(text.includes('alkali metal'))return 'alkali-metal';
  if(text.includes('alkaline earth'))return 'alkaline-earth-metal';
  if(text.includes('post-transition'))return 'post-transition-metal';
  if(text.includes('transition metal'))return 'transition-metal';
  if(text.includes('metalloid'))return 'metalloid';
  if(text.includes('halogen'))return 'halogen';
  if(text.includes('noble gas'))return 'noble-gas';
  if(text.includes('lanthanoid')||text.includes('lanthanide'))return 'lanthanoid';
  if(text.includes('actinoid')||text.includes('actinide'))return 'actinoid';
  if(text.includes('nonmetal'))return 'nonmetal';
  return 'other';
}
export function elementDescription(e:PeriodicElement):string{
  const text=e.number>=104?'For superheavy elements, reported physical properties may be theoretical predictions. ':'';
  return text+'Values are selected references and depend on conditions and measurement methods; a missing value does not mean zero. Melting and boiling temperatures are Kelvin. This educational reference is not a chemical handling or safety-data sheet.';
}
export function subjectConcepts(subject:Subject){return concepts.filter(x=>x.subject===subject)}
export function subjectApparatus(subject:Subject){return apparatus.filter(x=>x.subject===subject)}
export function searchLibrary<T extends {title:string}>(items:readonly T[],query:string):T[]{
  const normalized=query.trim().toLocaleLowerCase('en');
  if(!normalized)return [...items];
  return items.filter(row=>Object.values(row as Record<string,unknown>)
    .some(value=>typeof value==='string'&&value.toLocaleLowerCase('en').includes(normalized)));
}
