use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    sync::Mutex,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

pub struct DbState(pub Mutex<Connection>);
pub struct Sessions(pub Mutex<HashMap<String, (String, Instant)>>);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabRecord {
    pub id: String,
    pub timestamp: String,
    pub student: String,
    pub classroom: String,
    pub experiment_id: String,
    pub experiment_title: String,
    pub subject: String,
    pub settings: String,
    pub observation: String,
    pub conclusion: String,
    #[serde(default)]
    pub grade: Option<i64>,
    #[serde(default)]
    pub feedback: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Profile {
    pub name: String,
    pub classroom: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TeacherAccount {
    id: String,
    name: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Classroom {
    id: String,
    name: String,
    level: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Student {
    id: String,
    class_id: String,
    name: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Assignment {
    id: String,
    class_id: String,
    experiment_id: String,
    title: String,
    instructions: String,
    created_at: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TeacherSession {
    token: String,
    teacher_name: String,
}
#[derive(Serialize)]
pub struct TeacherSnapshot {
    pub classes: Vec<Classroom>,
    pub students: Vec<Student>,
    pub assignments: Vec<Assignment>,
    pub records: Vec<LabRecord>,
}

fn db_error(error: impl std::fmt::Display) -> String {
    format!("Local database error: {error}")
}
fn connection(state: &State<'_, DbState>) -> Result<std::sync::MutexGuard<'_, Connection>, String> {
    state.0.lock().map_err(|_| "Unable to access the local database".to_owned())
}
fn ensure_field(value: &str, label: &str, max_length: usize) -> Result<(), String> {
    if value.trim().is_empty() || value.len() > max_length {
        Err(format!("{label} must contain 1–{max_length} characters"))
    } else {
        Ok(())
    }
}
fn create_tables(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         CREATE TABLE IF NOT EXISTS app_settings (
           key TEXT PRIMARY KEY, value TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS notebook_records (
           id TEXT PRIMARY KEY, timestamp TEXT NOT NULL,
           student TEXT NOT NULL, classroom TEXT NOT NULL,
           experiment_id TEXT NOT NULL, experiment_title TEXT NOT NULL,
           subject TEXT NOT NULL, settings TEXT NOT NULL,
           observation TEXT NOT NULL, conclusion TEXT NOT NULL,
           grade INTEGER CHECK(grade BETWEEN 0 AND 100), feedback TEXT
         );
         CREATE INDEX IF NOT EXISTS records_by_student
           ON notebook_records(student, classroom, timestamp);
         CREATE TABLE IF NOT EXISTS teachers (
           id TEXT PRIMARY KEY, name TEXT NOT NULL, pin_hash TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS classes (
           id TEXT PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
           level TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS students (
           id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id),
           name TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS assignments (
           id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id),
           experiment_id TEXT NOT NULL, title TEXT NOT NULL,
           instructions TEXT NOT NULL, created_at TEXT NOT NULL
         );"
    )
}
pub fn initialize(handle: &AppHandle) -> Result<DbState, Box<dyn std::error::Error>> {
    let dir = handle.path().app_data_dir()?;
    fs::create_dir_all(&dir)?;
    let conn = Connection::open(dir.join("scoolabs.sqlite3"))?;
    conn.busy_timeout(Duration::from_secs(5))?;
    conn.execute_batch("PRAGMA journal_mode = WAL;")?;
    create_tables(&conn)?;
    Ok(DbState(Mutex::new(conn)))
}
fn record_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<LabRecord> {
    Ok(LabRecord {
        id: row.get(0)?, timestamp: row.get(1)?, student: row.get(2)?,
        classroom: row.get(3)?, experiment_id: row.get(4)?,
        experiment_title: row.get(5)?, subject: row.get(6)?,
        settings: row.get(7)?, observation: row.get(8)?,
        conclusion: row.get(9)?, grade: row.get(10)?, feedback: row.get(11)?,
    })
}
const RECORD_COLUMNS: &str = "id,timestamp,student,classroom,experiment_id,experiment_title,subject,settings,observation,conclusion,grade,feedback";
fn valid_record(r: &LabRecord) -> Result<(), String> {
    ensure_field(&r.id, "Record ID", 100)?;
    ensure_field(&r.student, "Student name", 120)?;
    ensure_field(&r.classroom, "Class", 100)?;
    ensure_field(&r.experiment_id, "Experiment", 80)?;
    ensure_field(&r.experiment_title, "Experiment title", 150)?;
    ensure_field(&r.timestamp, "Date", 80)?;
    if !["chemistry", "physics", "biology", "agriculture"].contains(&r.subject.as_str()) {
        return Err("Unsupported subject".into());
    }
    if r.settings.len() > 8000 || r.observation.len() > 8000 || r.conclusion.len() > 8000 {
        return Err("Experiment note is too long".into());
    }
    Ok(())
}
fn insert_record(conn: &Connection, r: &LabRecord) -> rusqlite::Result<usize> {
    // Grade and feedback are deliberately not taken from student-controlled input.
    conn.execute(
        "INSERT OR IGNORE INTO notebook_records
        (id,timestamp,student,classroom,experiment_id,experiment_title,subject,settings,observation,conclusion)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![r.id,r.timestamp,r.student,r.classroom,r.experiment_id,r.experiment_title,
                r.subject,r.settings,r.observation,r.conclusion],
    )
}
#[tauri::command]
pub fn get_profile(db: State<'_, DbState>) -> Result<Profile, String> {
    let conn = connection(&db)?;
    Ok(Profile {
        name: conn.query_row("SELECT value FROM app_settings WHERE key='student_name'", [], |r|r.get(0))
            .optional().map_err(db_error)?.unwrap_or_default(),
        classroom: conn.query_row("SELECT value FROM app_settings WHERE key='student_class'", [], |r|r.get(0))
            .optional().map_err(db_error)?.unwrap_or_default(),
    })
}
#[tauri::command]
pub fn set_profile(db: State<'_, DbState>, profile: Profile) -> Result<(), String> {
    if profile.name.len() > 120 || profile.classroom.len() > 100 {
        return Err("Student profile is too long".into());
    }
    let mut conn = connection(&db)?;
    let tx = conn.transaction().map_err(db_error)?;
    tx.execute("INSERT INTO app_settings (key,value) VALUES ('student_name',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", params![profile.name]).map_err(db_error)?;
    tx.execute("INSERT INTO app_settings (key,value) VALUES ('student_class',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", params![profile.classroom]).map_err(db_error)?;
    tx.commit().map_err(db_error)
}
#[tauri::command]
pub fn list_lab_records(db: State<'_, DbState>, student: String, classroom: String) -> Result<Vec<LabRecord>, String> {
    if student.trim().is_empty() || classroom.trim().is_empty() {return Ok(vec![]);}
    let conn = connection(&db)?;
    let query = format!("SELECT {RECORD_COLUMNS} FROM notebook_records WHERE student = ?1 COLLATE NOCASE AND classroom = ?2 COLLATE NOCASE ORDER BY timestamp DESC LIMIT 2000");
    let mut stmt = conn.prepare(&query).map_err(db_error)?;
    let rows = stmt.query_map(params![student.trim(),classroom.trim()],record_from_row).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
#[tauri::command]
pub fn save_lab_record(db: State<'_, DbState>, record: LabRecord) -> Result<(), String> {
    valid_record(&record)?;
    let conn = connection(&db)?;
    insert_record(&conn, &record).map_err(db_error)?;
    Ok(())
}
#[tauri::command]
pub fn import_legacy_records(db: State<'_, DbState>, records: Vec<LabRecord>) -> Result<usize, String> {
    if records.len() > 500 {return Err("Too many legacy notebook records".into());}
    for record in &records {valid_record(record)?;}
    let mut conn = connection(&db)?;
    let tx = conn.transaction().map_err(db_error)?;
    let mut inserted = 0;
    for record in &records {inserted += insert_record(&tx,record).map_err(db_error)?;}
    tx.commit().map_err(db_error)?;
    Ok(inserted)
}
#[tauri::command]
pub fn teacher_accounts(db: State<'_, DbState>) -> Result<Vec<TeacherAccount>,String> {
    let conn=connection(&db)?;
    let mut stmt=conn.prepare("SELECT id,name FROM teachers ORDER BY name").map_err(db_error)?;
    let rows=stmt.query_map([],|r|Ok(TeacherAccount{id:r.get(0)?,name:r.get(1)?})).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
fn hash_pin(pin: &str) -> Result<String,String> {
    if pin.len() < 6 || pin.len() > 12 || !pin.chars().all(|c| c.is_ascii_digit()) {
        return Err("PIN must be 6–12 digits".into());
    }
    let random_bytes = Uuid::new_v4();
    let salt=SaltString::encode_b64(random_bytes.as_bytes()).map_err(db_error)?;
    Argon2::default().hash_password(pin.as_bytes(), &salt).map(|p|p.to_string()).map_err(db_error)
}
#[tauri::command]
pub fn setup_teacher(db: State<'_, DbState>, name:String, pin:String) -> Result<(),String> {
    ensure_field(&name,"Teacher name",120)?;
    let hash=hash_pin(&pin)?;
    let conn=connection(&db)?;
    let count:i64=conn.query_row("SELECT COUNT(*) FROM teachers",[],|r|r.get(0)).map_err(db_error)?;
    if count!=0 {return Err("Initial teacher setup has already been completed".into());}
    conn.execute("INSERT INTO teachers(id,name,pin_hash) VALUES(?1,?2,?3)",params![Uuid::new_v4().to_string(),name.trim(),hash]).map_err(db_error)?;
    Ok(())
}
#[tauri::command]
pub fn teacher_login(db: State<'_, DbState>, sessions: State<'_, Sessions>, teacher_id:String, pin:String) -> Result<TeacherSession,String> {
    let conn=connection(&db)?;
    let account=conn.query_row("SELECT name,pin_hash FROM teachers WHERE id=?1",params![teacher_id],
        |r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?))).optional().map_err(db_error)?;
    let (name,hash)=account.ok_or_else(||"Invalid teacher credentials".to_string())?;
    let parsed=PasswordHash::new(&hash).map_err(db_error)?;
    Argon2::default().verify_password(pin.as_bytes(),&parsed).map_err(|_|"Invalid teacher credentials".to_string())?;
    let token=Uuid::new_v4().to_string();
    sessions.0.lock().map_err(db_error)?.insert(token.clone(),(teacher_id,Instant::now()));
    Ok(TeacherSession{token,teacher_name:name})
}
fn check_token(sessions:&State<'_, Sessions>,token:&str)->Result<String,String>{
    let mut guard=sessions.0.lock().map_err(db_error)?;
    guard.retain(|_, (_,time)|time.elapsed()<Duration::from_secs(8*60*60));
    guard.get(token).map(|(id,_)|id.clone()).ok_or_else(||"Teacher session expired. Sign in again.".into())
}
#[tauri::command]
pub fn teacher_logout(sessions:State<'_,Sessions>,token:String)->Result<(),String>{
    sessions.0.lock().map_err(db_error)?.remove(&token);
    Ok(())
}
#[tauri::command]
pub fn add_teacher(db:State<'_,DbState>,sessions:State<'_,Sessions>,token:String,name:String,pin:String)->Result<(),String>{
    check_token(&sessions,&token)?;
    ensure_field(&name,"Teacher name",120)?;
    let hash=hash_pin(&pin)?;
    let conn=connection(&db)?;
    conn.execute("INSERT INTO teachers(id,name,pin_hash) VALUES(?1,?2,?3)",params![Uuid::new_v4().to_string(),name.trim(),hash]).map_err(db_error)?;
    Ok(())
}
#[tauri::command]
pub fn class_catalog(db:State<'_,DbState>)->Result<Vec<Classroom>,String>{
    let conn=connection(&db)?;
    let mut stmt=conn.prepare("SELECT id,name,level FROM classes ORDER BY name").map_err(db_error)?;
    let rows=stmt.query_map([],|r|Ok(Classroom{id:r.get(0)?,name:r.get(1)?,level:r.get(2)?})).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
#[tauri::command]
pub fn create_class(db:State<'_,DbState>,sessions:State<'_,Sessions>,token:String,name:String,level:String)->Result<(),String>{
    check_token(&sessions,&token)?;
    ensure_field(&name,"Class name",100)?;
    ensure_field(&level,"Level",50)?;
    let conn=connection(&db)?;
    conn.execute("INSERT INTO classes(id,name,level) VALUES(?1,?2,?3)",params![Uuid::new_v4().to_string(),name.trim(),level.trim()]).map_err(|_|"Class name already exists or is invalid".to_string())?;
    Ok(())
}
#[tauri::command]
pub fn enroll_student(db:State<'_,DbState>,sessions:State<'_,Sessions>,token:String,class_id:String,name:String)->Result<(),String>{
    check_token(&sessions,&token)?;
    ensure_field(&name,"Student name",120)?;
    let conn=connection(&db)?;
    conn.execute("INSERT INTO students(id,class_id,name) VALUES(?1,?2,?3)",params![Uuid::new_v4().to_string(),class_id,name.trim()]).map_err(db_error)?;
    Ok(())
}
#[tauri::command]
pub fn create_assignment(db:State<'_,DbState>,sessions:State<'_,Sessions>,token:String,class_id:String,experiment_id:String,title:String,instructions:String)->Result<(),String>{
    check_token(&sessions,&token)?;
    ensure_field(&experiment_id,"Experiment",80)?;
    ensure_field(&title,"Assignment title",150)?;
    if instructions.len()>5000 {return Err("Instructions are too long".into());}
    let conn=connection(&db)?;
    conn.execute("INSERT INTO assignments(id,class_id,experiment_id,title,instructions,created_at) VALUES (?1,?2,?3,?4,?5,datetime('now'))",
       params![Uuid::new_v4().to_string(),class_id,experiment_id,title.trim(),instructions.trim()]).map_err(db_error)?;
    Ok(())
}
#[tauri::command]
pub fn class_assignments(db:State<'_,DbState>,classroom:String)->Result<Vec<Assignment>,String>{
    let conn=connection(&db)?;
    let mut stmt=conn.prepare("SELECT a.id,a.class_id,a.experiment_id,a.title,a.instructions,a.created_at FROM assignments a JOIN classes c ON a.class_id=c.id WHERE c.name=?1 COLLATE NOCASE ORDER BY a.created_at DESC").map_err(db_error)?;
    let rows=stmt.query_map(params![classroom],|r| Ok(Assignment{id:r.get(0)?,class_id:r.get(1)?,experiment_id:r.get(2)?,title:r.get(3)?,instructions:r.get(4)?,created_at:r.get(5)?})).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
#[tauri::command]
pub fn grade_record(db:State<'_,DbState>,sessions:State<'_,Sessions>,token:String,record_id:String,score:i64,feedback:String)->Result<(),String>{
    check_token(&sessions,&token)?;
    if !(0..=100).contains(&score) {return Err("Score must be between 0 and 100".into());}
    if feedback.len()>2000 {return Err("Feedback too long".into());}
    let conn=connection(&db)?;
    let updated=conn.execute("UPDATE notebook_records SET grade=?1,feedback=?2 WHERE id=?3",params![score,feedback.trim(),record_id]).map_err(db_error)?;
    if updated==0 {return Err("Record not found".into());}
    Ok(())
}
#[tauri::command]
pub fn teacher_snapshot(db:State<'_,DbState>,sessions:State<'_,Sessions>,token:String)->Result<TeacherSnapshot,String>{
    check_token(&sessions,&token)?;
    let conn=connection(&db)?;
    let classes={
        let mut q=conn.prepare("SELECT id,name,level FROM classes ORDER BY name").map_err(db_error)?;
        let rows=q.query_map([],|r|Ok(Classroom{id:r.get(0)?,name:r.get(1)?,level:r.get(2)?})).map_err(db_error)?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)?
    };
    let students={
        let mut q=conn.prepare("SELECT id,class_id,name FROM students ORDER BY name").map_err(db_error)?;
        let rows=q.query_map([],|r|Ok(Student{id:r.get(0)?,class_id:r.get(1)?,name:r.get(2)?})).map_err(db_error)?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)?
    };
    let assignments={
        let mut q=conn.prepare("SELECT id,class_id,experiment_id,title,instructions,created_at FROM assignments ORDER BY created_at DESC").map_err(db_error)?;
        let rows=q.query_map([],|r|Ok(Assignment{id:r.get(0)?,class_id:r.get(1)?,experiment_id:r.get(2)?,title:r.get(3)?,instructions:r.get(4)?,created_at:r.get(5)?})).map_err(db_error)?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)?
    };
    let records={
        let qstring=format!("SELECT {RECORD_COLUMNS} FROM notebook_records ORDER BY timestamp DESC LIMIT 3000");
        let mut q=conn.prepare(&qstring).map_err(db_error)?;
        let rows=q.query_map([],record_from_row).map_err(db_error)?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)?
    };
    Ok(TeacherSnapshot{classes,students,assignments,records})
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn schema_and_foreign_keys() {
        let conn=Connection::open_in_memory().unwrap();
        create_tables(&conn).unwrap();
        conn.execute("INSERT INTO classes(id,name,level) VALUES('a','SS2A','SS2')",[]).unwrap();
        let duplicate=conn.execute("INSERT INTO classes(id,name,level) VALUES('b','ss2a','SS2')",[]);
        assert!(duplicate.is_err());
    }
    #[test]
    fn pin_hashes_do_not_expose_pin() {
        let hash=hash_pin("938271").unwrap();
        assert!(!hash.contains("938271"));
        let parsed=PasswordHash::new(&hash).unwrap();
        assert!(Argon2::default().verify_password(b"938271",&parsed).is_ok());
        assert!(Argon2::default().verify_password(b"938272",&parsed).is_err());
        assert!(hash_pin("123").is_err());
    }
    #[test]
    fn record_import_is_idempotent_and_grades_not_trusted() {
        let conn=Connection::open_in_memory().unwrap();
        create_tables(&conn).unwrap();
        let r=LabRecord{id:"a".into(),timestamp:"2026-10-11T00:00:00Z".into(),
        student:"Amaka".into(),classroom:"SS2A".into(),experiment_id:"titration".into(),
        experiment_title:"Titration".into(),subject:"chemistry".into(),settings:"x".into(),
        observation:"y".into(),conclusion:"z".into(),grade:Some(100),feedback:Some("fake".into())};
        assert_eq!(insert_record(&conn,&r).unwrap(),1);
        assert_eq!(insert_record(&conn,&r).unwrap(),0);
        let grade:Option<i64>=conn.query_row("SELECT grade FROM notebook_records",[],|r|r.get(0)).unwrap();
        assert_eq!(grade,None);
    }
}
