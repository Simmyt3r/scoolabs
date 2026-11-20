import rawAtlas from './data/reference-atlas.json';
import {prepareLesson} from './lessonEngine';
import type {Subject} from './engine';

export type LessonFile={schema:'scoolabs.lesson';version:1;topic:string;plan:string};
export type LessonReference={id:string;subject:Subject;title:string;overview:string;equation?:string;workedExample?:string;observation?:string;scientificName?:string;limitation:string;category:string};
export const lessonReferences:readonly LessonReference[]=rawAtlas as LessonReference[];
export const LESSON_FILE_MAX=120000;
const cleanLine=(s:string)=>s.replace(/[\r\n]+/g,' ').trim();
export function makeLessonFile(topic:string,plan:string):LessonFile{
  const prepared=prepareLesson(topic,plan);
  return {schema:'scoolabs.lesson',version:1,topic:prepared.topic,plan};
}
export function parseLessonFile(raw:string):LessonFile{
  if(raw.length>LESSON_FILE_MAX)throw new Error('Lesson file is too large.');
  let value:unknown;
  try{value=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{throw new Error('This is not a valid Scoolabs lesson file.');}
  if(typeof value!=='object'||value===null||Array.isArray(value))throw new Error('Invalid lesson file.');
  const v=value as Record<string,unknown>;
  if(v.schema!=='scoolabs.lesson'||v.version!==1||typeof v.topic!=='string'||typeof v.plan!=='string')throw new Error('Unsupported lesson file format.');
  return makeLessonFile(v.topic,v.plan);
}
export function importTextLesson(raw:string,fallbackTopic:string):LessonFile{
  if(raw.length>20001)throw new Error('Teaching notes must be at most 20,000 characters.');
  const clean=raw.replace(/^\uFEFF/,'');
  return makeLessonFile(fallbackTopic,clean);
}
/**
 * Assemble a draft only from a deliberately selected local reference.
 * Generic classroom prompts are separate from factual statements. No LLM.
 */
export function referenceDraft(id:string,topicOverride=''):LessonFile{
  const ref=lessonReferences.find(x=>x.id===id);
  if(!ref)throw new Error('Select a reference from the offline lesson library.');
  const topic=topicOverride.trim()||ref.title;
  const detail=[ref.equation&&'Formula: '+ref.equation,ref.scientificName&&'Scientific name: '+ref.scientificName,ref.observation].filter(Boolean).join('\n');
  const plan=[
    '# Introduction',
    'Today we will study '+cleanLine(ref.title)+'. Think about what you already know about this topic.',
    '# Learning objectives',
    'By the end of this lesson, describe '+cleanLine(ref.title)+' in your own words, '+(ref.equation?'interpret the formula and worked example, ':ref.observation?'describe the observation, ':'')+'and explain the limitations of the reference.',
    '# Explanation',
    ref.overview,
    detail?'# Key details\n'+detail:'',
    ref.workedExample?'# Worked example\n'+ref.workedExample:'',
    '# Class activity',
    'In pairs, explain the main idea in your own words. '+(ref.workedExample?'Describe each step of the worked example. ':'')+'Share your explanation with the class.',
    '# Limitations and safety',
    ref.limitation,
    '# Recap',
    ref.overview,
    '# Source',
    'Scoolabs curated reference: '+cleanLine(ref.title)+' · '+cleanLine(ref.category)+' · '+ref.id+'. Teacher review is required before use.',
    '# Questions and answers',
    'Q: What is the main idea of '+cleanLine(ref.title)+'?',
    'A: '+cleanLine(ref.overview),
    ref.equation?'Q: What is the formula?\nA: '+cleanLine(ref.equation):'',
    ref.workedExample?'Q: What is the worked example?\nA: '+cleanLine(ref.workedExample):'',
    'Q: What limitation should we remember?',
    'A: '+cleanLine(ref.limitation)
  ].filter(Boolean).join('\n');
  return makeLessonFile(topic,plan);
}
