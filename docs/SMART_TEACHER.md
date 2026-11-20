# Scoolabs Smart Teacher – classroom roadmap

## First milestone: teacher-supplied lesson delivery
The Smart Teacher workspace is available from the main navigation without a student account. It does not read or alter student records. Paste a topic and complete teacher-approved teaching notes (up to 20,000 characters). Use Markdown-style # headings for sections and Q:/A: pairs on separate lines for approved answers. The sample Ohm's law lesson illustrates the format. This is session-only until exported; leaving the workspace discards an unexported draft. Do not enter student personal information.

Connect the school PC to a projector or television using the operating system's display settings. Start classroom mode, and optionally use Fullscreen. A large-text modal fills the application even if native fullscreen is unavailable. The lecturer can move between slides, present in silence, read a section aloud, pause/resume, and stop. Speech uses only installed English voices reporting localService; if no suitable voice exists or speech fails, the screen remains usable. The teacher can enable hands-free narration with 20-second discussion breaks. Activity, exercise, discussion, practice and assessment sections require manual advancement. An adult must remain present; pause or disable auto advance for longer discussions.

Learners' questions can be typed by a facilitator or dictated using the optional Windows microphone workflow described below. An exact normalized match to an approved question returns the supplied answer verbatim; a related passage is displayed explicitly as a possibly incomplete excerpt; otherwise the system defers to the supervisor. The default mode does not make any generative or external request. An optional local model can draft responses for explicit supervisor review. The source notes themselves are not independently fact-checked by the software. This is not a substitute for teacher safeguarding, curriculum review or physical practical supervision.

## Next phases
1. A portable lesson file library and local reference-based drafts are implemented. Next: teacher-authenticated persistent storage, DOCX import, richer lesson planning and curriculum review.
2. Local voice narration and a Windows System.Speech push-to-listen prototype are implemented. Optional Whisper offline recognition and packaging workflow are implemented; next: Nigerian English/noisy-classroom evaluation and improved speech output.
3. Optional local generative adapter for drafts and lesson-backed answer suggestions is implemented. Before rollout, validate accuracy, hallucinations, contextual answers, safety, memory and response latency. No unsupported claim that topic-only input produces a complete accurate lesson.
4. First visual board, four interactive demonstrations, lesson timing and a separate operator/projector window are implemented. Lesson-plan visual sequences and a private question queue are now implemented. Next: richer diagrams, more simulations, improved speech recognition and physical dual-display testing.
5. Test on real low-spec Windows computers, offline with actual TV, microphone and speakers; verify typing shortcuts and accessibility, teacher takeover, voice interruption, offline behaviour, scientific correctness, age-appropriate material and classroom acceptance before pilot.

## Acceptance checks for milestone one
- Load sample lesson, start and exit classroom, switch sections, ask an approved question and an unrelated question, finish the lesson.
- Disable the network, confirm no remote speech service is selected, and check the text-only fallback on a computer without local English voices.
- Test local voice start, pause, resume, stop, read response, navigating away mid-speech and auto-advance; activity sections must wait.
- Confirm a teacher can access the workspace without entering student credentials and cannot access student data through it.
- Validate full-screen and application-window fallback on 1366×768 and actual TV/projector, plus 200% text scaling.
- Verify classroom content against an approved lesson plan with a qualified educator.

## Second milestone: offline lesson preparation and reuse
Choose a subject and a specific local reference to assemble a draft. The generator copies existing reference facts, examples and limitations and adds generic teaching prompts; it is not a generative AI model. Review the draft, sources and answer bank for suitability before starting or exporting. Any edit invalidates the review acknowledgement. Topic coverage is limited to the bundled reference atlas. For other topics, supply teacher-approved notes manually.

Import a Scoolabs `.lesson.json` file (schema `scoolabs.lesson`, version 1), `.txt` or `.md` teaching notes. Plain text uses the current topic or filename; malformed files and oversized content are rejected. A reviewed valid draft can be exported as JSON for reuse without internet. Importing always requires review again. Files are local, not a secure authenticated school curriculum database; do not include student records. Direct DOCX import and autosave remain pending.

Select **Class check** within the presentation to conduct oral assessment from the lesson answer bank. Questions are displayed individually; the answer is hidden until the supervisor selects Reveal answer. The question and answer can be narrated. Auto advance is suspended during the class check; no learner identity, score or recording is collected. Verify import/export on Windows WebView2 (browser tests cover the web preview). Actual local voice providers, projector operation and reviewed curriculum alignment still need school testing.

## Third milestone: native Windows voice question input (experimental)
During the question break, choose Listen to question only when the learner and supervising adult agree. The desktop application starts one in-process System.Speech dictation recognizer hosted in Windows PowerShell, using the first installed English recognizer and the default microphone. There is no continuous listening. The app captures no recording file and uses no web speech API or cloud endpoint. A session ends upon recognized speech, initial silence, explicit cancellation or an 18-second process deadline. The UI exposes listening status and Stop listening. Native request IDs isolate cancellation (including cancel-before-start) and reject overlapping sessions; the UI discards stale transcripts on exit, navigation or cancellation.

