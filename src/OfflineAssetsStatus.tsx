import {useEffect,useState} from 'react';
import {invoke,isTauri} from '@tauri-apps/api/core';
import {BookOpen, CheckCircle2, AlertTriangle} from 'lucide-react';

type AssetsStatus = {
  verified:boolean;
  scienceDatasets:number;
  modelInstalled:boolean;
  modelInferenceEnabled:boolean;
  message:string;
};

/** The model package is available locally; this does NOT imply active AI inference. */
export default function OfflineAssetsStatus(){
  const [status,setStatus]=useState<AssetsStatus|null>(null);
  useEffect(()=>{
    if(!isTauri()) return;
    let active=true;
    invoke<AssetsStatus>('offline_assets_status')
      .then(result=>{if(active)setStatus(result);})
      .catch(()=>{if(active)setStatus({
        verified:false,scienceDatasets:0,modelInstalled:false,
        modelInferenceEnabled:false,message:'Unable to inspect locally installed scientific assets.'
      });});
    return ()=>{active=false;};
  },[]);
  if(!isTauri())return null;
  return <section className="learning-panel" aria-label="Installed offline science and AI assets">
    <div className="learning-panel-heading">
      <div><span className="eyebrow">INSTALLED OFFLINE RESOURCES</span><h2>Science datasets and AI model</h2></div>
      {status?.verified?<CheckCircle2 size={20}/>:status?<AlertTriangle size={20}/>:<BookOpen size={20}/>}
    </div>
    {!status?<p>Checking the local resource pack...</p>:<>
      <p role="status">{status.message}</p>
      {status.verified&&<p><strong>{status.scienceDatasets} science datasets verified.</strong> Quantised MiniLM embedding model installed: <strong>{status.modelInstalled?'Yes':'No'}</strong>.</p>}
      <p className="learning-explainer">Science references are available without internet. The packaged model does not yet generate answers or grade students. Teachers remain responsible for checking scientific content.</p>
    </>}
  </section>;
}
