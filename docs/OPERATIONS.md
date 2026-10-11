# Offline school operation guide

1. Install the Windows desktop application using the Windows desktop installer Actions artifact.
2. Open Teacher workspace, create the first teacher account and choose a 6-12 digit PIN.
3. Sign in, create class names such as SS2A, enrol pupils and create practical assignments.
4. Students set their full name and class in Student Profile, run lessons and save observations.
5. Teachers sign in to the dashboard, open Mark reports, then grade each notebook entry.
6. From the teacher dashboard, select Back up database. Copy the resulting consistent .sqlite3 backup file to encrypted removable storage.

The SQLite database resides in the OS-specific Tauri application data directory as scoolabs.sqlite3. SQLite WAL and foreign keys are enabled. Old v0.1 notebook records import transactionally on first native launch. Migration does not delete legacy data until successful completion.

Teacher PINs are Argon2-hashed, teacher commands require a local session, and the native backup contains hashed credentials plus student data. Students do **not** currently authenticate. Treat workstations and backups as sensitive, do not store regulated personal data on a public computer, and do not claim production-ready school security. The graphical restore function is not yet available; verify backup integrity before relying on it.

GitHub workflows run tests and package .exe installers on pushes to main. Always complete disconnected classroom testing before distributing a tagged release.

## Restore an older backup
1. Sign in to Teacher workspace, choose Recovery, and create a current backup first.
2. Select a previously created Scoolabs backup from the list.
3. Review the replacement warning and type RESTORE SCHOOL DATA exactly.
4. Scoolabs validates backup filename, SQLite quick_check and required school tables; before restoring, it takes another safety snapshot named before-restore-*.sqlite3.
5. Restoration invalidates teacher sessions. Exit and restart the application and sign in with credentials from the restored school database.
6. Verify the class register and reports. Store backup and safety snapshots on protected removable media.

Only application-created backups in the local backup folder are selectable. Direct import of arbitrary SQLite files is intentionally unsupported. Failure during the restore operation requires recovery from the saved safety snapshot; do not ignore a restore error.

Safety snapshots named before-restore-*.sqlite3 are also listed in the Recovery tab, allowing the teacher to reverse a mistaken restoration. Reversing still requires authenticated access to an account in the currently active database and the full confirmation phrase. Every restoration creates a new safety snapshot.
