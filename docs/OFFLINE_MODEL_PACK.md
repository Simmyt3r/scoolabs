# Scoolabs optional offline Smart Teacher model pack

This is an experimental separate pack for Windows x64, not the standard installer. It includes Qwen3-4B-Instruct-2507 Q4_K_M weights (2,497,280,736 bytes), quantized by bartowski, and the CPU llama.cpp b10883 archive. MiniLM remains in the standard Scoolabs installer. The lock pins the exact bytes and model revision. The runtime archive SHA-256 is recorded in the upstream build attestation. It is not a security audit or a guarantee of accuracy. Update and review pins before wider deployment.

## One-time connected build (technician)
Use Python 3.11+:

    python scripts/build-teacher-model-pack.py
    python scripts/build-teacher-model-pack.py --check

The first command downloads verified upstream files and their licenses, and assembles the portable folder; the second only checks local payloads. Do not use unverified archives or bypass checksum failures. Allow several GB for download and temporary extraction. The GitHub Actions optional model-pack workflow also builds the separate artifact and attempts real CPU inference smoke cases. A completed package build is not proof of pedagogical quality. Test on the target school's hardware.

## Classroom PC (offline)
1. Install the normal Scoolabs Windows application. Copy or extract the **entire** optional model pack into a technician-controlled folder on the school PC. Do not place it in a shared writable student directory.
2. Review the included provenance and licenses. From PowerShell, run:

    .\Start-Smart-Teacher.ps1

Use your school's approved script execution policy; do not disable security controls. The launcher verifies both SHA-256 hashes, extracts the pinned CPU runtime into a temporary folder, and starts it bound to 127.0.0.1 only. No network connection is necessary. The initial hash check and model load may take time. Keep the PowerShell window open. Press Ctrl+C to stop; if it remains running, the technician should stop the corresponding llama-server process. Do not expose the port on the school network. The pilot has no local API authentication; other local processes can reach it.
3. In Scoolabs, open Smart Teacher, Check local model, and generate a draft or suggest a lesson-backed answer. Review before presenting. If unavailable or too slow, continue with prepared lessons.
4. To benchmark with Python 3.11+ installed, run qualify-teacher-model.py while the service is running. This checks four small smoke cases and elapsed time; it is not a curriculum test.

## Hardware and limitations
Pilot target 8 GB RAM, preferably 16 GB, x64 CPU. Reserve at least 5 GB disk space, and more during extraction/download. CPUs without the required instruction sets, memory pressure and slow inference can prevent startup. These are preliminary targets; actual peak RAM, latency, classroom accuracy and offline operation must be measured. 4 GB machines should remain on the standard prepared-lesson mode. No graphics card is assumed. The model cannot replace an adult supervisor. AI suggestions require approval, and the external TV must be blanked during review until separate display controls are deployed. See LOCAL_TEACHER_MODEL.md in the repository for acceptance gates.

## Third-party attribution
- Base model: Qwen/Qwen3-4B-Instruct-2507 (Apache-2.0), https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507
- Modified model: bartowski's Q4_K_M quantization, https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/tree/d3037fec123e6fcf1b894f42ff01bd83d4622955
- Runtime: llama.cpp (MIT), https://github.com/ggml-org/llama.cpp/releases/tag/b10883
- Runtime provenance: https://github.com/ggml-org/llama.cpp/attestations/46324023
The archive preserves upstream files, including third-party notices where present; QWEN-LICENSE.txt and LLAMA-LICENSE.txt accompany the pack. Review redistribution requirements and all bundled notices before external distribution.
