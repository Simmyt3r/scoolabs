mod database;
mod student;
mod knowledge;
mod offline_assets;

use std::{collections::HashMap, sync::Mutex};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            use tauri::Manager;
            let db = database::initialize(&app.handle())?;
            app.manage(db);
            app.manage(database::Sessions(Mutex::new(HashMap::new())));
            app.manage(student::StudentSessions(Mutex::new(HashMap::new())));
            app.manage(student::LoginThrottle(Mutex::new(HashMap::new())));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            database::teacher_accounts,
            database::setup_teacher,
            database::teacher_login,
            database::teacher_logout,
            database::add_teacher,
            database::class_catalog,
            database::create_class,
            database::create_assignment,
            database::grade_record,
            database::teacher_snapshot,
            database::teacher_assignment_roster,
            database::backup_school_database,
            database::list_local_backups,
            database::restore_local_backup,
            student::teacher_enrol_student,
            student::teacher_reset_student_pin,
            student::teacher_access_codes,
            student::student_login,
            student::student_logout,
            student::student_records,
            student::student_assignments,
            student::student_submit_record,
            knowledge::submit_knowledge_check,
            knowledge::student_knowledge_results,
            knowledge::teacher_knowledge_results,
            offline_assets::offline_assets_status,
        ])
        .run(tauri::generate_context!())
        .expect("failed to start Scoolabs");
}