Confirm/correct the transcript before selecting Ask question. Low-confidence (<0.55) or unavailable recognition falls back to typing. The answer may be read using the already installed local English speech voice; excerpts must be spoken as excerpts rather than confirmed answers. Browser preview intentionally disables the microphone. Teachers must check microphone access and install an English Windows speech recognition engine where needed. No personal information should be spoken into class questions. The recognition accuracy, actual OS microphone indicator, PowerShell availability, and offline behaviour still need testing on school PCs. No microphone-dependent test runs on hosted CI; Rust unit tests cover the result parser, session exclusivity and cancellation, and browser tests cover disabled voice controls and typing.

## Model capacity and proposed deployment tiers
MiniLM-L6-v2 (bundled quantised ONNX ~23 MB) provides sentence embeddings for local retrieval. It cannot transcribe audio or generate new instructional text. Keep it as the retrieval component. For speech recognition, benchmark Whisper base (~142 MiB model, ~388 MB model runtime memory per whisper.cpp upstream table) and tiny (~75 MiB) on classroom accents/noise. The legacy Windows speech engine is a lightweight fallback, not evidence of sufficient transcription accuracy. For general teaching generation, evaluate Qwen3-4B-Instruct-2507 (Apache 2.0 upstream), 4-bit GGUF (~2.5 GB weights), using a pinned local llama.cpp runtime. This is a candidate, not integrated or qualified. Begin with 8 GB system RAM as a test target for a compact optional model and 16 GB preferred; 4 GB systems use teacher-approved lessons and retrieval-only mode. Actual RAM requirements and latency depend on runtime, context and hardware. Do not bundle large models in the base installer before testing and license/provenance checks. Larger models or local school-server inference may be required for broad and complex curriculum questions. Use teacher-reviewed context, citations, answer verification/abstention, model evaluations and teacher takeover. No promise of unrestricted autonomous instruction.

References: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 ; https://github.com/ggml-org/whisper.cpp#memory-usage ; https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507 ; https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF ; https://learn.microsoft.com/en-us/dotnet/api/system.speech.recognition.speechrecognitionengine?view=netframework-4.8.1 .

## Fourth milestone: optional local generative adapter
See [local model installation and qualification](LOCAL_TEACHER_MODEL.md). The separately installed llama.cpp service can draft a lesson from a topic and human-provided outline, and propose short source-scoped answers after the base Q&A flow. The model is not bundled or qualified. Drafts require review, and suggested answers must be reviewed before narration. All requests are explicit and loopback-only. No live autonomous teacher claim is made.

## Shared Silabs AI provider
Scoolabs now defaults to the existing shared Silabs AI Qwen3-1.7B runtime on the same PC. The larger 4B model pack remains an explicit alternative. See [shared provider setup and qualification](SHARED_SILABS_AI.md). No silent provider or cloud fallback occurs.

## Fifth milestone: interactive board and separate classroom display

Choose a lesson duration (1–180 minutes) and a discussion break (5–180 seconds) before starting the class. The timer measures elapsed session wall time, including discussion and interruptions; it does not force the lesson to stop at the target. The existing hands-free narration waits for the configured discussion break after a successfully spoken section. Practical/activity/assessment sections still require adult intervention, and a blank TV or open question/assessment pauses automatic advancement.

In the classroom, open Digital whiteboard. Choose a demonstration or accept the exact-topic suggestion. The teacher controls the values; the display uses deterministic calculation functions from the existing simulation engine:
- DC circuit: voltage, resistance, current and power, with schematic and V = I × R.
- Pendulum: length, period and ten-cycle time under small-angle assumptions.
- Microscope: objective lens, total magnification and modeled field of view.
- Germination: crop, moisture, temperature, day and illustrative germination/height.

These are simplified schematic demonstrations rather than physical experiment instructions. No AI-generated equations, executable diagrams or simulated values are trusted. The board is hidden while asking questions or conducting assessment and can be cleared or changed manually. Other experiments and model-directed visual sequences remain pending.

### Windows extended display

1. Connect the TV/projector and choose **Extend** in Windows display settings, not Duplicate.
2. Start a lesson and select Open TV display. Move the new Scoolabs Classroom Display window to the TV and maximize it. The operator remains in the main app. The separate display contains the current section, public question/revealed answer, board and timing only.
3. Use the main classroom controls to advance, speak, change the board or conduct a class check. Unsubmitted questions, transcripts, private model suggestions, source-review evidence and unrevealed answers are not transmitted to the TV. The supervising teacher must still ensure that the physical TV is showing only the new display. The software cannot detect a mirrored desktop.
4. Blank TV display for a pause. Resume TV display to return to public content. Close TV display or Exit lesson when done. If the operator stops updating it, the native snapshot lease expires after five seconds and the display falls back to a waiting page. A stalled frontend polling request also blanks locally.
5. The browser preview intentionally disables the independent TV window, while the full-window classroom and board continue to work. If native window creation or sync fails, use the main view; manually blank any mirrored TV before reviewing unapproved generated content.

