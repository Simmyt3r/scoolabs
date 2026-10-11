# Scoolabs

**Offline-first interactive science laboratories for Nigerian schools.**

Built for Windows by Simeon's Laboratories and Co Technologies Ltd.

## Current prototype (v0.1)

| Subject | Working simulation | Current controls |
| --- | --- | --- |
| Chemistry | Strong acid-base titration | Concentration, burette addition, pH, indicator |
| Physics | Ohm's law | Voltage, resistance, current, power |
| Biology | Microscope | Specimen, objective, focus, magnification |
| Agriculture | Seed germination | Crop, moisture, temperature, days |

Eight additional practicals are visible as Coming soon. All laboratory illustrations are generated in the user interface itself; no remote asset downloads are needed.

Students can set a local profile, save results and conclusions in an offline notebook, and export their notebook as JSON.

**Prototype limitations:** Notes currently use device-local WebView storage, not yet SQLite; they should be backed up before uninstalling or clearing data. This is not a secure schoolwide gradebook. Calculations and diagrams are teaching models and require teacher validation before curricular adoption.

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
