#!/usr/bin/env python3
"""Build a separate, checksum-pinned Windows CPU pilot pack (no runtime download).
Run only during connected technician setup or explicitly requested CI packaging.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
LOCK_PATH = ROOT / "scripts" / "teacher-model-pack.lock.json"
LOCK = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
CHUNK = 1024 * 1024


def digest(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def verify(path, spec):
    if not path.is_file() or path.is_symlink():
        raise ValueError(f"Missing regular file: {path.name}")
    size = path.stat().st_size
    if "bytes" in spec and size != spec["bytes"]:
        raise ValueError(f"Size mismatch: {path.name}")
    if size <= 0 or size > spec.get("max_bytes", spec.get("bytes", 0)):
        raise ValueError(f"Invalid file size: {path.name}")
    if digest(path) != spec["sha256"]:
        raise ValueError(f"SHA-256 mismatch: {path.name}")
    if spec["name"] == "model.gguf":
        with path.open("rb") as f:
            if f.read(4) != b"GGUF":
                raise ValueError("Invalid GGUF model header")


def fetch(spec, dest):
    if dest.exists():
        verify(dest, spec)
        print(f"Reusing verified {dest.name}", flush=True)
        return
    partial = dest.with_suffix(dest.suffix + ".part")
    cap = spec.get("max_bytes", spec.get("bytes", 0))
    try:
        total = 0
        with OPENER.open(spec["url"], timeout=90) as response, partial.open("wb") as out:
            if not response.geturl().startswith("https://"):
                raise ValueError("Download redirected outside HTTPS")
            while chunk := response.read(CHUNK):
                total += len(chunk)
                if total > cap:
                    raise ValueError("Download exceeds pinned size limit")
                out.write(chunk)
                if total % (128 * CHUNK) < CHUNK:
                    print(f"{dest.name}: {total // CHUNK} MiB", flush=True)
        verify(partial, spec)
        partial.replace(dest)
    finally:
        partial.unlink(missing_ok=True)


def fetch_text(url, dest):
    with OPENER.open(url, timeout=60) as response:
        if not response.geturl().startswith("https://"):
            raise ValueError("License redirected outside HTTPS")
        raw = response.read(131073)
    if not raw or len(raw) > 131072 or b"<html" in raw[:512].lower():
        raise ValueError("Invalid upstream license text")
    raw.decode("utf-8")
    dest.write_bytes(raw)


def extract_runtime(archive, dest):
    """Validate all archive entries before writing any; no links or path traversal."""
    with zipfile.ZipFile(archive) as z:
        entries = z.infolist()
        if len(entries) > 500 or sum(i.file_size for i in entries) > 1500 * CHUNK:
            raise ValueError("Runtime archive exceeds extraction limits")
        seen = set()
        for i in entries:
            name = i.filename.replace("\\", "/").rstrip("/")
            parts = name.split("/")
            if not name or any(not p or p in (".", "..") or ":" in p or p.endswith((".", " ")) for p in parts):
                raise ValueError("Unsafe runtime archive path")
            if name.casefold() in seen or stat.S_ISLNK(i.external_attr >> 16):
                raise ValueError("Duplicate or linked runtime archive entry")
            seen.add(name.casefold())
        for i in entries:
            target = dest.joinpath(*i.filename.replace("\\", "/").rstrip("/").split("/"))
            if i.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with z.open(i) as src, target.open("xb") as out:
                    shutil.copyfileobj(src, out)
    servers = list(dest.rglob("llama-server.exe"))
    if len(servers) != 1:
        raise ValueError("Exactly one Windows llama-server executable is required")
    return servers[0]


def verify_pack(dest):
    for key in ("model", "runtime"):
        spec = LOCK[key]
        verify(dest / spec["name"], spec)


def build(dest):
    dest.mkdir(parents=True, exist_ok=True)
    if shutil.disk_usage(dest).free < 4 * 1024 ** 3 and not (dest / "model.gguf").exists():
        raise ValueError("At least 4 GiB free is needed to build the pilot pack.")
    for key in ("model", "runtime"):
        spec = LOCK[key]
        fetch(spec, dest / spec["name"])
    verify_pack(dest)
    with tempfile.TemporaryDirectory() as temp:
        extract_runtime(dest / "runtime.zip", Path(temp))
    fetch_text(LOCK["model"]["license_url"], dest / "QWEN-LICENSE.txt")
    fetch_text(LOCK["runtime"]["license_url"], dest / "LLAMA-LICENSE.txt")
    shutil.copyfile(LOCK_PATH, dest / "PROVENANCE.json")
    shutil.copyfile(ROOT / "scripts" / "start-teacher-pack.ps1", dest / "Start-Smart-Teacher.ps1")
    shutil.copyfile(ROOT / "scripts" / "qualify-teacher-model.py", dest / "qualify-teacher-model.py")
    shutil.copyfile(ROOT / "docs" / "OFFLINE_MODEL_PACK.md", dest / "README.md")
    print("Verified portable pack assembled. Actual classroom performance is not certified.", flush=True)


def smoke(dest):
    if os.name != "nt":
        raise ValueError("The pinned runtime is Windows x64 only.")
    verify_pack(dest)
    with tempfile.TemporaryDirectory() as temp:
        server = extract_runtime(dest / "runtime.zip", Path(temp))
        with (dest / "pilot-smoke-server.log").open("w", encoding="utf-8") as log:
            process = subprocess.Popen(
                [str(server), "-m", str((dest / "model.gguf").resolve()), "--host", "127.0.0.1",
                 "--port", "17891", "--alias", "scoolabs-teacher", "-c", "8192", "-np", "1", "-ngl", "0"],
                cwd=server.parent, stdout=log, stderr=subprocess.STDOUT,
            )
            try:
                deadline = time.monotonic() + 180
                while time.monotonic() < deadline:
                    if process.poll() is not None:
                        raise RuntimeError("Pinned runtime exited before health check")
                    try:
                        with OPENER.open("http://127.0.0.1:17891/health", timeout=3) as r:
                            if json.load(r).get("status") == "ok":
                                break
                    except (OSError, ValueError):
                        pass
                    time.sleep(3)
                else:
                    raise TimeoutError("Model did not become ready")
                subprocess.run([os.sys.executable, str(ROOT / "scripts" / "qualify-teacher-model.py")], check=True, timeout=900)
            finally:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "teacher-model-pack")
    parser.add_argument("--check", action="store_true", help="Verify existing pinned weights and runtime, without network")
    parser.add_argument("--smoke", action="store_true", help="Run real local Windows model inference checks after verification")
    args = parser.parse_args()
    dest = args.output.resolve()
    if args.check or args.smoke:
        verify_pack(dest)
        print("Pack weights and runtime checksums passed.", flush=True)
    if args.smoke:
        smoke(dest)
    elif not args.check:
        build(dest)


if __name__ == "__main__":
    main()
