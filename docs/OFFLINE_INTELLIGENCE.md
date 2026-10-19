# Scoolabs: offline intelligence and optional model acquisition

## What ships now
A transparent formative recommendation engine reads a student's **latest valid local two-question self-check** and existing practical records. It prioritises missed questions, reproduces teacher-authored explanations, and recommends an actionable next practical. It does not transmit student data, predict IQ, assign official grades, or claim scientific mastery. Teachers remain responsible for assessment.

## Optional pretrained asset workflow
The [candidate acquisition workflow](../.github/workflows/offline-ai-model.yml) downloads the Apache-2.0 [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) English sentence-embedding model. It retrieves a quantised ONNX weight file, tokenizer, config and model card, checks the 22,972,370-byte model SHA-256 **afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1**, and publishes the verified files and provenance as a 30-day GitHub Actions artifact.

The expected checksum is a fixed reviewed release gate. Any upstream change makes the workflow fail, not silently upgrade. Tokenizer files are fetched with the same run and their hashes are recorded for the artifact, but their hashes are not yet independently pinned; this must be resolved before shipping. The model is a **retrieval/semantic-similarity model**, not a question-answering or laboratory safety model.

## Production gates, not yet passed
- Benchmark offline startup, memory and retrieval latency on low-power Windows 10 machines.
- Lock the full revision and hashes for tokenizer, config and dependencies.
- Create a teacher-reviewed biology, chemistry, physics and agriculture fact set with citations and exact-answer checks.
- Evaluate hallucination, out-of-scope, unsafe lab advice and educational bias before any AI response is shown.
- Package model only as an **optional offline download**, with explicit installer size and license notice; never add runtime download requests.
- Validate result quality in a Nigerian secondary-school pilot; formative activity is not a proficiency score.

Existing [science reference](SCIENCE_DATA_SOURCES.md) and [PubChem](PUBCHEM_DATA.md) acquisition workflows continue to support reproducible content. The current training UI does not depend on the optional model artifact.
