# Scoolabs Smart Teacher – classroom roadmap

## First milestone: teacher-supplied lesson delivery
The Smart Teacher workspace is available from the main navigation without a student account. It does not read or alter student records. Paste a topic and complete teacher-approved teaching notes (up to 20,000 characters). Use Markdown-style # headings for sections and Q:/A: pairs on separate lines for approved answers. The sample Ohm's law lesson illustrates the format. This is session-only; leaving the workspace discards the draft. Do not enter student personal information.

Connect the school PC to a projector or television using the operating system's display settings. Start classroom mode, and optionally use Fullscreen. A large-text modal fills the application even if native fullscreen is unavailable. The lecturer can move between slides, present in silence, read a section aloud, pause/resume, and stop. Speech uses only installed English voices reporting localService; if no suitable voice exists or speech fails, the screen remains usable. The teacher can enable hands-free narration with 20-second discussion breaks. Activity, exercise, discussion, practice and assessment sections require manual advancement. An adult must remain present; pause or disable auto advance for longer discussions.

Learners' questions currently need to be typed by a facilitator. An exact normalized match to an approved question returns the supplied answer verbatim; a related passage is displayed explicitly as a possibly incomplete excerpt; otherwise the system defers to the supervisor. No generative answer or external request occurs. The source notes themselves are not independently fact-checked by the software. This is not a substitute for teacher safeguarding, curriculum review or physical practical supervision.

## Next phases
1. Persistent, teacher-authenticated lesson library; import DOCX/text and structured lesson plans; preview and approve lesson objectives, examples, explanations and assessments.
2. Native Windows offline speech synthesis and push-to-talk offline speech recognition with clear consent and no retained audio. Measure speech recognition for Nigerian English and noisy classrooms; manual fallback.
3. Local retrieval of approved curriculum resources and lesson passages, with confidence and explicit abstention. Optional local generative model only after evaluating accuracy, hallucinations, contextual answers, safety, memory and response latency. No unsupported claim that topic-only input produces a complete accurate lesson.
4. Visual board with equations, diagrams, practical simulation demonstrations, quizzes, hands-up question queue, lesson timing and recap. Separate teacher operator and projector output to avoid exposing private notes.
5. Test on real low-spec Windows computers, offline with actual TV, microphone and speakers; verify typing shortcuts and accessibility, teacher takeover, voice interruption, offline behaviour, scientific correctness, age-appropriate material and classroom acceptance before pilot.

## Acceptance checks for milestone one
- Load sample lesson, start and exit classroom, switch sections, ask an approved question and an unrelated question, finish the lesson.
- Disable the network, confirm no remote speech service is selected, and check the text-only fallback on a computer without local English voices.
- Test local voice start, pause, resume, stop, read response, navigating away mid-speech and auto-advance; activity sections must wait.
- Confirm a teacher can access the workspace without entering student credentials and cannot access student data through it.
- Validate full-screen and application-window fallback on 1366×768 and actual TV/projector, plus 200% text scaling.
- Verify classroom content against an approved lesson plan with a qualified educator.
