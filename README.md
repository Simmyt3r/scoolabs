# Scoolabs

**Offline-first interactive science laboratories for Nigerian schools.**

Built for Windows by Simeon's Laboratories and Co Technologies Ltd.

## Current prototype (v0.5)

| Subject | Working simulation | Current controls |
| --- | --- | --- |
| Chemistry | Strong acid-base titration | Concentration, burette addition, pH, indicator |
| Physics | Ohm's law | Voltage, resistance, current, power |
| Biology | Microscope | Specimen, objective, focus, magnification |
| Agriculture | Seed germination | Crop, moisture, temperature, days |

All twelve practicals are now accessible. Laboratory diagrams are generated locally by the app, and there are no runtime downloads of teaching assets.

Students can set a local profile, save results and conclusions in an offline notebook, and export their notebook as JSON.

**Native data storage:** The installed Windows application now uses local SQLite for student profiles, practical observations, teacher accounts, classes, enrolments, assignments, grades and backups. Previous notebook entries migrate once from localStorage into SQLite, with idempotent import. Native SQLite backup is available from the PIN-authenticated Teacher workspace. Browser-only developer preview still uses localStorage fallback.

**Limits:** Students do not yet have individual password-protected identities, and physical administrators may access SQLite. This is not yet a secure centrally managed school-wide gradebook. Models are teaching approximations; teachers must independently validate lessons and results before school rollout.

**Now available:** Twelve interactive lessons, three per subject. Newly added: filtration/evaporation, convex thin-lens images, potometer water uptake, and illustrative nutrient limitation symptoms.

## Developer commands
- npm install
- npm test
- npm run build
- npm run tauri dev
- npm run tauri build

## GitHub Actions
1. Quality checks: validates TypeScript, tests and frontend build on every main commit or PR.
2. Windows desktop installer: creates a NSIS Windows executable on every main commit. Find it in the Actions run's Artifacts panel.
3. Version tag release: push a vX.Y.Z tag to build and publish the installer on GitHub Releases after classroom acceptance testing.

Windows setup includes the WebView2 offline installation payload; no internet is required to run the installed software.

See docs/DEVELOPMENT.md for developer setup, offline acceptance checks and model limitations.

Scoolabs is a supplemental learning aid, not a complete replacement for supervised physical laboratory work.

## Recovery (v0.3)
From Teacher workspace, the Recovery tab lists local backups, creates transaction-consistent SQLite snapshots, and can restore a selected verified backup after explicit destructive-action confirmation. The app preserves a safety snapshot before replacement and clears teacher sessions after restoration. Safeguard these backups as they contain identifiable pupil records and teacher password hashes.


## Students and teacher access (v0.4)

**Installed desktop mode:** Students cannot access records by typing someone else's name and class. A teacher first creates a local teacher account and a class, then enrols each student with a 6-12 digit PIN. Scoolabs generates a distinct 10-character access code. Students enter their own code and PIN to open their offline laboratory; the application keeps their token in volatile memory and scopes notebook entries and class assignments by the enrolled student ID. Five failed student PIN attempts temporarily lock that access code for five minutes (within the current app process). Signing out revokes the current token.

The native student notebook APIs no longer expose arbitrary name/class record reads and writes. Grading remains teacher-only and ignores student-supplied grade/feedback fields. Teacher staff can reset student PINs and invalidate active student sessions. A school administrator with full operating-system access still controls the files; this is **not** a fully audited identity system or online school management system.

**Browser development preview:** Student name/class and localStorage are retained only as a non-production UI/testing fallback. It is **not** equivalent to authenticated desktop mode.

**Legacy records:** Previously stored SQLite laboratory entries remain available in the teacher dashboard, but old name-based entries are not automatically assigned to new student identities. Old localStorage notebook entries require a teacher-reviewed migration, not automatic trust in their claimed student name.

## Offline lesson manuals and reporting

Each of the twelve exercises includes local equipment lists, guided procedures, assessment questions, safety notes and model limitations. Teachers can compare class-level submissions and graded work and export a spreadsheet-safe CSV gradebook. No cloud services are required for any of these features.

**Pre-branding status:** Version 0.4 is a development build. Final product icons, installer appearance, real-school low-spec Windows testing and independent subject-teacher sign-off are still pending.


## Classroom assignments (v0.5 development build)

Teachers create practical assignments for individual classes, using one of twelve registered Scoolabs experiments. Authenticated students see **My assignments**, launch the relevant laboratory, and submit their observations directly to a selected assignment. The app verifies student class, experiment identity and uniqueness in native SQLite and accepts only one submission per student per assignment. Personal practice can still be recorded without linking to an assignment.

Teachers can see submitted, marked and outstanding counts for each activity; open reports filtered to one assignment; mark reports; and export the filtered gradebook CSV. Native migrations preserve existing v0.4 records and leave historical notes unassigned. The workflow is fully offline and relies on the physical security of the school device.

This is a **pre-branding development build**. Classroom testing on a real Windows installation remains deferred until final product branding.
