//! Explicit, short offline Windows dictation sessions. No audio files, network
//! speech APIs, user-controlled shell arguments, or background listening.
use serde::{Deserialize, Serialize};
use std::{collections::VecDeque, sync::{atomic::{AtomicBool, Ordering}, Arc, Mutex}};

#[derive(Default)]
struct VoiceState {
    active: Option<(String, Arc<AtomicBool>)>,
    cancelled: VecDeque<String>,
}
#[derive(Default, Clone)]
pub struct ClassroomVoice(Arc<Mutex<VoiceState>>);

struct SessionGuard {
    state: ClassroomVoice,
    id: String,
    cancelled: Arc<AtomicBool>,
}
impl Drop for SessionGuard {
    fn drop(&mut self) {
        if let Ok(mut state) = self.state.0.lock() {
            if state.active.as_ref().is_some_and(|(id, _)| id == &self.id) {
                state.active = None;
            }
        }
    }
}
fn valid_id(id: &str) -> bool {
    id.len() <= 64 && !id.is_empty() && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
}
fn start_session(state: &ClassroomVoice, id: String) -> Result<SessionGuard, String> {
    if !valid_id(&id) { return Err("Invalid voice session.".into()); }
    let mut inner = state.0.lock().map_err(|_| "Voice service is unavailable.")?;
    if inner.cancelled.iter().any(|entry| entry == &id) {
        return Err("Listening cancelled.".into());
    }
    if inner.active.is_some() { return Err("A listening session is already active.".into()); }
    let cancelled = Arc::new(AtomicBool::new(false));
    inner.active = Some((id.clone(), cancelled.clone()));
    Ok(SessionGuard {state: state.clone(), id, cancelled})
}
fn cancel_session(state: &ClassroomVoice, id: &str) {
    if !valid_id(id) { return; }
    if let Ok(mut inner) = state.0.lock() {
        if let Some((active_id, cancelled)) = &inner.active {
            if active_id == id { cancelled.store(true, Ordering::Release); }
        }
        if !inner.cancelled.iter().any(|entry| entry == id) {
            inner.cancelled.push_back(id.to_owned());
            if inner.cancelled.len() > 32 { inner.cancelled.pop_front(); }
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VoiceResult {
    text: String,
    confidence: f32,
}
fn parse_result(raw: &[u8]) -> Result<VoiceResult, String> {
    let text = std::str::from_utf8(raw).map_err(|_| "The recognizer returned invalid text.")?;
    let mut value: VoiceResult = serde_json::from_str(text.trim().trim_start_matches('\u{feff}'))
        .map_err(|_| "No usable offline speech result. Please type the question.")?;
    value.text = value.text.split_whitespace().collect::<Vec<_>>().join(" ");
    if value.text.is_empty() || !value.confidence.is_finite() || !(0.55..=1.0).contains(&value.confidence) {
        return Err("Speech was unclear. Try again or type the question.".into());
    }
    value.text = value.text.chars().take(300).collect();
    Ok(value)
}

#[cfg(target_os = "windows")]
fn run_recognition(cancelled: &AtomicBool) -> Result<VoiceResult, String> {
    use std::{process::{Command, Stdio}, time::{Duration, Instant}, thread, os::windows::process::CommandExt};
    // Windows PowerShell uses the in-process System.Speech engine and an installed
    // English recognizer, not Windows online/cloud dictation. No dynamic script input.
    const SCRIPT: &str = r#"
$ErrorActionPreference='Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.Speech
$choice = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() |
  Where-Object { $_.Culture.TwoLetterISOLanguageName -eq 'en' } | Select-Object -First 1
if (-not $choice) { exit 2 }
$engine = [System.Speech.Recognition.SpeechRecognitionEngine]::new($choice.Id)
try {
  $engine.LoadGrammar(([System.Speech.Recognition.DictationGrammar]::new()))
  $engine.SetInputToDefaultAudioDevice()
  $engine.InitialSilenceTimeout=[TimeSpan]::FromSeconds(5)
  $engine.EndSilenceTimeout=[TimeSpan]::FromMilliseconds(1000)
  $result=$engine.Recognize([TimeSpan]::FromSeconds(5))
  if (-not $result) { exit 3 }
  @{text=$result.Text;confidence=$result.Confidence} | ConvertTo-Json -Compress
} finally { $engine.Dispose() }
"#;
    let root = std::env::var_os("SystemRoot").ok_or("Windows speech services are unavailable.")?;
    let exe = std::path::PathBuf::from(root).join("System32").join("WindowsPowerShell").join("v1.0").join("powershell.exe");
    if cancelled.load(Ordering::Acquire) { return Err("Listening cancelled.".into()); }
    let mut process = Command::new(exe)
        .args(["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", SCRIPT])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::null())
        .spawn().map_err(|_| "Windows offline speech recognition is unavailable.")?;
    let deadline = Instant::now() + Duration::from_secs(18);
    loop {
        if cancelled.load(Ordering::Acquire) || Instant::now() >= deadline {
            let _ = process.kill();
            let _ = process.wait();
            return Err(if cancelled.load(Ordering::Acquire) {"Listening cancelled."} else {"Listening timed out. Please try again or type."}.into());
        }
        match process.try_wait() {
            Ok(Some(status)) => {
                let output = process.wait_with_output().map_err(|_| "Unable to read speech recognition output.")?;
                if cancelled.load(Ordering::Acquire) {return Err("Listening cancelled.".into());}
                if !status.success() {
                    return Err(match status.code() {
                        Some(2) => "No local English speech recognizer is installed. Install a Windows offline speech language or type the question.",
                        Some(3) => "No speech detected. Please try again or type.",
                        _ => "The offline recognizer or microphone is unavailable. Please type the question.",
                    }.into());
                }
                return parse_result(&output.stdout);
            }
            Ok(None) => thread::sleep(Duration::from_millis(100)),
            Err(_) => {
                let _ = process.kill();
                let _ = process.wait();
                return Err("Unable to use the local recognizer. Please type the question.".into());
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn run_recognition(_: &AtomicBool) -> Result<VoiceResult, String> {
    Err("Offline microphone recognition is available only in the Windows desktop app. Please type the question.".into())
}

#[tauri::command]
pub async fn recognize_class_question(window:tauri::WebviewWindow,state: tauri::State<'_, ClassroomVoice>, request_id: String) -> Result<VoiceResult, String> {
    if window.label()!="main"{return Err("Operator window required.".into());}
    let guard = start_session(state.inner(), request_id)?;
    tauri::async_runtime::spawn_blocking(move || {
        run_recognition(&guard.cancelled)
    }).await.map_err(|_| "Unable to run offline speech recognition.")?
}

#[tauri::command]
pub fn cancel_class_question(window:tauri::WebviewWindow,state: tauri::State<'_, ClassroomVoice>, request_id: String) {
    if window.label()!="main"{return;}
    cancel_session(state.inner(), &request_id);
}

#[tauri::command]
pub async fn transcribe_class_question(window:tauri::WebviewWindow,state:tauri::State<'_,ClassroomVoice>,request_id:String,samples:Vec<i16>)->Result<crate::classroom_whisper::WhisperResult,String>{
    if window.label()!="main"{return Err("Operator window required.".into());}
    let guard=start_session(state.inner(),request_id)?;
    tauri::async_runtime::spawn_blocking(move||crate::classroom_whisper::transcribe(samples,&guard.cancelled))
        .await.map_err(|_|"Unable to transcribe the local recording.")?
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_and_bounds_transcript() {
        let result = parse_result(br#"{"text":"  What   is a cell? ","confidence":0.87}"#).unwrap();
        assert_eq!(result.text,"What is a cell?");
        assert!(parse_result(br#"{"text":"question","confidence":0.3}"#).is_err());
        assert!(parse_result(br#"{"text":"","confidence":0.9}"#).is_err());
        assert!(parse_result(b"bad output").is_err());
        let raw=serde_json::json!({"text":"a".repeat(400),"confidence":0.8}).to_string();
        assert_eq!(parse_result(raw.as_bytes()).unwrap().text.chars().count(),300);
    }
    #[test]
    fn cancellation_is_scoped_and_prevents_start_after_cancel() {
        let state=ClassroomVoice::default();
        cancel_session(&state,"early");
        assert!(start_session(&state,"early".to_owned()).is_err());
        {
            let guard=start_session(&state,"first".to_owned()).unwrap();
            assert!(start_session(&state,"second".to_owned()).is_err());
            cancel_session(&state,"other");
            assert!(!guard.cancelled.load(Ordering::Acquire));
            cancel_session(&state,"first");
            assert!(guard.cancelled.load(Ordering::Acquire));
        }
        assert!(start_session(&state,"second".to_owned()).is_ok());
    }
}
