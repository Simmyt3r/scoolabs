# Scoolabs: AI and science references inside the Windows installer

## What is bundled (v0.13)
The Windows NSIS installer now contains a dedicated offline resource pack under the Tauri resource directory at `offline-assets/`. The pack comprises all five validated source science JSON datasets, the quantised Xenova/all-MiniLM-L6-v2 ONNX weights, tokenizer and metadata, the model card, provenance and a file-by-file SHA-256 manifest.

The build downloads and audits the model using `scripts/fetch-offline-model.py`, then runs `scripts/prepare-installer-assets.py --prepare --check` before packaging. The ONNX model has fixed size 22,972,370 bytes and pinned SHA-256 `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1`. The build fails if it changes. Other acquired model files are integrity-checked against the generated manifest and retain provenance; independent hash pinning of every upstream tokenizer file remains a release-hardening task.

On application startup, the local desktop status panel can inspect the installed manifest and recompute file hashes through a read-only Tauri command. This reads no pupil data and makes no network requests. The ordinary reference atlas and teacher-authored formative study recommendations already work offline using frontend-bundled source content.

## v0.14: teacher-grounded semantic retrieval

Students can open **Offline AI Search** from the navigation menu. The first option searches bundled references by matching words. The second option loads the quantised ONNX sentence embedding model locally, using packaged ONNX Runtime WASM files, and ranks reference records by semantic similarity. The system displays only pre-existing science facts and their source labels/links. It does not construct new scientific claims. Chemistry elements keep fast exact matching to avoid embedding 118 extra records on low-memory school machines.

The pipeline sets `env.allowRemoteModels=false`, `env.localModelPath` to a bundled application directory, `env.backends.onnx.wasm.wasmPaths` to a bundled WASM directory, and a one-thread CPU limit. No query, pupil record or model download is sent to the internet at application runtime. A model failure results in a clearly labelled standard keyword search.

Windows CI executes an actual local embedding smoke test and checks the completed NSIS installer archive contains the runtime binaries and model weights. This does not replace a classroom installation test on Windows 10 hardware; first-query latency and memory use require measurement.

## Important distinction: semantic retrieval is not live AI tutoring
The MiniLM model is **an embedding / semantic retrieval candidate**, not a language model that writes answers. The installer ships its files for research and later integration, **enables explicitly requested local ONNX semantic ranking**, but does not enable generative tutoring, automated grading or lab-safety advice. The UI accurately labels experimental semantic search and does not advertise a generative science tutor.

## Build and test
1. Run `python scripts/sync-science-data.py --check`, `python scripts/sync-pubchem.py --check`, and `python scripts/sync-taxonomy.py --check`.
2. With internet in a build environment, run `python scripts/fetch-offline-model.py --download --check`.
3. Run `python scripts/prepare-installer-assets.py --prepare --check`.
4. Run `npm run tauri build`. This makes the Windows NSIS installer with the staged AI and datasets.
5. Install on an offline Windows 10 device, open the student's progress dashboard and verify all five datasets and the model are reported. Test all four science subjects without connecting to the internet.

## Remaining release gates
- Independently pin tokenizer/config source revision and all upstream SHA-256 digests.
- Benchmark and qualify local WASM inference startup, memory, latency and installer footprint on low-power Windows 10 laptops.
- Build teacher-reviewed subject retrieval passages and accuracy/safety evaluation. Never fabricate citations or scientific claims.
- Test actual Windows NSIS installation and clean uninstall, including offline WebView2 setup.
- Get curriculum specialists to review content before declaring classroom deployment readiness.

Scoolabs remains an offline learning aid. Its source science datasets are teaching references, not unsupervised laboratory protocols.
