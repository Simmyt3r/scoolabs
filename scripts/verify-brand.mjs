import {readFileSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
const mark=readFileSync('public/brand/scoolabs-mark.svg','utf8');
assert.match(mark,/viewBox="0 0 512 512"/);
assert.match(mark,/<title id="title">Scoolabs<\/title>/);
for(const path of ['src-tauri/icons/icon.ico','src-tauri/icons/icon.png']){
  const bin=readFileSync(path);
  assert.ok(bin.length>1000, 'Generated icon is too small: '+path);
  const png=path.endsWith('.png');
  assert.equal(png?bin.subarray(0,8).toString('hex'):bin.subarray(0,4).toString('hex'),
    png?'89504e470d0a1a0a':'00000100','Incorrect icon encoding: '+path);
  console.log('Verified Scoolabs brand icon:',path,statSync(path).size,'bytes');
}
