import {describe,expect,it} from 'vitest';
import {toPcm16,MAX_RECORD_SECONDS} from './whisperCapture';
describe('offline speech samples',()=>{
  it('converts 48kHz mono frames into bounded 16kHz signed PCM',()=>{
    const data=new Float32Array(48000);data.fill(0.5);
    const output=toPcm16([data.subarray(0,15000),data.subarray(15000)],48000);
    expect(output.length).toBe(16000);expect(output[0]).toBe(16384);
  });
  it('clips values and discards invalid numeric samples',()=>{
    expect(Array.from(toPcm16([new Float32Array([2,-2,NaN,0])],16000))).toEqual([32767,-32768,0,0]);
    expect(()=>toPcm16([],0)).toThrow();
  });
  it('limits input to the explicit recording window',()=>{
    expect(toPcm16([new Float32Array(16000*20)],16000).length).toBe(16000*MAX_RECORD_SECONDS);
  });
});
