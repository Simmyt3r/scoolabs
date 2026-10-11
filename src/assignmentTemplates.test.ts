import {describe,expect,it} from 'vitest';
import {createPracticalTemplate} from './assignmentTemplates';
import {experiments} from './engine';
describe('offline practical assignment drafting',()=>{
  it('generates teacher-editable instructions for twelve science lessons',()=>{
    for(const experiment of experiments){
      const template=createPracticalTemplate(experiment.id);
      expect(template.title).toContain(experiment.title);
      expect(template.title.length).toBeLessThanOrEqual(150);
      expect(template.instructions).toContain('Method:');
      expect(template.instructions).toContain('Questions:');
      expect(template.instructions).toContain('Safety:');
      expect(template.instructions.length).toBeLessThanOrEqual(5000);
    }
  });
  it('refuses unknown experiments',()=>expect(()=>createPracticalTemplate('unknown')).toThrow(RangeError));
});
