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


## v0.4 authenticated student workflow

1. Teacher creates local classes from Teacher workspace and signs in.
2. Enrol each student with their full name, class and a separate 6-12 digit PIN.
3. Scoolabs issues a unique 10-character access code; privately give the student their own code and PIN.
4. Students open their laboratory, enter code and PIN, and work through any of the twelve simulation exercises.
5. Results are saved against their SQLite student ID, not a user-entered name or class.
6. Assignments appear only for the student's enrolled class; notebook entries remain scoped to the authenticated student.
7. To reset access, a teacher uses the class register's Set / reset PIN control; existing student sessions are revoked.
8. On a shared computer, students must select Sign out when finished.

Five incorrect student PIN attempts produce a five-minute code lockout within the running process. Teacher code lists and reset actions require teacher authentication. Old roster entries without credentials can be activated by setting their first PIN. Do not display or distribute all credentials together.

Existing pre-v0.4 SQLite records are preserved as teacher-visible historical entries. Their unverified name/class claims are not automatically attached to student IDs. Browser-preview localStorage remains only for development testing.


## v0.5 assignment submission workflow

1. A teacher signs in, selects Assignments, selects the target class, chooses an existing experiment, and enters instructions.
2. A student signs in with their own personal code and PIN, then opens **My assignments** from the sidebar.
3. An assignment card opens its specified simulation directly and shows the pending/completed status.
4. After interacting with the instruments, select **Record these results**. The unsubmitted assignment is preselected; students can explicitly choose Personal practice instead.
5. Confirm the resulting observation and add a conclusion. Saving creates a student-owned report linked to the selected assignment. One submission per student per assignment is enforced in SQLite.
6. Teachers review the per-assignment progress counts and choose **View submissions** to filter and grade the linked records.
7. Student reports show the linked assignment and teacher marks. Teachers may export a spreadsheet-safe CSV of visible records.

Existing SQLite and legacy notes stay intact but are **not** automatically credited to new assignments. Teachers can create a fresh assignment for resubmission. Native checks prevent a student from submitting to another class's assignment, choosing an incompatible experiment or submitting twice. Class counts reflect known student rosters and records currently held by the local database.

Branding, teacher-led scientific acceptance tests and Windows school-hardware installation testing remain later milestones.

## Printable reports and teacher rubrics (pre-branding)
- Students open My notebook → Preview / print report for a saved observation. Teachers can preview reports from Mark reports.
- Preview includes student/class, experiment settings, observations, conclusion, scientific limitations, assignment title when available, and teacher feedback.
- Print report uses the system print dialog and A4 CSS. Actual Windows printing still requires device validation after branding.
- Teachers can enter a direct mark or use Method and settings (25), Observations (35), Scientific reasoning (30) and Report clarity (10). All criteria are required.
- A zero grade is valid; ungraded work explicitly says it has not been marked.

## Collect a scientific observation series
Open Chemistry → Titration or Physics → Ohm's law. Adjust the instruments and select **Capture reading** to write down each measurement. Repeat for different burette volumes or voltages; values appear on an offline chart and table. Up to twenty distinct setpoints are retained for the current lesson. When you are finished, choose **Record these results**. The report stores both the current settings and the manually captured observations. Changing the base concentration or resistor resets the plotted run so two distinct setups are not treated as one experimental series. This is a mathematical virtual laboratory, not a calibration-certified scientific instrument.

## Per-student assignment checklist
In Teacher workspace → Assignments, select **Show student roster** beside an assignment to display its enrolled students and their individual submission and marking status. The roster is read from SQLite using the authenticated teacher session and students' actual database IDs. Two pupils with the same full name remain distinct. **View submissions** opens the relevant grading list.

## Two-question knowledge checks
At the end of each practical, students select one answer for each of two short questions. The app shows explanations and offers Try again. Signed-in desktop results are saved to the student's offline account, while browser preview remains temporary. Teachers view latest formative scores under Knowledge checks and may filter by class. A formative score of 0–2 never alters the separately graded practical report.


## Student learning dashboard

After entering an access code and PIN in the Windows application, students open **My progress**. It shows how many distinct practicals they have saved, reports in their offline notebook, teacher marks, pending class assignments and short formative self-checks. Use **Open practical** for the next pending assignment or suggested untried lesson, **View class assignments** for assigned work, or **Open my notebook** to see observations and teacher comments.

A practical is only marked *tried* when a notebook report exists. It does not indicate mastery or curriculum certification. Teacher marks and formative self-checks remain separate, and unmarked reports do not count toward a student's score average.


## Keyboard access and practical-writing prompts
- Press **Tab** once from the top of the page to reveal **Skip to main content**. Press Enter to jump to the learning area.
- Navigate the sidebar and controls with Tab/Shift+Tab and Enter. On narrow screens, Escape closes the sidebar.
- Student profile, notebook-save and print-preview dialogs move keyboard focus inside the open dialog. Tab stays inside, Escape closes, and focus returns to the original button.
- In **Save your experiment**, expand **Show writing prompts** for experiment-specific questions and model limitations. Optionally insert a blank reflection structure containing Observation, Evidence, Explanation and Limitation sections. Write your own explanation in place of every bracketed placeholder before saving; blank placeholders are rejected.
- These writing aids do **not** calculate or invent any student observations or award a grade. Teachers should still review report quality.

## First launch after branding
In the installed Windows application, the Scoolabs welcome area explains that the science lab works offline. A new school selects **Open teacher setup** to create a private teacher account, then adds classes and students. Each student receives their own access code and PIN, enters them in the **Continue learning** panel, and lands on My progress. Teachers can reach the teacher workspace from the sidebar at any time. The same Scoolabs emblem appears in the app, printed reports and generated Windows installer icon.
