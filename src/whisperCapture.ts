const TARGET=16000;
export const MAX_RECORD_SECONDS=12;
export const MIN_SAMPLES=TARGET/2;
// Average samples over each target interval (low-pass box filter) before
// converting to signed PCM. Web Audio supplies mono input at device rate.
export function toPcm16(chunks:readonly Float32Array[],rate:number):Int16Array{
  if(!Number.isFinite(rate)||rate<16000||rate>192000)throw new Error('Unsupported microphone sample rate.');
  const length=Math.min(Math.floor(rate*MAX_RECORD_SECONDS),chunks.reduce((n,c)=>n+c.length,0));
  const all=new Float32Array(length);let offset=0;
  for(const c of chunks){const n=Math.min(c.length,length-offset);all.set(c.subarray(0,n),offset);offset+=n;if(offset===length)break;}
  const result=new Int16Array(Math.min(TARGET*MAX_RECORD_SECONDS,Math.floor(length*TARGET/rate)));
  for(let i=0;i<result.length;i++){
    const start=Math.floor(i*rate/TARGET),end=Math.min(length,Math.max(start+1,Math.floor((i+1)*rate/TARGET)));
    let sum=0;for(let j=start;j<end;j++)sum+=Number.isFinite(all[j])?all[j]:0;
    const x=Math.max(-1,Math.min(1,sum/(end-start)));result[i]=Math.round(x*(x<0?32768:32767));
  }
  all.fill(0);return result;
}
export type Capture={result:Promise<Int16Array>;finish:()=>void;cancel:()=>void};
// Only after an explicit desktop microphone action. A permission request that
// resolves after cancellation is immediately closed, without recording.
export function captureQuestion(onRecording:()=>void):Capture{
  let stream:MediaStream|undefined,context:AudioContext|undefined,processor:ScriptProcessorNode|undefined,
    source:MediaStreamAudioSourceNode|undefined,gain:GainNode|undefined,timer:number|undefined;
  let settled=false,recording=false,rate=0,count=0;
  const chunks:Float32Array[]=[];
  let resolve!:(value:Int16Array)=>void,reject!:(error:Error)=>void;
  const result=new Promise<Int16Array>((ok,no)=>{resolve=ok;reject=no;});
  const clean=()=>{
    window.clearTimeout(timer);
    if(processor){processor.onaudioprocess=null;processor.disconnect();}
    source?.disconnect();gain?.disconnect();stream?.getTracks().forEach(t=>t.stop());
    if(context&&context.state!=='closed')void context.close().catch(()=>undefined);
    for(const c of chunks)c.fill(0);chunks.length=0;
  };
  const fail=(message:string)=>{if(settled)return;settled=true;clean();reject(new Error(message));};
  const finish=()=>{
    if(settled)return;
    if(!recording){fail('Microphone recording has not started.');return;}
    try{const pcm=toPcm16(chunks,rate);if(pcm.length<MIN_SAMPLES){pcm.fill(0);fail('Record at least half a second of speech.');return;}
      settled=true;clean();resolve(pcm);
    }catch(e){fail(e instanceof Error?e.message:'Unable to process audio.');}
  };
  timer=window.setTimeout(()=>fail('Microphone permission or setup timed out. Type the question instead.'),15000);
  void (async()=>{
    try{
      if(!navigator.mediaDevices?.getUserMedia||typeof AudioContext==='undefined')throw new Error('Offline microphone capture is unavailable.');
      context=new AudioContext();
      const acquired=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
      if(settled){acquired.getTracks().forEach(t=>t.stop());return;}
      stream=acquired;await context.resume();if(settled)return;
      rate=context.sampleRate;
      if(rate<16000||rate>192000)throw new Error('Unsupported microphone sample rate.');
      source=context.createMediaStreamSource(stream);
      // ScriptProcessor is supported by WebView2; zero gain prevents microphone
      // loopback through classroom speakers. No audio leaves this graph.
      processor=context.createScriptProcessor(4096,1,1);gain=context.createGain();gain.gain.value=0;
      processor.onaudioprocess=e=>{
        if(settled)return;
        const data=e.inputBuffer.getChannelData(0);
        const n=Math.min(data.length,Math.floor(rate*MAX_RECORD_SECONDS)-count);
        if(n>0){chunks.push(new Float32Array(data.subarray(0,n)));count+=n;}
        if(count>=rate*MAX_RECORD_SECONDS)finish();
      };
      source.connect(processor);processor.connect(gain);gain.connect(context.destination);
      stream.getTracks().forEach(track=>track.addEventListener('ended',()=>{if(!settled)fail('Microphone disconnected.');},{once:true}));
      recording=true;window.clearTimeout(timer);timer=window.setTimeout(finish,MAX_RECORD_SECONDS*1000);onRecording();
    }catch(e){fail(e instanceof Error?e.message:'Microphone access failed.');}
  })();
  return {result,finish,cancel:()=>fail('Listening cancelled.')};
}
