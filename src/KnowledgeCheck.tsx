import {useState} from 'react';
import {CheckCircle2, ClipboardCheck, RotateCcw} from 'lucide-react';
import {checkQuestions, evaluateCheck} from './knowledgeChecks';
import {submitKnowledgeCheck, type KnowledgeResult} from './native-storage';

type Props={experimentId:string;studentToken?:string;previous?:KnowledgeResult;onSaved:(result:KnowledgeResult)=>void};
export default function KnowledgeCheck({experimentId,studentToken,previous,onSaved}:Props){
  const questions=checkQuestions[experimentId];
  const [selected,setSelected]=useState<Array<number|null>>([null,null]);
  const [result,setResult]=useState<KnowledgeResult|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  if(!questions)return null;
  async function evaluate(){
    if(selected.length!==2||selected.some(choice=>choice===null)){setError('Answer both questions before checking your understanding.');return;}
    const answers=selected as number[];
    setBusy(true);setError('');
    try{
      const saved=studentToken?await submitKnowledgeCheck(studentToken,experimentId,answers):{
        experimentId,firstChoice:answers[0],secondChoice:answers[1],correct:evaluateCheck(experimentId,answers),updatedAt:new Date().toISOString()
      };
      setResult(saved);
      if(studentToken)onSaved(saved);
    }catch(e){setError('Could not save the knowledge check: '+String(e));}
    finally{setBusy(false);}
  }
  function retry(){setSelected([null,null]);setResult(null);setError('');}
  const checked=result!==null;
  return <section className="knowledge-check" aria-label="Knowledge check">
    <div className="knowledge-check-head"><div><span className="eyebrow">PRACTICAL LEARNING CHECK</span><h3><ClipboardCheck size={20}/> Check your understanding</h3>
      <p>Two short questions from this practical. Feedback is for learning, not a teacher-awarded grade.</p></div>
      {previous&&!checked&&<span className="knowledge-check-previous"><CheckCircle2 size={15}/> Last saved self-check: {previous.correct}/2</span>}
    </div>
    {questions.map((question,i)=><fieldset key={i} className="knowledge-question" disabled={checked||busy}>
      <legend><span>Question {i+1}</span> {question.prompt}</legend>
      {question.options.map((option,j)=><label key={j} className={'knowledge-option '+(selected[i]===j?'chosen ':'')+(checked&&j===question.correctIndex?'correct ':'')+(checked&&selected[i]===j&&j!==question.correctIndex?'incorrect':'')}>
        <input type="radio" name={'knowledge-'+experimentId+'-'+i} checked={selected[i]===j} onChange={()=>setSelected(v=>v.map((n,index)=>index===i?j:n))}/>
        <span>{option}</span>
      </label>)}
      {checked&&<p className="knowledge-explanation"><strong>{selected[i]===question.correctIndex?'Correct.':'Review this.'}</strong> {question.explanation}</p>}
    </fieldset>)}
    {error&&<p className="error-message" role="alert">{error}</p>}
    {checked?<div className="knowledge-outcome"><strong>{result.correct}/2 correct</strong><span>{studentToken?'Saved to your local student account.':'Browser preview only: this score is not saved to a school account.'}</span><button className="button-outline" onClick={retry}><RotateCcw size={15}/> Try again</button></div>:
      <div className="knowledge-actions"><button type="button" className="button-primary" onClick={()=>void evaluate()} disabled={busy||selected.some(x=>x===null)}>{busy?'Checking answers…':'Check answers'}</button><small>{studentToken?'Your latest formative result is stored offline.':'Browser preview: answers are temporary and are not school grades.'}</small></div>}
  </section>;
}
