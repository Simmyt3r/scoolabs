//! Read-only classroom display. Never send the private operator workspace to TV.
use serde::{Deserialize, Serialize};
use std::{sync::Mutex,time::{Duration,Instant}};
use tauri::{AppHandle,Manager,WebviewUrl,WebviewWindow,WebviewWindowBuilder};

const LABEL:&str="classroom-projector";
const LEASE:Duration=Duration::from_secs(5);

#[derive(Clone,Debug,Deserialize,Serialize)]
#[serde(tag="kind",rename_all="lowercase",deny_unknown_fields)]
enum Board {
    None,
    Circuit{voltage:f64,resistance:f64},
    Pendulum{length:f64},
    Microscope{objective:u8},
    Germination{crop:String,moisture:f64,temperature:f64,day:u8},
}
impl Board {
    fn valid(&self)->bool{
        let range=|n:&f64,a:f64,b:f64|n.is_finite()&&*n>=a&&*n<=b;
        match self{
            Self::None=>true,
            Self::Circuit{voltage,resistance}=>range(voltage,0.0,24.0)&&range(resistance,1.0,100.0),
            Self::Pendulum{length}=>range(length,0.1,2.0),
            Self::Microscope{objective}=>matches!(*objective,4|10|40),
            Self::Germination{crop,moisture,temperature,day}=>matches!(crop.as_str(),"maize"|"cowpea"|"rice")&&range(moisture,0.0,100.0)&&range(temperature,0.0,55.0)&&*day<=21,
        }
    }
}
#[derive(Clone,Debug,Deserialize,Serialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
pub struct Frame{
    mode:String, topic:String,title:String,text:String,section:u32,total:u32,status:String,
    elapsed_seconds:u32,target_minutes:u32,board:Board,
    #[serde(skip_serializing_if="Option::is_none")] response:Option<String>,
    #[serde(skip_serializing_if="Option::is_none")] source:Option<String>,
}
impl Frame{
    fn valid(&self)->bool{
        matches!(self.mode.as_str(),"waiting"|"lesson"|"question"|"assessment"|"finished"|"blank")&&
        self.topic.chars().count()<=150&&self.title.chars().count()<=150&&self.text.chars().count()<=20000&&
        self.section<=self.total&&self.total<=100&&self.elapsed_seconds<=86400&&
        (1..=180).contains(&self.target_minutes)&&matches!(self.status.as_str(),"Ready"|"Speaking"|"Paused"|"Discussion"|"Listening")&&self.board.valid()&&
        (self.mode=="lesson"||matches!(&self.board,Board::None))&&
        (matches!(self.mode.as_str(),"question"|"assessment")||(self.response.is_none()&&self.source.is_none()))&&
        self.response.as_ref().map_or(true,|x|x.chars().count()<=20000)&&
        self.source.as_ref().map_or(true,|x|x.chars().count()<=300)&&
        (!matches!(self.mode.as_str(),"blank"|"waiting")||self.topic.is_empty()&&self.section==0&&self.total==0)
    }
}
struct Lease{session:String,seq:u64,updated:Instant,frame:Option<Frame>}
#[derive(Default)]
pub struct ProjectorState(Mutex<Option<Lease>>);
fn operator(window:&WebviewWindow)->Result<(),String>{
    if window.label()=="main"{Ok(())}else{Err("Operator window required.".into())}
}
#[tauri::command]
pub async fn open_classroom_projector(app:AppHandle,window:WebviewWindow,state:tauri::State<'_,ProjectorState>)->Result<String,String>{
    operator(&window)?;
    let session=uuid::Uuid::new_v4().to_string();
    {
        let mut current=state.0.lock().map_err(|_|"Display state unavailable.")?;
        *current=Some(Lease{session:session.clone(),seq:0,updated:Instant::now(),frame:None});
    }
    if let Some(existing)=app.get_webview_window(LABEL){
        existing.show().map_err(|_|"Unable to show projector window.")?;
        let _=existing.set_focus();
    }else{
        WebviewWindowBuilder::new(&app,LABEL,WebviewUrl::App("index.html".into()))
            .title("Scoolabs Classroom Display").inner_size(1200.0,760.0).min_inner_size(640.0,360.0)
            .build().map_err(|_|"Unable to open projector window. Use the main classroom view.")?;
    }
    Ok(session)
}
#[tauri::command]
pub fn publish_classroom_frame(app:AppHandle,window:WebviewWindow,state:tauri::State<'_,ProjectorState>,session:String,seq:u64,frame:Frame)->Result<(),String>{
    operator(&window)?;
    if app.get_webview_window(LABEL).is_none(){return Err("Projector window closed.".into());}
    if !frame.valid(){return Err("Invalid projector content.".into());}
    let mut current=state.0.lock().map_err(|_|"Display state unavailable.")?;
    let lease=current.as_mut().filter(|x|x.session==session).ok_or("Display session expired.")?;
    if seq>lease.seq{lease.seq=seq;lease.updated=Instant::now();lease.frame=Some(frame);}
    Ok(())
}
#[tauri::command]
pub fn read_classroom_frame(window:WebviewWindow,state:tauri::State<'_,ProjectorState>)->Result<Option<Frame>,String>{
    if window.label()!=LABEL{return Err("Projector window required.".into());}
    let current=state.0.lock().map_err(|_|"Display state unavailable.")?;
    Ok(current.as_ref().filter(|x|x.updated.elapsed()<=LEASE).and_then(|x|x.frame.clone()))
}
#[tauri::command]
pub async fn close_classroom_projector(app:AppHandle,window:WebviewWindow,state:tauri::State<'_,ProjectorState>,session:String)->Result<(),String>{
    operator(&window)?;
    {
        let mut current=state.0.lock().map_err(|_|"Display state unavailable.")?;
        if current.as_ref().map_or(true,|x|x.session!=session){return Ok(());}
        *current=None;
    }
    if let Some(display)=app.get_webview_window(LABEL){display.close().map_err(|_|"Unable to close display.")?;}
    Ok(())
}
#[cfg(test)]
mod tests{
    use super::*;
    #[test]fn rejects_private_or_invalid_frame(){
        let raw=serde_json::json!({"mode":"lesson","topic":"Electricity","title":"Ohm's law","text":"Explain current","section":1,"total":2,"status":"Ready","elapsedSeconds":0,"targetMinutes":40,"board":{"kind":"circuit","voltage":12,"resistance":4}});
        let f:Frame=serde_json::from_value(raw.clone()).unwrap();
        assert!(f.valid());
        let mut private=raw.clone();private["modelSuggestion"]=serde_json::json!("private");
        assert!(serde_json::from_value::<Frame>(private).is_err());
        let mut wrong=raw.clone();wrong["board"]["resistance"]=serde_json::json!(0);
        assert!(!serde_json::from_value::<Frame>(wrong).unwrap().valid());
        let mut answer=raw;answer["response"]=serde_json::json!("unrevealed");
        assert!(!serde_json::from_value::<Frame>(answer).unwrap().valid());
    }
}
