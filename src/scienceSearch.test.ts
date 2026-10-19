import {describe, expect, it} from 'vitest';
import {scienceCorpus, keywordSearch, cosineScore, rerankByEmbedding} from './scienceSearch';

describe('offline, source-grounded science search',()=>{
  it('includes verified sources from all four subjects',()=>{
    expect(new Set(scienceCorpus.map(doc=>doc.id)).size).toBe(scienceCorpus.length);
    for(const subject of ['chemistry','physics','biology','agriculture']){
      expect(scienceCorpus.some(doc=>doc.subject===subject)).toBe(true);
    }
    expect(scienceCorpus.some(doc=>doc.id.startsWith('pubchem-')&&doc.sourceUrl?.includes('pubchem.ncbi.nlm.nih.gov'))).toBe(true);
    expect(scienceCorpus.some(doc=>doc.id.startsWith('gbif-')&&doc.sourceUrl?.includes('gbif.org/species/'))).toBe(true);
  });
  it('finds exact reference facts offline without needing a model',()=>{
    const results=keywordSearch('sodium chloride');
    expect(results.some(item=>item.hit.title==='Sodium chloride')).toBe(true);
    expect(keywordSearch('Newton')[0].hit.title).toContain("Newton");
    expect(keywordSearch('')).toEqual([]);
    expect(keywordSearch('z'.repeat(301))).toEqual([]);
  });
  it('validates vector dimensions and cannot generate unsupported assertions',()=>{
    expect(cosineScore([1,0],[1,0])).toBe(1);
    expect(cosineScore([1,0],[0,1])).toBe(0);
    expect(cosineScore([1,2],[1])).toBe(0);
    expect(cosineScore([Infinity],[2])).toBe(0);
    const science=scienceCorpus.slice(0,2);
    const results=rerankByEmbedding([1,0], science,[[1,0],[0,1]]);
    expect(results).toHaveLength(1);
    expect(results[0].hit.id).toBe(science[0].id);
    expect(()=>rerankByEmbedding([1,0], science,[])).toThrow(/mismatch/);
  });
  it('does not return an invented answer or unattributed external reference',()=>{
    for(const hit of keywordSearch('electric power')){
      expect(scienceCorpus).toContain(hit.hit);
      expect(hit.hit.sourceLabel.trim().length).toBeGreaterThan(6);
    }
  });
});