The native display receives an explicit, bounded snapshot, not the entire lesson/editor state. Requests are scoped by originating window label and a random display-session ID; stale sequence numbers cannot replace newer frames. Browser unit/E2E tests cover board values, timing workflows and public-frame omission, and native unit tests cover validation. This is not yet a verified dual-monitor deployment: test real extended display, Windows DPI, audio routing, drag/maximize, disconnect/reconnect, blanking, operator close and privacy while reviewing on physical hardware. No automatic monitor detection or placement is implemented.

## Sixth milestone: lesson-directed classroom orchestration

Teaching cues are optional, bounded instructions embedded in the same portable lesson text. Place them immediately below a section heading, before its teaching notes, one per line. Older lesson files continue to work. Example:

    # Worked example
    @board circuit 6 3
    @discuss 30
    A 6 volt source across a 3 ohm resistor gives 2 amperes under ideal conditions.

    # Class activity
    @board none
    @pause
    Invite the class to calculate the current for a 12 volt source and a 4 ohm resistor.

Supported board cues:
- `@board circuit VOLTS OHMS` (0–24 V, 1–100 ohms)
- `@board pendulum METRES` (0.1–2 m)
- `@board microscope OBJECTIVE` (4, 10, 40)
- `@board germination CROP MOISTURE TEMPERATURE DAY` (maize/cowpea/rice; 0–100%; 0–55°C; integer day 0–21)
- `@board none` (clear the visual)
- `@pause` (manual supervisor checkpoint)
- `@discuss SECONDS` (integer 5–180; overrides the default discussion interval for automated progress)

Only explicit cues are interpreted. Validation rejects duplicate cues, invalid parameters, misplaced cues and cue-only sections. Cues never become spoken text, lesson excerpts or arbitrary executable commands. The same validated science engine supplies the diagram results. Long sections split into slides with the same cue applied at each slide entry.

AI-generated drafts can suggest these optional cues, but teachers must review their values and relevance along with the notes and questions before starting. The system does not verify that the chosen diagram actually matches the narrative. Teachers should avoid revealing assessment answers via a visual or an earlier slide. The sample lesson contains synchronized circuit examples and an explicit hold before the class activity. In cue-enabled lessons the board follows the next section, clearing when no board cue exists. Teachers may turn Planned board off or manually override the current visual; a later planned section reapplies its own cue when enabled. Lessons with no board cues retain manual controls.

Use Lesson agenda to inspect or jump to a section. Opening the agenda stops current narration and suspends automatic advance. Hands-free mode observes the configured discussion time, section-specific holds and default activity/assessment holds. It also waits while the TV is blank, question queue is non-empty, or a question/assessment/agenda is open. Manual navigation remains available. Timing is elapsed wall time, not enforced curriculum duration.

### Private question queue

During a question break, type or dictate a question and choose Queue for later. The session-only queue holds up to 20 unique questions of 1–300 characters. The operator can return to the lesson, reopen Questions, load a queued item into the editable question field and explicitly submit it. Exact normalized submission removes that item; if editing changes it, the original can be removed manually. Remove irrelevant or withdrawn items. No queued question, count or unsubmitted transcript is sent to the separate projector. Only the explicitly submitted public question/approved response is projected. Avoid personal data; a mirrored desktop still exposes operator controls. Pending queue items block hands-free progression and Finish lesson until resolved; manually skipping sections is allowed. Exiting the session discards all queued questions. No persistent learner tracking is implemented.

Unit and browser tests cover cue parsing, simulation values, agenda navigation, queue lifecycle and omission from public snapshots. Actual Windows speech/narration, physical TV and classroom usability remain school pilot requirements. The shared Silabs AI model can propose cues but has not yet been qualified on real classroom draft generation. No additional model is required for executing these cues.

## Seventh milestone: optional Whisper recognition
The standard Windows speech provider remains the default. Choose the optional local Whisper Base service to capture a short English question in memory, stop the microphone, transcribe on loopback and review the transcript before submission. Interrupt and listen stops current narration and opens the question break; Return and reread section explicitly restarts the current slide. The native speech-session guard prevents overlapping Windows and Whisper inference and discards cancelled results. A separate service may finish a pending request after cancellation, but its transcript is never shown. Typed questions are always available. See [offline Whisper pack](OFFLINE_WHISPER.md) for the pinned model/runtime, setup and qualification. Physical microphone, WebView2 permissions, accent accuracy, noisy classroom performance and concurrent Qwen memory use remain unverified.
