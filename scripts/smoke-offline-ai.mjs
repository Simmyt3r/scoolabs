#!/usr/bin/env node
// Runs actual local ONNX inference in CI; fails if runtime asks for a cloud model.
import {env, pipeline} from '@xenova/transformers';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';

const base = resolve('public/offline-ai/models');
if (!existsSync(resolve(base, 'Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx'))) {
  throw new Error('Bundled quantised ONNX weights are missing');
}
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.useBrowserCache = false;
env.useFS = true;
env.localModelPath = base.replaceAll('\\','/') + '/';
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {quantized: true});
const vector = await extractor('A circuit has a resistor and a battery.', {pooling:'mean',normalize:true});
const points = Array.from(vector.data, Number);
if (points.length !== 384 || points.some(x => !Number.isFinite(x))) {
  throw new Error('Offline MiniLM inference returned invalid embedding');
}
const length = Math.sqrt(points.reduce((sum, point)=>sum+point*point,0));
if (Math.abs(length-1)>0.05) throw new Error('Offline model normalisation failed');
console.log('PASS: model produced 384-dimensional embeddings using locally staged files only');
