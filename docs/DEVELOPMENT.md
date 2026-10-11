# Development and release guide

## Local setup
Use Node.js 22, Rust stable and your platform's Tauri native prerequisites (on Windows, Microsoft C++ Build Tools and WebView2).

- Install dependencies: npm install
- Run unit tests: npm test
- Type-check: npm run typecheck
- Preview web-only UI: npm run dev
- Develop desktop app: npm run tauri dev
- Build Windows installer: npm run tauri build

## Automated GitHub Actions workflows
- Quality checks: on main pushes, pull requests and manual runs. Runs TypeScript checks, simulation unit tests and builds frontend artifacts.
- Windows desktop installer: on main pushes, version tags and manual runs. Runs tests, builds the offline NSIS Windows setup executable and attaches it under the run's Artifacts section.
- Tag a tested release v0.1.0 to also attach its installer to GitHub Releases.
- The NSIS setup bundles the WebView2 offline installer (larger download), to support school computers with no internet at installation time.

## Offline acceptance test
1. Install Windows setup executable.
2. Disconnect internet completely.
3. Start each subject and change every control.
4. Enter a student name/class and record an experiment.
5. Close and reopen the app and verify that the notebook record remains.
6. Export a local JSON backup and verify its contents.
7. Check low-spec Windows 10 hardware in a real school before declaring release-ready.

## Scientific boundaries
Titration uses ideal strong acid/strong base at 25 C. Ohm's law uses ideal DC ohmic resistance. Microscopy slides are schematic. The seed model is illustrative, not an agronomic prediction. Have qualified secondary-school teachers validate every lesson.

## Future work
SQLite persistence and import/restore, local classes and teacher marking, curriculum mapping, instrument manipulation, richer validated experiments, low-spec device optimisations, signing and update management.
