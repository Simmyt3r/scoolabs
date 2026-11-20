/** Teacher-supplied lesson text is the primary classroom authority. No generated facts. */
export type LessonSlide = {title:string; text:string};
export type LessonQuestion = {question:string; answer:string};
export type Lesson = {topic:string; slides:LessonSlide[]; questions:LessonQuestion[]};
export type Reply = {kind:'approved'|'excerpt'|'unanswered'|'reviewed-ai'; text:string; source:string};

export const DEMO_TOPIC = "Ohm's law";
export const DEMO_PLAN = [
  '# Introduction',
  'Imagine a battery pushing electric charge through a wire. Today we will explore how voltage, current and resistance are related.',
  '# Learning objectives',
  'By the end of this lesson, explain voltage, current and resistance; use V = I × R; and predict what happens when resistance changes at constant voltage.',
  '# Explanation',
  'Ohm’s law states that voltage equals current multiplied by resistance for an ohmic conductor at constant temperature. Voltage is measured in volts, current in amperes and resistance in ohms.',
  '# Worked example',
  'A 6 volt battery is connected to a 3 ohm resistor. Current = voltage divided by resistance = 6 divided by 3 = 2 amperes.',
  '# Class activity',
  'Ask learners to calculate the current when voltage is 12 volts and resistance is 4 ohms. Allow time for discussion before revealing the answer.',
  '# Recap',
  'The answer to our activity is 3 amperes. Current increases as voltage increases at fixed resistance; current decreases as resistance increases at fixed voltage.',
  '# Questions and answers',
  'Q: What is the formula for Ohm’s law?',
  'A: Voltage equals current multiplied by resistance: V = I × R.',
  'Q: What happens to current when resistance increases at constant voltage?',
  'A: Current decreases.',
  'Q: What is the answer to the class activity?',
  'A: 3 amperes.'
].join('\n');

const normalise=(s:string)=>s.toLowerCase().normalize('NFKC').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const stop=new Set('a an the is are was were it of to for from in on at by and or what why how when where which who do does did can could would should please tell me explain about this that with as be if'.split(' '));
const words=(s:string)=>[...new Set(normalise(s).split(' ').filter(w=>w.length>1&&!stop.has(w)))];

function chunks(text:string):string[]{
  const result:string[]=[];
  let rest=text.trim();
  while(rest.length>620){
    let at=rest.lastIndexOf(' ',620);
    const sentence=rest.lastIndexOf('. ',620);
    if(sentence>250)at=sentence+1;
    if(at<1)at=620;
    result.push(rest.slice(0,at).trim());rest=rest.slice(at).trim();
  }
  if(rest)result.push(rest);
  return result;
}
export function prepareLesson(topic:string,plan:string):Lesson{
  const cleanTopic=topic.trim();
  if(!cleanTopic||cleanTopic.length>150)throw new Error('Enter a topic of 1–150 characters.');
  if(!plan.trim()||plan.length>20000)throw new Error('Enter a lesson plan of 1–20,000 characters.');
  const slides:LessonSlide[]=[]; const questions:LessonQuestion[]=[];
  let title='Lesson';let lines:string[]=[];let pending='';let inQuestions=false;
  const flush=()=>{
    const parts=chunks(lines.join('\n').trim());
    parts.forEach((part,i)=>slides.push({title:parts.length>1?title+' ('+(i+1)+'/'+parts.length+')':title,text:part}));
    lines=[];
  };
  for(const raw of plan.replace(/\r\n?/g,'\n').split('\n')){
    const line=raw.trim();
    const heading=line.match(/^#{1,4}\s+(.+)$/);
    if(heading){
      if(pending)throw new Error('Add an A: answer for every Q: question.');
      flush();title=heading[1].slice(0,150);inQuestions=/^(questions?\s*(and|&)\s*answers?|q\s*&\s*a)$/i.test(title);
      continue;
    }
    const q=line.match(/^Q:\s*(.+)$/i),a=line.match(/^A:\s*(.+)$/i);
    if(q){
      if(pending)throw new Error('Add an A: answer before the next question.');
      pending=q[1];continue;
    }
    if(a){
      if(!pending)throw new Error('An A: answer must follow a Q: question.');
      questions.push({question:pending,answer:a[1]});pending='';continue;
    }
    if(pending&&line)throw new Error('Place each answer on one A: line immediately after its Q: question.');
    if(inQuestions&&line)throw new Error('Use Q: and A: lines in the Questions and answers section.');
    if(!inQuestions)lines.push(line);
  }
  if(pending)throw new Error('Add an A: answer for every Q: question.');
  flush();
  if(!slides.length)throw new Error('Include at least one section of lesson content, not just questions.');
  if(slides.length>100||questions.length>100)throw new Error('Use at most 100 lesson sections and 100 approved questions.');
  return {topic:cleanTopic,slides,questions};
}
export function answerQuestion(lesson:Lesson,question:string):Reply{
  const q=normalise(question);
  const unknown:Reply={kind:'unanswered',text:'I do not have a verified answer in this lesson. Let us ask the supervising teacher or consult an approved reference.',source:'Not answered'};
  if(!q||question.length>300)return unknown;
  const match=lesson.questions.find(item=>normalise(item.question)===q);
  if(match)return {kind:'approved',text:match.answer,source:'Teacher-provided question and answer'};
  const terms=words(question);
  if(!terms.length)return unknown;
  // Related excerpts are explicitly not asserted to answer the question.
  // Require several meaningful words (or one long exact word for a single-word query).
  const ranked=lesson.slides.map(slide=>{
    const found=new Set(words(slide.title+' '+slide.text));
    const matches=terms.filter(term=>found.has(term)).length;
    return {slide,matches};
  }).filter(item=>terms.length===1?terms[0].length>=4&&item.matches===1:item.matches>=2&&item.matches/terms.length>=0.6)
    .sort((a,b)=>b.matches-a.matches);
  if(!ranked.length)return unknown;
  return {kind:'excerpt',text:ranked[0].slide.text,source:'Related lesson excerpt: '+ranked[0].slide.title};
}
