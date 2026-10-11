import {describe,expect,it} from 'vitest';
import {experiments} from './engine';
import {hasUnfinishedScaffold,reflectionScaffold,reportGuidance} from './reportGuidance';
describe('guided practical writing',()=>{
  it('grounds optional writing prompts in the actual lesson guide for every experiment',()=>{
    for(const lab of experiments){
      const guide=reportGuidance(lab.id);
      expect(guide.questions.length).toBeGreaterThanOrEqual(2);
      expect(guide.scientificLimit.length).toBeGreaterThan(15);
      expect(guide.hint).toContain('readings');
    }
    expect(()=>reportGuidance('unlisted-experiment')).toThrow();
  });
  it('never presents a blank scaffold as the student own completed work',()=>{
    expect(hasUnfinishedScaffold(reflectionScaffold())).toBe(true);
    expect(hasUnfinishedScaffold('I measured a pH of 7 near equivalence.')).toBe(false);
    expect(hasUnfinishedScaffold('')).toBe(false);
  });
});
