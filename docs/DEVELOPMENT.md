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

## Browser workflow integration tests
- GitHub Actions Quality checks installs headless Chromium and runs npm run test:e2e.
- These smoke tests click all twelve lab tabs, save a practical report to the notebook, reload the browser preview, and show the desktop-only warning on Teacher workspace.
- Important: browser-preview persistence uses the localStorage fallback, not native SQLite. The Windows workflow runs native database tests separately. Offline native installation must still be physically verified on a school computer.


## v0.4 quality gates
- Check all twelve experiment manuals, scientific model assumptions, and practical questions have nonempty source data.
- Run type checking, Vitest (scientific, guide coverage, gradebook escaping), and Chromium workflow smoke tests through GitHub Actions.
- Build native Windows executable and run Rust database tests in the Windows workflow.
- Student enrolment/credential issuance, login lockout, student scoped records, teacher PIN reset and SQLite restoration need hands-on end-to-end testing on school PCs after the agreed branding milestone.
- Native credential handling is unavailable in the plain browser preview, by design.

## Print report and assessment checks
- Rubric unit tests cover total=100, invalid points, round-trip details and valid zero scores.
- Playwright tests report preview, sample content, print media visibility and closing the modal.
- Native WebView2 printing remains a physical Windows acceptance test after branding.
