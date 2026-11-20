# Scoolabs offline Whisper speech pack (pilot)

The built-in Windows System.Speech recognizer and typed questions remain the default. The optional Whisper Base multilingual model (147,951,465 bytes, about 148 MB) is a separate Windows x64 CPU pack. Whisper is a speech-to-text model, not another generative teacher; Silabs AI remains responsible for reviewed lesson/answer drafts. No microphone recording or weights are committed to Git.

## Technician preparation (internet required once)

From the Scoolabs repository, on a trusted connected Windows machine, run:

    .\scripts\prepare-whisper-pack.ps1

This downloads the pinned model and official whisper.cpp b5454 CPU archive, checks their exact SHA-256 hashes against the lock file, and assembles a portable folder including the licenses, launcher and instructions. The model checksum was cross-checked against the pinned mirror manifest; the runtime checksum against Scoop's release manifest. Check the provenance and redistribution notices before wider deployment. Do not bypass checksum failures. The optional speech-pack workflow also performs a real local inference smoke test before publishing its pilot artifact.

## Offline classroom computer

1. Copy the entire whisper-pack folder to a technician-controlled directory on the school PC. The standard Scoolabs Windows installation is still separate. Allow at least 300 MB disk space for speech weights and extraction, and budget runtime memory alongside the generative model.
2. Open PowerShell in the speech pack folder and run:

    .\Start-Whisper.ps1

   The script validates the model and archive again, extracts the verified runtime and starts whisper-server bound to 127.0.0.1:17892 with English recognition and CPU inference. Keep the window open. Stop with Ctrl+C after class. Follow school-approved PowerShell policy; do not disable protective controls. No conversion flag, remote API, or cloud download is required while running. Do not expose the port to the LAN. The service is a trusted local process; the product header checks compatibility, not its identity or configuration. The service may log diagnostic information; check its logging policy before using student voices.
3. In Scoolabs > Smart Teacher choose **Whisper local service (optional)**, then Check Whisper service. Start the lesson.
4. Choose Interrupt and listen during a lesson, or Questions > Listen to question. Approve microphone permission if Windows/WebView2 requests it; wait until the UI says Speak now. Speak for 0.5–12 seconds. Select Finish recording to transcribe early, or let the limit stop recording. Stop listening cancels capture/discards a pending transcript. The microphone track stops before inference; there is no continuous background listening, automatic upload to a cloud or automatically submitted question.
5. Check/correct the editable transcript and explicitly Ask question or Queue for later. The TV does not receive the unsubmitted transcript. Use Return and reread section if you want to restart narration of the current section after questions. If recognition is unavailable, type the question or return to setup and choose built-in Windows speech. Stop/cancel does not guarantee immediate termination of a separate server's already-running inference; the result is discarded and the native request is bounded at 90 seconds.

The operator uses an in-memory Web Audio capture graph (WebView2 ScriptProcessor, muted output), resampled to signed mono 16 kHz PCM. Rust rejects short/oversized or near-silent audio, wraps it as a WAV in memory, and sends it through the fixed loopback multipart endpoint. Proxies and redirects are disabled. Do not enable whisper-server's conversion option, which can write a temporary file. Scoolabs does not write recording files; a separately launched server and operating system are outside its storage guarantees. No fake numerical confidence score is assigned to Whisper. It can still transcribe background noise or hallucinate text, so every transcript requires review.

## Qualification

The automated tests cover sample conversion, WAV header, silence rejection, transcript parsing, browser fallback and existing lesson workflows. The pilot pack workflow uses the upstream public JFK sample to smoke-test the local Windows service with the same multipart contract. That is not a real microphone test. Physical testing must verify WebView2 permission prompts, cancellation/permission-denial handling, microphone and speaker interference, noisy rooms, offline operation, repeated interruption/resumption, Nigerian English and subject terminology, and memory/latency while Qwen is loaded. Measure word error rate and answer usefulness with teacher-reviewed consented test clips. No student-identifying audio should be retained. Do not claim accent accuracy or autonomous conversational teaching until these checks pass.

Upstream: https://github.com/ggml-org/whisper.cpp ; model: https://huggingface.co/ggerganov/whisper.cpp ; model and runtime licensing: MIT. The lock file records the pinned revision and hash provenance.
