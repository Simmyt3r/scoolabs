# Scoolabs classroom acceptance checklist

Status: PRE-BRANDING DEVELOPMENT. These are future physical school pilot tests, NOT completed checks.

## Hardware and offline installation
- [ ] Verify Windows 10 specification, free space, screen size and printer configuration.
- [ ] Install the branded Scoolabs executable on a real school computer with no antivirus or permissions problems.
- [ ] Disconnect all internet connections, restart and run each of the twelve laboratory simulations.
- [ ] Test narrow displays and 1366×768 monitors for usable navigation, visible modals and controls.
- [ ] Check that data survives application restart and a version update, after taking a secure backup.

## Student account security
- [ ] Create an authorised lead teacher and two distinct student accounts with the same student name.
- [ ] Verify students can see only their own assignments, notebook and formative self-check history.
- [ ] Verify the wrong PIN triggers a temporary lockout, student logout revokes access and teacher PIN reset revokes student sessions.
- [ ] Confirm student credentials are not publicly displayed or printed in a shared list.

## Science model review
- [ ] Validate chemical titration pH and equivalence, electrical V/I/R, pendulum period, and potometer uptake against independent reference calculations.
- [ ] Confirm real instruments and simulation-only measurements are clearly distinguished.
- [ ] Review all practical safety warnings, lesson objectives and scientific model limitations with qualified Chemistry, Physics, Biology and Agriculture teachers.
- [ ] Confirm simplified seed germination and plant nutrient models are never represented as field diagnoses.

## Assessment, teacher records and printing
- [ ] Teacher publishes class assignment; student submits exactly one report against it; teacher marks and records feedback.
- [ ] Confirm student roster correctly separates students having identical names.
- [ ] Open all twelve self-checks, verify two questions each, correct explanations and repeat attempts.
- [ ] Confirm formative results remain distinct from teacher-awarded practical-report grades, including zero marks.
- [ ] Test print preview, A4 printer output, Microsoft Print to PDF, line breaks and long notes.
- [ ] Export CSV and check values and formula-injection handling in spreadsheet software.

## Restore and privacy
- [ ] With dummy data, create a native SQLite backup; copy to secure removable storage.
- [ ] Restore a previously saved backup with confirmation; verify previous database safety snapshot and both-session invalidation.
- [ ] Apply school policies for student names, report files, printed sheets and backups.

Record Windows build SHA, device model, school, date, independent subject-teacher reviewer, failed steps and remediation. Do not declare production readiness until all critical items pass.

No WAEC, NECO, NERDC, safety or curriculum certification is claimed.


## Additional keyboard and small-screen acceptance (v0.8)
- [ ] Use only a keyboard to navigate all four subject areas, and verify visible focus and Skip to main content.
- [ ] Use Tab/Shift+Tab in the notebook and profile dialogs, close with Escape, and confirm focus returns to the invoking button.
- [ ] Open the mobile sidebar at 360px and 390px, close with Escape, and confirm active navigation remains usable.
- [ ] Open a report-writing guide, insert the blank reflection outline, and verify it cannot be saved with unfilled bracketed placeholders.
- [ ] Try Windows high-contrast settings, 200% text scaling and the platform screen reader. Automated browser checks cannot replace these physical-device tests.

## Final brand acceptance (Scoolabs identity candidate)
- [ ] Verify the open-book/flask icon appears in the Windows NSIS installer, Start menu, taskbar and application title bar, all at readable sizes.
- [ ] Confirm first launch presents a readable student sign-in and an obvious **Open teacher setup** path, even without network access.
- [ ] Complete first teacher setup and student enrolment using keyboard and mouse.
- [ ] Confirm the printed A4 report and browser favicon use the identical approved Scoolabs mark.
- [ ] Obtain product-owner approval of logo, wording and colour contrast before public release; official Silabs corporate logo remains a separate corporate asset.

## Branded Help & About review
- [ ] Confirm the Help & About page opens while entirely offline, with school setup steps and clear local-storage limitations.
- [ ] Confirm support email and telephone belong to the company and are not mistaken for an in-app internet requirement.
- [ ] Verify the footer product version equals the installed version and that publisher details on NSIS are correct.

## Windows publisher and trust checks
- [ ] Check the installer properties report Scoolabs and Simeon's Laboratories and Co Technologies Ltd as publisher metadata. A separate signing certificate is required for verified signatures.
- [ ] Confirm Windows Defender SmartScreen behaviour with an *unsigned* build. Do not misrepresent unsigned files as trusted signed software.
- [ ] Confirm product version in the About page matches installed package version.


## Subject reference libraries and periodic-table acceptance
- [ ] Verify the Chemistry periodic table displays 118 recognized elements, accurate symbols, numbers, groups, periods and units.
- [ ] Review detailed values for ten representative elements with current scientific references; identify theoretical/missing measurements.
- [ ] Navigate each subject's concepts and apparatus, checking search, keyboard accessibility, labels, definitions and related practical links.
- [ ] Replace generic apparatus symbols with qualified-teacher-approved, labelled 2D/3D diagrams before advertising a complete instrument library.
- [ ] Validate lesson sequencing against the target Nigerian junior/senior secondary curriculum, with documented reviewer and version.

## v0.11 reference testing
- [ ] In Chemistry, search hydrogen, oxygen and iron and compare periodic element properties.
- [ ] In Physics, find the Ohm formula and independently compare physical constants, units and uncertainties against the cited NIST table.
- [ ] In Biology, locate Paramecium and onion epidermis and check descriptions with a subject teacher.
- [ ] In Agriculture, find cassava, cowpea and domestic chicken without implying field prescriptions.
- [ ] Verify all fourteen illustrated apparatus are labelled correctly; log missing illustrations separately.
- [ ] Disconnect the network and use these references on the actual Windows installation.
