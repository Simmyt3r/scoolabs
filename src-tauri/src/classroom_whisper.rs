//! Bounded, explicit local Whisper transcription. Nothing is saved by Scoolabs.
use serde::{Deserialize, Serialize};
use std::{io::Read,time::Duration,sync::atomic::{AtomicBool,Ordering}};

const BASE:&str="http://127.0.0.1:17892";
const RATE:usize=16000;
const MAX_SAMPLES:usize=RATE*12;
const MIN_SAMPLES:usize=RATE/2;

#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct WhisperStatus{available:bool,message:String}
#[derive(Deserialize,Serialize,Debug)]
pub struct WhisperResult{text:String}

fn validate_audio(samples:&[i16])->Result<(),String>{
    if !(MIN_SAMPLES..=MAX_SAMPLES).contains(&samples.len()){
        return Err("Record between half a second and twelve seconds of speech.".into());
    }
    // Conservative silence filter; not a calibrated speech-confidence measure.
    let peak=samples.iter().map(|s|i32::from(*s).abs()).max().unwrap_or(0);
    let energy=samples.iter().map(|s|f64::from(*s).powi(2)).sum::<f64>()/samples.len() as f64;
    if peak<400||energy.sqrt()<80.0{return Err("No clear audio was captured. Try speaking closer to the microphone or type.".into());}
    Ok(())
}
fn wav(samples:&[i16])->Vec<u8>{
    let len=(samples.len()*2) as u32;
    let mut out=Vec::with_capacity(44+len as usize);
    out.extend_from_slice(b"RIFF");out.extend_from_slice(&(36+len).to_le_bytes());
    out.extend_from_slice(b"WAVEfmt ");out.extend_from_slice(&16u32.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&(RATE as u32).to_le_bytes());out.extend_from_slice(&((RATE*2) as u32).to_le_bytes());
    out.extend_from_slice(&2u16.to_le_bytes());out.extend_from_slice(&16u16.to_le_bytes());
    out.extend_from_slice(b"data");out.extend_from_slice(&len.to_le_bytes());
    for s in samples{out.extend_from_slice(&s.to_le_bytes());}
    out
}
fn client(timeout:u64)->Result<reqwest::blocking::Client,String>{
    reqwest::blocking::Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(3)).timeout(Duration::from_secs(timeout)).build()
        .map_err(|_|"Unable to initialize local speech connection.".into())
}
fn parse_transcript(raw:&[u8])->Result<WhisperResult,String>{
    let mut result:WhisperResult=serde_json::from_slice(raw)
        .map_err(|_|"Local speech model returned an invalid transcript.")?;
    result.text=result.text.split_whitespace().collect::<Vec<_>>().join(" ");
    // Whisper may hallucinate text on background noise. Reject obvious noise-only
    // annotations; a human still needs to review every returned transcript.
    if result.text.is_empty()||result.text.chars().count()>300||
        !result.text.chars().any(|c|c.is_alphabetic())||
        (result.text.starts_with('[')&&result.text.ends_with(']'))||
        (result.text.starts_with('(')&&result.text.ends_with(')')){
        return Err("No usable question was recognized. Please try again or type.".into());
    }
    Ok(result)
}
fn probe()->Result<(),String>{
    let response=client(5)?.get(format!("{BASE}/")).send().map_err(|_|"Local Whisper is not running. Use Windows speech or type instead.")?;
    // The official server responds with this product header. It is a compatibility
    // check, not cryptographic verification or proof of a particular model.
    if !response.status().is_success()||response.headers().get("server").and_then(|v|v.to_str().ok())!=Some("whisper.cpp"){
        return Err("Local service did not identify itself as whisper.cpp.".into());
    }
    Ok(())
}
pub fn transcribe(samples:Vec<i16>,cancelled:&AtomicBool)->Result<WhisperResult,String>{
    validate_audio(&samples)?;
    if cancelled.load(Ordering::Acquire){return Err("Listening cancelled.".into());}
    probe()?;
    if cancelled.load(Ordering::Acquire){return Err("Listening cancelled.".into());}
    let audio=reqwest::blocking::multipart::Part::bytes(wav(&samples)).file_name("question.wav")
        .mime_str("audio/wav").map_err(|_|"Invalid audio format.")?;
    drop(samples);
    let form=reqwest::blocking::multipart::Form::new().part("file",audio)
        .text("language","en").text("temperature","0.0").text("temperature_inc","0.0")
        .text("response_format","json");
    let response=client(90)?.post(format!("{BASE}/inference")).multipart(form).send()
        .map_err(|_|"Local Whisper did not respond. Try Windows speech or type instead.")?;
    if cancelled.load(Ordering::Acquire){return Err("Listening cancelled.".into());}
    if !response.status().is_success(){return Err("Local Whisper rejected the recording.".into());}
    let mut raw=Vec::new();
    response.take(16385).read_to_end(&mut raw).map_err(|_|"Speech response was interrupted.")?;
    if raw.len()>16384{return Err("Local speech response was too large.".into());}
    if cancelled.load(Ordering::Acquire){return Err("Listening cancelled.".into());}
    parse_transcript(&raw)
}

#[tauri::command]
pub async fn classroom_whisper_status(window:tauri::WebviewWindow)->WhisperStatus{
    if window.label()!="main"{return WhisperStatus{available:false,message:"Operator window required.".into()};}
    match tauri::async_runtime::spawn_blocking(probe).await{
        Ok(Ok(()))=>WhisperStatus{available:true,message:"Local Whisper service responds. Confirm the approved offline model is loaded.".into()},
        Ok(Err(message))=>WhisperStatus{available:false,message},
        Err(_)=>WhisperStatus{available:false,message:"Local speech service check failed.".into()},
    }
}
#[cfg(test)]
mod tests{
    use super::*;
    #[test]fn canonical_wav_and_bounds(){
        let mut signal=vec![0;8000];for (i,s) in signal.iter_mut().enumerate(){*s=if i%2==0{1000}else{-1000};}
        assert!(validate_audio(&signal).is_ok());
        let data=wav(&signal);
        assert_eq!(&data[0..4],b"RIFF");assert_eq!(&data[8..12],b"WAVE");
        assert_eq!(&data[24..28],&16000u32.to_le_bytes());assert_eq!(&data[34..36],&16u16.to_le_bytes());
        assert_eq!(&data[40..44],&16000u32.to_le_bytes());assert_eq!(data.len(),16044);
        assert!(validate_audio(&vec![0;8000]).is_err());assert!(validate_audio(&vec![1000;MAX_SAMPLES+1]).is_err());
    }
    #[test]fn rejects_invalid_and_noise_only_transcripts(){
        assert_eq!(parse_transcript(br#"{"text":"  What  is voltage? "}"#).unwrap().text,"What is voltage?");
        for raw in [br#"{"text":"[MUSIC]"}"#.as_slice(),br#"{"text":"(silence)"}"#.as_slice(),br#"{"text":""}"#.as_slice(),b"bad".as_slice()]{assert!(parse_transcript(raw).is_err());}
    }
}
