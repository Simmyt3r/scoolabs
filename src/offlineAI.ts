import {cosineScore, keywordSearch, scienceCorpus, type ScienceHit, type ScoredHit} from './scienceSearch';

type Vectorise = (input: string) => Promise<number[]>;
let runtime: Promise<Vectorise> | undefined;
const memo = new Map<string, number[]>();

/** Local-only inference. No model, wasm, or student data ever goes to an online endpoint. */
async function localEmbedder(): Promise<Vectorise> {
  if (!runtime) runtime = (async () => {
    const {env, pipeline} = await import('@xenova/transformers');
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.useBrowserCache = false;
    // All URLs must point at the locally bundled Tauri/Vite assets.
    const base = import.meta.env.BASE_URL || '/';
    env.localModelPath = base + 'offline-ai/models/';
    env.backends.onnx.wasm.wasmPaths = base + 'offline-ai/wasm/';
    env.backends.onnx.wasm.numThreads = 1; // low-end Windows laptops, no SharedArrayBuffer requirement
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
    return async (input: string) => {
      const output = await extractor(input, {pooling: 'mean', normalize: true});
      const vector = Array.from(output.data, Number);
      if (!vector.length || vector.some(value => !Number.isFinite(value))) {
        throw new Error('Local embedding model returned invalid values');
      }
      return vector;
    };
  })().catch(error => {
    runtime = undefined;
    throw error;
  });
  return runtime;
}

/** Only cite known local reference records; the embedding model is never a source of scientific facts. */
export async function semanticScienceSearch(
  query: string,
  subject: ScienceHit['subject'],
  onProgress?: (done: number, total: number) => void,
): Promise<ScoredHit[]> {
  const cleaned = query.trim();
  if (cleaned.length < 3 || cleaned.length > 300) return [];
  const docs = scienceCorpus.filter(doc =>
    doc.subject === subject && !doc.id.startsWith('element-') // 118 elements use exact search for low RAM
  );
  const embed = await localEmbedder();
  // Sequential CPU inference limits memory pressure. Results remain in memory for this session.
  let done = 0;
  for (const doc of docs) {
    if (!memo.has(doc.id)) memo.set(doc.id, await embed(doc.description.slice(0, 500)));
    done++;
    onProgress?.(done, docs.length + 1);
  }
  const questionVector = await embed(cleaned);
  onProgress?.(docs.length + 1, docs.length + 1);
  const ranking = docs.map(hit => ({hit, score: cosineScore(questionVector, memo.get(hit.id) ?? [])}))
    .filter(item => item.score >= 0.28)
    .sort((a, b) => b.score - a.score || a.hit.id.localeCompare(b.hit.id)).slice(0, 8);
  const exactElementMatches = keywordSearch(cleaned,
    scienceCorpus.filter(doc => doc.subject === subject && doc.id.startsWith('element-'))
  ).slice(0, 3);
  return [
    ...exactElementMatches.map(result => ({...result, score: 1})),
    ...ranking.filter(result => !exactElementMatches.some(x => x.hit.id === result.hit.id)),
  ].slice(0, 8);
}
