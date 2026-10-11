# Scoolabs

**Offline-first interactive science laboratories for Nigerian schools.**

Built for Windows by Simeon's Laboratories and Co Technologies Ltd.

## Current prototype (v0.2)

| Subject | Working simulation | Current controls |
| --- | --- | --- |
| Chemistry | Strong acid-base titration | Concentration, burette addition, pH, indicator |
| Physics | Ohm's law | Voltage, resistance, current, power |
| Biology | Microscope | Specimen, objective, focus, magnification |
| Agriculture | Seed germination | Crop, moisture, temperature, days |

Four additional practicals remain marked Coming soon. All laboratory illustrations are generated in the user interface itself; no remote asset downloads are needed.

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
