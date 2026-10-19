import rawAtlas from './data/reference-atlas.json';
import rawCompounds from './data/compounds.json';
import rawConstants from './data/physical-constants.json';
import rawTaxonomy from './data/taxonomy.json';
import rawElements from './data/elements.json';

export type ScienceHit = {
  id: string;
  title: string;
  subject: 'chemistry' | 'physics' | 'biology' | 'agriculture';
  description: string;
  evidence: string;
  sourceLabel: string;
  sourceUrl?: string;
  experimentId?: string;
};
export type ScoredHit = {hit: ScienceHit; score: number};

type AtlasRow = typeof rawAtlas[number];
const passage = (c: AtlasRow) => [
  c.title, c.category, c.overview, 'equation' in c ? c.equation : '',
  'workedExample' in c ? c.workedExample : '',
  'observation' in c ? c.observation : '',
  'scientificName' in c ? c.scientificName : '',
].filter(Boolean).join('. ');

/**
 * Search only reviewed/attributed local text. Never form free-text synthetic
 * science conclusions from a cosine score.
 */
export const scienceCorpus: ScienceHit[] = [
  ...rawAtlas.map(c => ({
    id: 'atlas-' + c.id, title: c.title, subject: c.subject as ScienceHit['subject'],
    description: passage(c), evidence: c.overview,
    sourceLabel: 'Scoolabs curated reference · ' + c.category,
    experimentId: c.experimentId,
  })),
  ...rawCompounds.map(c => ({
    id: 'pubchem-' + c.cid, title: c.name, subject: 'chemistry' as const,
    description: [c.name, c.formula, c.iupacName, 'molecular weight ' + c.molecularWeight].join(' '),
    evidence: c.formula + ' · Molecular weight ' + c.molecularWeight + ' g/mol',
    sourceLabel: 'NIH PubChem · CID ' + c.cid, sourceUrl: c.source,
  })),
  ...rawConstants.map(c => ({
    id: 'nist-' + c.id, title: c.name, subject: 'physics' as const,
    description: [c.name, c.valueText, c.unit].join(' '),
    evidence: c.valueText + ' ' + c.unit + ' (' + c.uncertainty + ')',
    sourceLabel: c.source,
  })),
  ...rawTaxonomy.map(c => ({
    id: 'gbif-' + c.gbifKey, title: c.name,
    subject: (c.kingdom === 'Plantae' || c.name === 'Bos taurus' || c.name === 'Capra hircus' || c.name === 'Gallus gallus' ? 'agriculture' : 'biology') as ScienceHit['subject'],
    description: [c.name, c.acceptedName, c.kingdom, c.family, c.rank].join(' '),
    evidence: c.acceptedName + ' · ' + c.kingdom + ' · ' + c.family,
    sourceLabel: 'GBIF Backbone Taxonomy', sourceUrl: c.source,
  })),
  ...rawElements.map(e => ({
    id: 'element-' + e.number, title: e.name, subject: 'chemistry' as const,
    description: [e.name, e.symbol, 'atomic number', e.number].join(' '),
    evidence: 'Symbol ' + e.symbol + ' · Atomic number ' + e.number,
    sourceLabel: 'Scoolabs periodic element reference',
  })),
];

const normalise = (value: string) => value.toLocaleLowerCase('en').normalize('NFKC');
const tokens = (value: string) => normalise(value).match(/[a-z0-9]+/g) ?? [];

export function keywordSearch(query: string, corpus: readonly ScienceHit[] = scienceCorpus): ScoredHit[] {
  const q = normalise(query.trim());
  if (!q || q.length > 300) return [];
  const words = [...new Set(tokens(q).filter(w => w.length > 1))];
  if (!words.length) return [];
  return corpus.map(hit => {
    const title = normalise(hit.title);
    const description = normalise(hit.description);
    let score = title.includes(q) ? 3 : 0;
    for (const term of words) {
      if (tokens(title).includes(term)) score += 2;
      else if (description.includes(term)) score += 1;
    }
    return {hit, score};
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.hit.id.localeCompare(b.hit.id)).slice(0, 12);
}

export function cosineScore(left: readonly number[], right: readonly number[]): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let dot = 0, a = 0, b = 0;
  for (let i = 0; i < left.length; i++) {
    if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) return 0;
    dot += left[i] * right[i];
    a += left[i] * left[i];
    b += right[i] * right[i];
  }
  return a > 0 && b > 0 ? dot / Math.sqrt(a * b) : 0;
}

export function rerankByEmbedding(
  queryVector: readonly number[], corpus: readonly ScienceHit[], vectors: readonly (readonly number[])[]
): ScoredHit[] {
  if (corpus.length !== vectors.length) throw new Error('Science index mismatch');
  return corpus.map((hit, i) => ({hit, score: cosineScore(queryVector, vectors[i])}))
    .filter(item => item.score >= 0.25)
    .sort((a, b) => b.score - a.score || a.hit.id.localeCompare(b.hit.id))
    .slice(0, 8);
}
