mod database;

use std::{collections::HashMap, sync::Mutex};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            use tauri::Manager;
            let db = database::initialize(&app.handle())?;
            app.manage(db);
            app.manage(database::Sessions(Mutex::new(HashMap::new())));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            database::get_profile,
            database::set_profile,
            database::list_lab_records,
            database::save_lab_record,
            database::import_legacy_records,
            database::teacher_accounts,
            database::setup_teacher,
            database::teacher_login,
            database::teacher_logout,
            database::add_teacher,
            database::class_catalog,
            database::create_class,
            database::enroll_student,
            database::create_assignment,
            database::class_assignments,
            database::grade_record,
            database::teacher_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("failed to start Scoolabs");
}
