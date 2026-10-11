import {guides} from './guides';
import {experiments} from './engine';
/** Guidance is authored from the practical's actual lesson questions, never fake observations. */
export type ReportGuidance={questions:string[];scientificLimit:string;hint:string};
export function reportGuidance(experimentId:string):ReportGuidance{
  if(!experiments.some(e=>e.id===experimentId&&e.ready)||!guides[experimentId])
    throw new RangeError('Unknown practical guide');
  const guide=guides[experimentId];
  return {
    questions:guide.questions.slice(0,3),
    scientificLimit:guide.modelLimit,
    hint:'State what you observed, support it with your simulation readings, explain the science, then identify one limitation.'
  };
}
export function hasUnfinishedScaffold(text:string):boolean{
  // A student must not accidentally submit an empty template as their own conclusion.
  return /\[(?:enter|write|explain|describe|add|your)\b[^\]]*\]/i.test(text);
}
export function reflectionScaffold():string{
  return 'Observation: [write what changed]\nEvidence: [enter your measured or simulated readings]\nExplanation: [explain why the result occurred]\nLimitation: [describe one simplification of the model]';
}
