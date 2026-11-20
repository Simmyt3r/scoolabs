# Optional local Smart Teacher model (experimental)

**Default provider:** [Shared Silabs AI Qwen3-1.7B](SHARED_SILABS_AI.md). The llama.cpp instructions below describe the explicitly selected alternative provider.

For the reproducible separate CPU pilot model pack and Windows launcher, see [offline model pack](OFFLINE_MODEL_PACK.md). The base installer still includes MiniLM for retrieval, teacher-reviewed lessons, OS-local narration and experimental Windows speech recognition. These work without a generative model. MiniLM does not generate lessons. This optional adapter communicates with a separately installed local llama.cpp server; it does not download, embed, launch or authenticate a model.

## Pilot installation (school technician)
1. First measure the target PC's RAM, CPU, free disk and Windows version. Test on 8 GB RAM with a compact 4-bit model; 16 GB is preferable. Keep 4 GB PCs on the prepared-lesson edition. These are pilot targets, not guaranteed requirements.
2. Obtain a vetted Windows llama.cpp release and compatible GGUF model from official or approved sources. Candidate: Qwen3-4B-Instruct-2507, 4-bit Q4_K_M, roughly 2.5 GB of weights. Verify license, release revision, publisher/provenance and SHA-256 against the approved distribution record before use. No model or runtime is bundled by this PR.
3. Extract the runtime to a local directory and keep the GGUF in the school-approved model directory. From PowerShell, substitute your actual file paths:

```powershell
& 'C:\ScoolabsAI\llama-server.exe' -m 'C:\ScoolabsAI\model.gguf' --host 127.0.0.1 --port 17891 --alias scoolabs-teacher -c 8192 -np 1 -ngl 0
```

This is a manually operated CPU-only pilot service. Do not expose it on 0.0.0.0 or a school network. Do not use a cloud proxy, forward the port, enable tools or remote downloads, or enter personal pupil information. Other local processes may reach the plain HTTP endpoint; treat the technician and host as trusted. Configure the server not to retain prompt logs and test disconnected from the internet. Scoolabs sends data only to the fixed loopback endpoint, disables HTTP proxies and redirects, and makes requests only by explicit user action. A successful health probe is not proof of model identity or privacy of a manually configured service.
4. Open Scoolabs > Smart Teacher > Check local model. Type a topic and a teaching outline (1–6,000 characters), optionally select a relevant existing reference, then choose Generate AI lesson draft. Check every generated claim, example, source, activity and answer. The draft must include the required teaching stages and at least two Q/A pairs. Approve the reviewed draft before presenting. Edits invalidate approval. Existing deterministic reference drafts are unaffected.
5. During a lesson, ask a question normally. Exact approved answers take priority. If the answer is not approved, an explicit Suggest AI answer action can request a local draft using selected lesson passages. If no sufficiently related passage exists, the model is not called. The model can abstain. Returned passage IDs must exist in the supplied set, but that does not prove entailment or correctness. The initial excerpt/deferral remains visible. Temporarily blank the external TV or disconnect it before opening the supervisor review; the current implementation uses the same window for both. Review the suggestion and listed evidence, approve or reject, and reconnect the display when ready. Only an approved suggestion can become a narrated answer.
6. Discard pending generation to ignore its eventual result; it does not cancel inference inside the separately running server. Only one native generation at a time is permitted; requests have a 180-second timeout and bounded inputs and outputs. Shut down the local server separately when finished. No runtime model download occurs.
7. To test service reachability and a small set of answer/abstention cases, run python scripts/qualify-teacher-model.py with the server on the same PC, offline. Record the model hash, revision, CPU, RAM, observed peak memory and latency. This is a smoke check, not scientific or pedagogic qualification.

## Acceptance and deployment gates
- With network disconnected, verify correct local-only requests and functioning fallback when the service is stopped. Check invalid model responses, server busy/timeout, rejection, draft review and a discarded result.
- Measure lesson preparation and question-answer latency on actual 4 GB, 8 GB and 16 GB school hardware. The optional 4B model may be too slow or memory-heavy; use a smaller candidate or a stronger dedicated machine rather than forcing deployment.
- Evaluate at least 100 teacher-reviewed cases across school subjects, including short and long questions, misconceptions, calculations, ambiguous and out-of-scope questions, malicious instructions in user content, safety and age appropriateness. Independent subject teachers must verify scientific correctness and source support. Record failure rates and abstention, not just average answer quality.
- Test real classroom microphones, TV projection, pauses, review and takeover. A separate operator display remains a release gate for live generated answers when a TV is mirrored.
- Do not advertise certified curriculum alignment, automatic teacher replacement, verified model accuracy or full autonomy. Models cannot substitute for appropriate adult supervision.

Sources: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md ; https://github.com/ggml-org/llama.cpp/releases ; https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507 ; https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF .
