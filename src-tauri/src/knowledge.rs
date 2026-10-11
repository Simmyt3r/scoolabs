//! Formative self-check. Answer keys are verified natively; never counted as teacher grades.
use crate::database::{check_token,db_error,DbState,Sessions};
use crate::student::{guard_student,StudentSessions};
use rusqlite::{params,Connection};
use serde::Serialize;
use tauri::State;

#[derive(Serialize,Debug)]
#[serde(rename_all="camelCase")]
pub struct KnowledgeResult {
    experiment_id:String,
    first_choice:i64,
    second_choice:i64,
    correct:i64,
    updated_at:String,
}
#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct TeacherKnowledgeResult {
    student_id:String,
    student_name:String,
    classroom:String,
    experiment_id:String,
    first_choice:i64,
    second_choice:i64,
    correct:i64,
    updated_at:String,
}
fn answers_for(experiment_id:&str)->Option<[i64;2]>{
    match experiment_id {
        "titration" => Some([0,1]),
        "separation" => Some([2,0]),
        "ph-indicators" => Some([1,0]),
        "ohms-law" => Some([2,0]),
        "pendulum" => Some([1,2]),
        "convex-lens" => Some([0,1]),
        "microscopy" => Some([2,0]),
        "osmosis" => Some([1,2]),
        "transpiration" => Some([0,1]),
        "germination" => Some([2,0]),
        "soil" => Some([1,2]),
        "nutrients" => Some([1,0]),
        _=>None,
    }
}
fn check_answers(experiment_id:&str,choices:&[i64])->Result<i64,String>{
    let expected=answers_for(experiment_id).ok_or("Unknown experiment for knowledge check")?;
    if choices.len()!=2 || choices.iter().any(|v|!(0..=2).contains(v)) {
        return Err("Select an answer for both questions before submitting.".into());
    }
    Ok(choices.iter().zip(expected).filter(|(answer,key)|**answer==*key).count() as i64)
}
fn submit_to_db(conn:&Connection,student_id:&str,experiment_id:&str,answers:&[i64])->Result<KnowledgeResult,String>{
    let correct=check_answers(experiment_id,answers)?;
    let valid_student:i64=conn.query_row("SELECT COUNT(*) FROM students WHERE id=?1",params![student_id],|r|r.get(0)).map_err(db_error)?;
    if valid_student!=1{return Err("Student account not found.".into());}
    conn.execute(
        "INSERT INTO knowledge_checks(student_id,experiment_id,first_choice,second_choice,correct,updated_at)
         VALUES(?1,?2,?3,?4,?5,strftime('%Y-%m-%dT%H:%M:%SZ','now'))
         ON CONFLICT(student_id,experiment_id) DO UPDATE SET
           first_choice=excluded.first_choice,second_choice=excluded.second_choice,
           correct=excluded.correct,updated_at=excluded.updated_at",
        params![student_id,experiment_id,answers[0],answers[1],correct]
    ).map_err(db_error)?;
    conn.query_row("SELECT experiment_id,first_choice,second_choice,correct,updated_at
                    FROM knowledge_checks WHERE student_id=?1 AND experiment_id=?2",
                   params![student_id,experiment_id],
                   |r|Ok(KnowledgeResult{experiment_id:r.get(0)?,first_choice:r.get(1)?,second_choice:r.get(2)?,correct:r.get(3)?,updated_at:r.get(4)?})
    ).map_err(db_error)
}
#[tauri::command]
pub fn submit_knowledge_check(
    db:State<'_,DbState>,sessions:State<'_,StudentSessions>,token:String,experiment_id:String,answers:Vec<i64>
)->Result<KnowledgeResult,String>{
    let student_id=guard_student(&sessions,&token)?;
    let conn=db.0.lock().map_err(db_error)?;
    submit_to_db(&conn,&student_id,&experiment_id,&answers)
}
#[tauri::command]
pub fn student_knowledge_results(
    db:State<'_,DbState>,sessions:State<'_,StudentSessions>,token:String
)->Result<Vec<KnowledgeResult>,String>{
    let student_id=guard_student(&sessions,&token)?;
    let conn=db.0.lock().map_err(db_error)?;
    let mut stmt=conn.prepare(
       "SELECT experiment_id,first_choice,second_choice,correct,updated_at
        FROM knowledge_checks WHERE student_id=?1 ORDER BY updated_at DESC,experiment_id"
    ).map_err(db_error)?;
    let rows=stmt.query_map(params![student_id],|r|Ok(KnowledgeResult{
        experiment_id:r.get(0)?,first_choice:r.get(1)?,second_choice:r.get(2)?,correct:r.get(3)?,updated_at:r.get(4)?
    })).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
#[tauri::command]
pub fn teacher_knowledge_results(
    db:State<'_,DbState>,sessions:State<'_,Sessions>,token:String
)->Result<Vec<TeacherKnowledgeResult>,String>{
    check_token(&sessions,&token)?;
    let conn=db.0.lock().map_err(db_error)?;
    let mut stmt=conn.prepare(
      "SELECT k.student_id,s.name,c.name,k.experiment_id,k.first_choice,k.second_choice,k.correct,k.updated_at
       FROM knowledge_checks k JOIN students s ON s.id=k.student_id JOIN classes c ON c.id=s.class_id
       ORDER BY c.name COLLATE NOCASE,s.name COLLATE NOCASE,k.experiment_id LIMIT 10000"
    ).map_err(db_error)?;
    let rows=stmt.query_map([],|r|Ok(TeacherKnowledgeResult{
        student_id:r.get(0)?,student_name:r.get(1)?,classroom:r.get(2)?,experiment_id:r.get(3)?,
        first_choice:r.get(4)?,second_choice:r.get(5)?,correct:r.get(6)?,updated_at:r.get(7)?
    })).map_err(db_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(db_error)
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::create_tables;
    #[test]
    fn marks_only_known_experiments_and_two_legal_answers(){
        for id in ["titration","separation","ph-indicators","ohms-law","pendulum","convex-lens","microscopy","osmosis","transpiration","germination","soil","nutrients"]{
            let keys=answers_for(id).unwrap();
            assert_eq!(check_answers(id,&keys).unwrap(),2);
            assert_eq!(check_answers(id,&[(keys[0]+1)%3,(keys[1]+1)%3]).unwrap(),0);
        }
        assert!(check_answers("other",&[0,1]).is_err());
        assert!(check_answers("titration",&[0]).is_err());
        assert!(check_answers("titration",&[0,3]).is_err());
    }
    #[test]
    fn different_students_are_isolated_and_retries_replace_only_their_own_results(){
        let db=Connection::open_in_memory().unwrap();
        create_tables(&db).unwrap();
        db.execute("INSERT INTO classes(id,name,level) VALUES('class','SS2A','SS2')",[]).unwrap();
        db.execute("INSERT INTO students(id,class_id,name) VALUES('a','class','Ada')",[]).unwrap();
        db.execute("INSERT INTO students(id,class_id,name) VALUES('b','class','Ada')",[]).unwrap();
        assert_eq!(submit_to_db(&db,"a","titration",&[0,1]).unwrap().correct,2);
        assert_eq!(submit_to_db(&db,"b","titration",&[1,1]).unwrap().correct,1);
        assert_eq!(submit_to_db(&db,"a","titration",&[2,2]).unwrap().correct,0);
        let count:i64=db.query_row("SELECT COUNT(*) FROM knowledge_checks",[],|r|r.get(0)).unwrap();
        assert_eq!(count,2);
        let other:i64=db.query_row("SELECT correct FROM knowledge_checks WHERE student_id='b'",[],|r|r.get(0)).unwrap();
        assert_eq!(other,1);
        assert!(submit_to_db(&db,"nobody","titration",&[0,1]).is_err());
    }
}
