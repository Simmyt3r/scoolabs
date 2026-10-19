import {experiments} from './engine';
import {checkQuestions} from './knowledgeChecks';
import type {KnowledgeResult} from './native-storage';
import type {LabRecord} from './store';

/** Explainable study suggestions. This is rule-based formative guidance, NOT a trained AI model. */
export type LearningSuggestion={
  experimentId:string;title:string;status:string;message:string;
};
export function learningRecommendations(checks:readonly KnowledgeResult[],records:readonly LabRecord[]):LearningSuggestion[]{
  const available=experiments.filter(e=>e.ready);
  const known=new Set(available.map(e=>e.id));
  const latest=new Map<string,KnowledgeResult>();
  for(const entry of checks){
    if(!known.has(entry.experimentId) || !Number.isInteger(entry.correct) || entry.correct<0 || entry.correct>2 ||
      !Number.isInteger(entry.firstChoice) || !Number.isInteger(entry.secondChoice) ||
      entry.firstChoice<0 || entry.firstChoice>2 || entry.secondChoice<0 || entry.secondChoice>2)continue;
    const previous=latest.get(entry.experimentId);
    const time=Date.parse(entry.updatedAt);
    if(!Number.isFinite(time))continue;
    if(!previous || time>Date.parse(previous.updatedAt))latest.set(entry.experimentId,entry);
  }
  const suggestions:LearningSuggestion[]=[];
  for(const experiment of available){
    const entry=latest.get(experiment.id);
    if(!entry || entry.correct===2)continue;
    const questions=checkQuestions[experiment.id];
    const choices=[entry.firstChoice,entry.secondChoice];
    const missed=(questions??[]).filter((q,i)=>q.correctIndex!==choices[i]);
    const review=missed.slice(0,2).map(q=>q.explanation).join(' ');
    suggestions.push({
      experimentId:experiment.id,title:experiment.title,status:`${entry.correct}/2 last self-check`,
      message:review||'Review the concepts, inspect the apparatus and try the two-question self-check again.'
    });
  }
  if(suggestions.length>=3)return suggestions.slice(0,3);
  const tried=new Set(records.map(r=>r.experimentId).filter(id=>known.has(id)));
  for(const experiment of available){
    if(suggestions.length>=3)break;
    if(latest.has(experiment.id)||suggestions.some(s=>s.experimentId===experiment.id))continue;
    suggestions.push({
      experimentId:experiment.id,title:experiment.title,
      status:tried.has(experiment.id)?'Self-check pending':'Practical not yet attempted',
      message:tried.has(experiment.id)
        ?'You have recorded this practical. Review the model limitations and complete its self-check.'
        :'Begin with the apparatus and model assumptions, then record observations and complete the self-check.'
    });
  }
  return suggestions;
}
