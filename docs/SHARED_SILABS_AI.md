# Use the shared Silabs AI engine in Scoolabs

Scoolabs defaults to the existing **Qwen/Qwen3-1.7B** provider in [Simmyt3r/silabs-ai](https://github.com/Simmyt3r/silabs-ai). That project's README and current configuration identify this baseline, while its model registry and some older documentation still name the historical SmolLM2 model. The actual runtime status, not the stale registry, determines compatibility. The large Transformer weight files are intentionally outside Git history; reuse the already materialized model on the PC. Scoolabs does not copy or download those weights.

## Setup with existing model

On a Windows PC with the Silabs AI repository, Python environment and existing local weights at `models/base/Qwen3-1.7B/`, run from the Scoolabs checkout:

    .\scripts\start-shared-silabs-ai.ps1 -SilabsRepo 'C:\Silabs\silabs-ai'

The script requires the existing checkout, config and safetensors files. It overrides the child process configuration to use the exact shared model, pre-load local weights, disable remote model downloads, Hub/Transformers network access, remote code, thinking mode, external RAG and unapproved adapters, keep guardrails enabled and bind to 127.0.0.1:8000. It does not download dependencies or weights. Keep the service window open. If the model has not been materialized, use Silabs AI's documented download/verification process separately on a technician-controlled, connected machine.

Open Scoolabs > Smart Teacher. Select **Silabs AI · Qwen3-1.7B (shared)** (default) and Check local model. A service is marked available only if its /v1/model response reports the expected model, loaded state, guardrails enabled and RAG disabled. Scoolabs rechecks before every shared-service generation request. This check does not certify the server binary, the weight hash, the offline configuration or actual accuracy; use the provided launcher and physical offline test.

The Rust client uses the existing Silabs AI /v1/generate contract with full system/user roles, bounded token limits, X-Silabs-Client: scoolabs, no redirects and no proxy. If local product API authentication is configured in Silabs AI, set SCOOLABS_SILABS_API_KEY in the Scoolabs launch process environment through the technician's secure procedure. Never enter that secret into teaching notes. Keep the API bound to loopback. The client will not silently fall back to a different provider or cloud service.

Generated lesson plans and answer suggestions must pass Scoolabs' existing structured JSON, lesson completeness and source-ID validation, and require supervisor review. The system declines guardrail-intercepted answers and rejects malformed or incomplete responses. Unlike llama.cpp grammar constraints, Silabs Transformers generates plain text, so strict parsing may reject otherwise plausible model output. This is intentional.

## Evaluation

With the service running and network disconnected:

    python scripts/qualify-shared-silabs-ai.py

This smoke benchmark measures four answer/abstention cases and elapsed time using the shared API. It does not download model weights. Independently evaluate lessons, source support, student-friendly language, curriculum coverage and response latency on target school hardware. The 1.7B model has fewer parameters but its unquantized Transformers runtime can require more RAM than the optional 4B quantized GGUF runtime. Benchmark both rather than infer memory requirements from parameter count. Keep prepared lesson delivery for low-spec computers.

## Optional 4B alternative

The tested separate Qwen3-4B-Instruct-2507 GGUF pack remains available through the explicit **Optional Qwen 4B pack · llama.cpp** provider, on loopback port 17891. It is not the default and is never invoked automatically if shared Silabs AI fails. See [OFFLINE_MODEL_PACK.md](OFFLINE_MODEL_PACK.md). The 4B pack passed its four inference smoke cases, not full classroom qualification. The two providers are separate model/runtime configurations, not interchangeable files.

## Remaining engineering work

A real shared runtime benchmark on locally materialized Qwen3-1.7B weights, independent teacher review, support for a vetted quantized 1.7B shared model, and separate classroom TV/operator views remain release gates. No school-specific or student personal data should be shared with the model. The fixed loopback API is not designed for LAN or internet deployment.
