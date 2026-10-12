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

## Observation series verification
- `src/measurements.test.ts` checks manual-only capture, bounded and sorted data, duplicate-setpoint replacement, and ideal Ohm resistance fitting.
- Chromium tests capture titration/circuit readings, clear observations, and verify changing resistance resets the circuit run.
- Graphs use bundled SVG and no internet-dependent plotting library. A school pilot must compare visual axes, tables and printed notebook series against independent calculations.

## Formative checks quality gates
- Knowledge bank unit tests cover all 12 experiments, correct answers and invalid selection rejection.
- Rust tests validate score keys, repeated attempts and isolation between students with identical names.
- Chromium tests verify scoring feedback, retry and non-duplicated guides when changing experiments.
- Physical classroom acceptance remains pending until after branding (see docs/CLASSROOM_ACCEPTANCE.md).


## Student dashboard regression checks

- Progress unit tests cover zero-data accounts, distinct experiments, assignment completion, pending work, teacher marks including zero, ungraded work, formative self-checks and recommended next lessons.
- Browser tests verify navigation, a meaningful empty state, a suggested lesson shortcut and saved notebook feedback surviving refresh.
- Native sign-in loads authenticated records, class assignments and formative results before showing the student dashboard. A partial loading failure revokes the login token.
- The dashboard is not a mastery or official curriculum-completion tracker. Real Windows 10 classroom acceptance remains scheduled for after branding.


## Keyboard accessibility regression
- Run Chromium tests for keyboard skip link, modal focus return, reverse/forward focus wrapping, Escape, report-writing prompts and print-preview focus restoration.
- Confirm reduced-motion preferences remove nonessential transitions.
- After branding, test screen-reader announcements and keyboard-only lab interactions on an actual Windows PC. Automated focus behaviour alone is not full accessibility certification.

## v0.8 keyboard and viewport checks
- Use Playwright to exercise the skip link, modal focus cycling, focus restoration, Escape, responsive mobile navigation, and structured conclusion prompts.
- Confirm status messages are announced to assistive technologies and reduced-motion preferences bypass nonessential transitions.
- Accessibility is not certified by this automation; perform screen-reader, keyboard-only, and Windows desktop acceptance tests after final branding.

## Branding generation in CI
The original Scoolabs SVG is stored in `public/brand/scoolabs-mark.svg`. Both workflows now generate `src-tauri/icons/icon.ico` and `icon.png` using the pinned project's Tauri CLI, then validate the outputs using `node scripts/verify-brand.mjs`. The generated icons do not need to be manually copied from Windows. Run `npm run desktop:build` for a branded local installer. The pre-run HTML placeholder uses the same inline/offline Scoolabs mark. Physical installer and shortcut appearance remain post-branding device tests.


## Offline knowledge-centre regression
- Verify exactly 118 periodic elements, unique atomic numbers and grid positions, correct basic element identities, and no unconfirmed element 119.
- Verify ten evidence-aware concept entries and twelve apparatus guides for each of the four subjects. Every article links only to an implemented experiment from its own subject.
- In Chromium, search and filter elements, examine properties and compare two, search apparatus including Burette, and switch between all four subject libraries without internet.
- These are content integrity and workflow tests; a qualified teacher must validate scientific accuracy, completeness, and appropriate safety framing.
