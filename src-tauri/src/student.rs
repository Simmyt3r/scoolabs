//! Native-only student identity. No access to records through arbitrary name/class claims.
use crate::database::{check_token, db_error, hash_pin, record_from_row, valid_record, DbState, LabRecord, Sessions};
use argon2::{password_hash::{PasswordHash, PasswordVerifier}, Argon2};
use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use std::{collections::HashMap, sync::Mutex, time::{Duration, Instant}};
use tauri::State;
use uuid::Uuid;

pub struct StudentSessions(pub Mutex<HashMap<String, (String, Instant)>>);
pub struct LoginThrottle(pub Mutex<HashMap<String, (u32, Instant)>>);

#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct Enrolment {
    pub student_id: String,
    pub access_code: String,
}
#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct StudentSession {
    pub token: String,
    pub student_id: String,
    pub student_name: String,
    pub classroom: String,
}
#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct StudentAssignment {
    pub id: String,
    pub class_id: String,
    pub experiment_id: String,
    pub title: String,
    pub instructions: String,
    pub created_at: String,
}
fn guard_student(sessions: &State<'_, StudentSessions>, token: &str) -> Result<String,String> {
    let mut guard=sessions.0.lock().map_err(db_error)?;
    guard.retain(|_,(_,start)|start.elapsed() < Duration::from_secs(3*60*60));
    guard.get(token).map(|(id,_)|id.clone())
        .ok_or_else(||"Student session expired. Sign in again.".into())
}
fn rate_limit(throttle:&State<'_, LoginThrottle>,code:&str,success:bool)->Result<(),String> {
    let mut guard=throttle.0.lock().map_err(db_error)?;
    guard.retain(|_,(_,start)|start.elapsed() < Duration::from_secs(5*60));
    if success {guard.remove(code);return Ok(());}
    let entry=guard.entry(code.to_owned()).or_insert((0,Instant::now()));
    entry.0+=1;
    Ok(())
}
fn can_attempt(throttle:&State<'_, LoginThrottle>,code:&str)->Result<(),String>{
    let guard=throttle.0.lock().map_err(db_error)?;
    if let Some((failures,start))=guard.get(code) {
       if *failures>=5 && start.elapsed()<Duration::from_secs(5*60) {
           return Err("Too many incorrect attempts. Wait five minutes before retrying.".into())
       }
    }
    Ok(())
}
fn student_code()->String{
    Uuid::new_v4().simple().to_string().chars().take(10).collect::<String>().to_uppercase()
}
#[tauri::command]
pub fn teacher_enrol_student(
    db:State<'_,DbState>,teachers:State<'_,Sessions>,token:String,class_id:String,name:String,pin:String
)->Result<Enrolment,String>{
    check_token(&teachers,&token)?;
    if name.trim().is_empty() || name.len()>120 {return Err("Student name is required (maximum 120 characters).".into());}
    let hash=hash_pin(&pin)?;
    let id=Uuid::new_v4().to_string();
    let access_code=student_code();
    let mut conn=db.0.lock().map_err(db_error)?;
    let tx=conn.transaction().map_err(db_error)?;
    tx.execute("INSERT INTO students(id,class_id,name) VALUES(?1,?2,?3)",
       params![id,class_id,name.trim()]).map_err(db_error)?;
    tx.execute("INSERT INTO student_credentials(student_id,access_code,pin_hash) VALUES(?1,?2,?3)",
       params![id,access_code,hash]).map_err(db_error)?;
    tx.commit().map_err(db_error)?;
    Ok(Enrolment{student_id:id,access_code})
}
#[tauri::command]
pub fn teacher_reset_student_pin(
    db:State<'_,DbState>,teachers:State<'_,Sessions>,student_sessions:State<'_,StudentSessions>,
    token:String,student_id:String,new_pin:String
)->Result<Enrolment,String>{
    check_token(&teachers,&token)?;
    let hash=hash_pin(&new_pin)?;
    let conn=db.0.lock().map_err(db_error)?;
    let student_exists:i64=conn.query_row("SELECT COUNT(*) FROM students WHERE id=?1",
        params![student_id],|r|r.get(0)).map_err(db_error)?;
    if student_exists==0 {return Err("Unknown student account".into());}
    // Existing v0.3 roster entries did not have credentials. Issue one on first reset.
    let known:Option<String>=conn.query_row(
        "SELECT access_code FROM student_credentials WHERE student_id=?1",params![student_id],|r|r.get(0)
    ).optional().map_err(db_error)?;
    let access_code=known.unwrap_or_else(student_code);
    conn.execute(
        "INSERT INTO student_credentials(student_id,access_code,pin_hash) VALUES(?1,?2,?3)
         ON CONFLICT(student_id) DO UPDATE SET pin_hash=excluded.pin_hash",
        params![student_id,access_code,hash]
    ).map_err(db_error)?;
    student_sessions.0.lock().map_err(db_error)?.retain(|_,(id,_)|id!=&student_id);
    Ok(Enrolment{student_id,access_code})
}
#[tauri::command]
pub fn teacher_access_codes(
    db:State<'_,DbState>,teachers:State<'_,Sessions>,token:String
)->Result<Vec<Enrolment>,String>{
    check_token(&teachers,&token)?;
    let conn=db.0.lock().map_err(db_error)?;
    let mut stmt=conn.prepare("SELECT student_id,access_code FROM student_credentials").map_err(db_error)?;
    let rows=stmt.query_map([],|r|Ok(Enrolment{student_id:r.get(0)?,access_code:r.get(1)?})).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
#[tauri::command]
pub fn student_login(
    db:State<'_,DbState>,sessions:State<'_,StudentSessions>,throttle:State<'_,LoginThrottle>,
    access_code:String,pin:String
)->Result<StudentSession,String>{
    let code=access_code.trim().to_uppercase();
    if code.len()!=10 || !code.chars().all(|ch|ch.is_ascii_hexdigit()) {
        return Err("Enter the 10-character code provided by your teacher.".into());
    }
    can_attempt(&throttle,&code)?;
    let conn=db.0.lock().map_err(db_error)?;
    let details=conn.query_row(
        "SELECT s.id,s.name,c.name,sc.pin_hash FROM student_credentials sc
         JOIN students s ON s.id=sc.student_id JOIN classes c ON c.id=s.class_id
         WHERE sc.access_code=?1",params![code],
         |r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?,r.get::<_,String>(2)?,r.get::<_,String>(3)?)))
        .optional().map_err(db_error)?;
    let verified=details.as_ref().map(|(_,_,_,hash)|
        PasswordHash::new(hash).ok().map(|h|Argon2::default().verify_password(pin.as_bytes(),&h).is_ok()).unwrap_or(false)
    ).unwrap_or(false);
    if !verified {
        rate_limit(&throttle,&code,false)?;
        return Err("Invalid access code or PIN.".into());
    }
    rate_limit(&throttle,&code,true)?;
    let (id,name,classroom,_)=details.ok_or("Invalid credentials")?;
    let token=Uuid::new_v4().to_string();
    sessions.0.lock().map_err(db_error)?.insert(token.clone(),(id.clone(),Instant::now()));
    Ok(StudentSession{token,student_id:id,student_name:name,classroom})
}
#[tauri::command]
pub fn student_logout(sessions:State<'_,StudentSessions>,token:String)->Result<(),String>{
    sessions.0.lock().map_err(db_error)?.remove(&token);
    Ok(())
}
#[tauri::command]
pub fn student_records(
   db:State<'_,DbState>,sessions:State<'_,StudentSessions>,token:String
)->Result<Vec<LabRecord>,String>{
    let id=guard_student(&sessions,&token)?;
    let conn=db.0.lock().map_err(db_error)?;
    let query="SELECT r.id,r.timestamp,r.student,r.classroom,r.experiment_id,
       r.experiment_title,r.subject,r.settings,r.observation,r.conclusion,r.grade,r.feedback,r.assignment_id
       FROM notebook_records r JOIN student_record_links l ON l.record_id=r.id
       WHERE l.student_id=?1 ORDER BY r.timestamp DESC LIMIT 2000";
    let mut stmt=conn.prepare(&query).map_err(db_error)?;
    let rows=stmt.query_map(params![id],record_from_row).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
#[tauri::command]
pub fn student_assignments(
    db:State<'_,DbState>,sessions:State<'_,StudentSessions>,token:String
)->Result<Vec<StudentAssignment>,String>{
    let id=guard_student(&sessions,&token)?;
    let conn=db.0.lock().map_err(db_error)?;
    let mut stmt=conn.prepare(
      "SELECT a.id,a.class_id,a.experiment_id,a.title,a.instructions,a.created_at
       FROM assignments a JOIN students s ON s.class_id=a.class_id
       WHERE s.id=?1 ORDER BY a.created_at DESC"
    ).map_err(db_error)?;
    let rows=stmt.query_map(params![id],|r|Ok(StudentAssignment{
       id:r.get(0)?,class_id:r.get(1)?,experiment_id:r.get(2)?,
       title:r.get(3)?,instructions:r.get(4)?,created_at:r.get(5)?
    })).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
fn experiment_subject(id:&str)->Option<&'static str>{
    match id {
      "titration"|"ph-indicators"|"separation"=>Some("chemistry"),
      "ohms-law"|"pendulum"|"convex-lens"=>Some("physics"),
      "microscopy"|"osmosis"|"transpiration"=>Some("biology"),
      "germination"|"soil"|"nutrients"=>Some("agriculture"),
      _=>None,
    }
}
#[tauri::command]
pub fn student_submit_record(
    db:State<'_,DbState>,sessions:State<'_,StudentSessions>,token:String,mut record:LabRecord
)->Result<(),String>{
    let id=guard_student(&sessions,&token)?;
    let expected=experiment_subject(&record.experiment_id).ok_or("Unknown laboratory experiment")?;
    if record.subject!=expected{return Err("Experiment and subject do not match".into());}
    let mut conn=db.0.lock().map_err(db_error)?;
    let (name,classroom)=conn.query_row(
       "SELECT s.name,c.name FROM students s JOIN classes c ON c.id=s.class_id WHERE s.id=?1",
       params![id],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?)))
       .map_err(db_error)?;
    record.id=Uuid::new_v4().to_string();
    record.timestamp=conn.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%SZ','now')",[],|r|r.get(0)).map_err(db_error)?;
    record.student=name;
    record.classroom=classroom;
    record.grade=None;
    record.feedback=None;
    valid_record(&record)?;
    let tx=conn.transaction().map_err(db_error)?;
    if let Some(ref assignment_id)=record.assignment_id {
        let eligible:i64=tx.query_row(
            "SELECT COUNT(*) FROM assignments a JOIN students s ON a.class_id=s.class_id
             WHERE a.id=?1 AND s.id=?2 AND a.experiment_id=?3",
            params![assignment_id,id,record.experiment_id],|r|r.get(0)
        ).map_err(db_error)?;
        if eligible!=1 {return Err("This assignment is not assigned to your class or experiment.".into());}
    }
    tx.execute("INSERT INTO notebook_records
       (id,timestamp,student,classroom,experiment_id,experiment_title,subject,settings,observation,conclusion,assignment_id)
       VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
       params![record.id,record.timestamp,record.student,record.classroom,
         record.experiment_id,record.experiment_title,record.subject,record.settings,record.observation,record.conclusion,record.assignment_id]
    ).map_err(db_error)?;
    tx.execute("INSERT INTO student_record_links(record_id,student_id) VALUES(?1,?2)",
        params![record.id,id]).map_err(db_error)?;
    if let Some(ref assignment_id)=record.assignment_id {
        tx.execute(
            "INSERT INTO assignment_submissions(assignment_id,student_id,record_id) VALUES(?1,?2,?3)",
            params![assignment_id,id,record.id],
        ).map_err(|_|"This assignment already has a submission. Use Personal practice for additional observations.".to_owned())?;
    }
    tx.commit().map_err(db_error)?;
    Ok(())
}
#[cfg(test)]
mod tests {
  use super::*;
  #[test]
  fn codes_have_valid_format_and_subjects_are_locked(){
    let c=student_code();
    assert_eq!(c.len(),10);
    assert!(c.chars().all(|x|x.is_ascii_hexdigit()));
    assert_eq!(experiment_subject("titration"),Some("chemistry"));
    assert_eq!(experiment_subject("convex-lens"),Some("physics"));
    assert_eq!(experiment_subject("transpiration"),Some("biology"));
    assert_eq!(experiment_subject("nutrients"),Some("agriculture"));
    assert_eq!(experiment_subject("nonexistent"),None);
  }
}
