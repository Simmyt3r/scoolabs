import {describe,it,expect} from 'vitest';
import {gradebookSummary,makeGradebookCsv,assignmentProgress} from './gradebook';
import type {LabRecord} from './store';
const r=(x:Partial<LabRecord>={}):LabRecord=>({id:'1',timestamp:'2026-10-11T12:00:00Z',student:'Amina',classroom:'SS2A',experimentId:'titration',experimentTitle:'Titration',subject:'chemistry',settings:'25mL',observation:'Neutral',conclusion:'Result',grade:null,feedback:null,...x});
describe('offline gradebook',()=>{
  it('calculates valid graded averages including zero scores',()=>{
    const m=gradebookSummary([{id:'c1',name:'SS2A',level:'SS2'}],[{id:'u1',classId:'c1',name:'Amina'}],[r({grade:100}),r({id:'2',grade:0}),r({id:'3'})])[0];
    expect(m).toMatchObject({students:1,submitted:3,graded:2,average:50});
  });
  it('exports escaped strings without spreadsheet formula execution',()=>{
    const csv=makeGradebookCsv([r({student:'=HYPERLINK("http://x")',observation:'+1+1',feedback:'"-evil", cell'})]);
    expect(csv).toContain('"\'=HYPERLINK(""http://x"")"');
    expect(csv).toContain('"\'+1+1"');
    expect(csv).toContain('"""-evil"", cell"');
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });
  it('does not fabricate marks on ungraded records',()=>{
    expect(makeGradebookCsv([r()])).toContain('"Result","",""');
  });
});

describe('teacher assignment status',()=>{
  it('counts submissions by the exact assignment identifier, not matching experiment titles',()=>{
    const classrooms=[{id:'c1',name:'SS2A',level:'SS2'}];
    const children=[{id:'u1',classId:'c1',name:'Amina'},{id:'u2',classId:'c1',name:'Bello'}];
    const work=[r({id:'report1',assignmentId:'a1',grade:75}),r({id:'practice',assignmentId:null,grade:90})];
    const progress=assignmentProgress([{id:'a1',classId:'c1'}],children,classrooms,work)[0];
    expect(progress).toMatchObject({enrolled:2,submitted:1,graded:1,missing:1});
  });
  it('keeps empty class assignments distinct from individual practice reports',()=>{
    const progress=assignmentProgress([{id:'a1',classId:'c1'}],[],[{id:'c1',name:'SS2A',level:'SS2'}],[r({id:'practice'})])[0];
    expect(progress).toMatchObject({enrolled:0,submitted:0,graded:0,missing:0});
    expect(makeGradebookCsv([r({assignmentId:'a1'})])).toContain('"a1"');
  });
});
