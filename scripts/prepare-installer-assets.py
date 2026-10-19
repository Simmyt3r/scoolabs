#!/usr/bin/env python3
"""Prepare and independently verify the offline assets copied into the Windows installer.

No downloads are performed by this script. The CI pipeline first acquires the audited
embedding model; this stage packages it alongside committed science references.
"""
import argparse
import hashlib
import json
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "data"
MODEL_SOURCE = ROOT / "model-candidate-artifacts"
DEST = ROOT / "src-tauri" / "resources" / "offline-assets"
SCIENCE = {
    "elements.json": 100,
    "compounds.json": 15,
    "physical-constants.json": 10,
    "taxonomy.json": 12,
    "reference-atlas.json": 10,
}
MODEL = (
    "onnx/model_quantized.onnx",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    "config.json",
    "README.md",
    "PROVENANCE.json",
)
MODEL_SHA256 = "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1"
MODEL_BYTES = 22972370

WEBROOT = ROOT / "public" / "offline-ai"
MODEL_WEB = WEBROOT / "models" / "Xenova" / "all-MiniLM-L6-v2"
WASM_WEB = WEBROOT / "wasm"


def stage_browser_runtime():
    """Copy pinned model and local WASM execution binaries into the bundled web app."""
    if WEBROOT.exists():
        shutil.rmtree(WEBROOT)
    for relative in MODEL:
        target = MODEL_WEB / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(MODEL_SOURCE / relative, target)
    candidates = [
        ROOT / "node_modules" / "onnxruntime-web" / "dist",
        ROOT / "node_modules" / "@xenova" / "transformers" / "node_modules" / "onnxruntime-web" / "dist",
    ]
    wasm_assets = []
    for folder in candidates:
        if folder.is_dir():
            wasm_assets = sorted(folder.glob("ort-wasm*.wasm"))
            if wasm_assets:
                break
    if not wasm_assets:
        raise FileNotFoundError("ONNX Runtime WASM binaries missing; run npm install first")
    WASM_WEB.mkdir(parents=True, exist_ok=True)
    for item in wasm_assets:
        shutil.copyfile(item, WASM_WEB / item.name)
    print(f"Staged {len(wasm_assets)} local ONNX Runtime WASM binaries")


def check_browser_runtime():
    for relative in MODEL:
        source = MODEL_SOURCE / relative
        installed = MODEL_WEB / relative
        if not installed.is_file() or digest(installed) != digest(source):
            raise ValueError(f"Local web model component missing or changed: {relative}")
    wasm_assets = list(WASM_WEB.glob("ort-wasm*.wasm")) if WASM_WEB.exists() else []
    if not wasm_assets or any(item.stat().st_size < 10000 for item in wasm_assets):
        raise ValueError("ONNX WASM execution binaries missing or incomplete")
    print(f"PASS: local AI frontend contains model and {len(wasm_assets)} WASM binaries")


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def validate_science():
    for name, minimum in SCIENCE.items():
        path = SOURCE / name
        entries = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(entries, list) or len(entries) < minimum:
            raise ValueError(f"Invalid or incomplete science reference: {name}")
        if not all(isinstance(row, dict) for row in entries):
            raise ValueError(f"Malformed science reference rows: {name}")
    print(f"PASS: {len(SCIENCE)} source science datasets validated")


def verify_model_source():
    weights = MODEL_SOURCE / MODEL[0]
    if not weights.is_file() or weights.stat().st_size != MODEL_BYTES or digest(weights) != MODEL_SHA256:
        raise ValueError("Bundled AI model differs from the audited ONNX checksum")
    provenance = json.loads((MODEL_SOURCE / "PROVENANCE.json").read_text(encoding="utf-8"))
    if provenance.get("repository") != "Xenova/all-MiniLM-L6-v2":
        raise ValueError("Model provenance does not match approved source")
    if provenance.get("files", {}).get(MODEL[0], {}).get("sha256") != MODEL_SHA256:
        raise ValueError("Model provenance digest mismatch")
    for name in MODEL:
        path = MODEL_SOURCE / name
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f"Missing AI component: {name}")


def rows():
    result = []
    for name in SCIENCE:
        result.append(("science", f"data/{name}", SOURCE / name))
    for name in MODEL:
        result.append(("model", f"model/{name}", MODEL_SOURCE / name))
    return result


def prepare():
    validate_science()
    verify_model_source()
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)
    entries = []
    for kind, relative, source in rows():
        target = DEST / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        if relative == "model/PROVENANCE.json":
            info = json.loads(target.read_text(encoding="utf-8"))
            info["packagedInInstaller"] = True
            info["executionEnabled"] = False
            target.write_text(json.dumps(info, indent=2) + "\n", encoding="utf-8")
        entries.append({
            "kind": kind,
            "path": relative,
            "bytes": target.stat().st_size,
            "sha256": digest(target),
        })
    manifest = {
        "schemaVersion": 1,
        "assetPack": "Scoolabs offline science + quantised embedding model",
        "model": "Xenova/all-MiniLM-L6-v2",
        "modelPurpose": "retrieval embedding; inference pending classroom qualification",
        "files": entries,
    }
    (DEST / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    stage_browser_runtime()


def check():
    manifest = json.loads((DEST / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("schemaVersion") != 1:
        raise ValueError("Unsupported resource manifest")
    expected = {f"data/{name}" for name in SCIENCE}
    expected.update(f"model/{name}" for name in MODEL)
    entries = manifest.get("files")
    if not isinstance(entries, list) or {entry.get("path") for entry in entries} != expected or len(entries) != len(expected):
        raise ValueError("Missing or unexpected installer resource files")
    for entry in entries:
        relative = entry["path"]
        path = DEST / relative
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"Missing staged resource: {relative}")
        if path.stat().st_size != entry["bytes"] or digest(path) != entry["sha256"]:
            raise ValueError(f"Installer resource failed checksum verification: {relative}")
    weights = DEST / "model" / MODEL[0]
    if weights.stat().st_size != MODEL_BYTES or digest(weights) != MODEL_SHA256:
        raise ValueError("Audited model checksum mismatch in installer staging")
    check_browser_runtime()
    print(f"PASS: installer resource manifest verified ({len(entries)} files)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare", action="store_true")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--validate-source", action="store_true")
    args = parser.parse_args()
    if not (args.prepare or args.check or args.validate_source):
        parser.error("Choose --prepare, --check or --validate-source")
    if args.prepare:
        prepare()
    if args.check:
        check()
    if args.validate_source:
        validate_science()


if __name__ == "__main__":
    main()
