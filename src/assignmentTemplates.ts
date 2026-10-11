import { experiments } from './engine';
import { guides } from './guides';
/** Editable instructions compiled entirely from bundled science learning guides. */
export function createPracticalTemplate(experimentId:string):{title:string;instructions:string}{
  const experiment=experiments.find(x=>x.id===experimentId && x.ready);
  const guide=guides[experimentId];
  if(!experiment||!guide)throw new RangeError('Choose a supported science practical.');
  const list=(items:string[])=>items.map((item,i)=>(i+1)+'. '+item).join('\n');
  const instructions=[
    'Objective: '+experiment.description,'','Method:',list(guide.method),
    '','Questions:',list(guide.questions),'',
    'Model boundary: '+guide.modelLimit,'Safety: '+guide.safety,'',
    'Submit your instrument settings, observations and a clear conclusion.'
  ].join('\n');
  return {title:'Practical: '+experiment.title,instructions:instructions.slice(0,5000)};
}
