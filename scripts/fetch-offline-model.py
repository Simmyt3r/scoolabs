#!/usr/bin/env python3
"""Stage a verified optional offline retrieval model as a GitHub Actions artifact.

The application does not load this candidate or silently connect to Hugging Face.
Only import model weights into a *separately evaluated* desktop package after QA.
"""
import argparse
import hashlib
import json
import pathlib
import urllib.request
from urllib.parse import urlsplit

ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/"model-candidate-artifacts"
REPO="Xenova/all-MiniLM-L6-v2"
BASE=f"https://huggingface.co/{REPO}/resolve/main/"
WEIGHTS="onnx/model_quantized.onnx"
EXPECTED_SHA256="afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1"
EXPECTED_BYTES=22972370
FILES={WEIGHTS:25_000_000,"tokenizer.json":2_000_000,"config.json":200_000,
       "tokenizer_config.json":200_000,"special_tokens_map.json":200_000,"README.md":100_000}
def download(name,limit):
    req=urllib.request.Request(BASE+name,headers={"User-Agent":"Scoolabs-verified-build/1.0"})
    with urllib.request.urlopen(req,timeout=120) as response:
        host=urlsplit(response.geturl()).hostname or ""
        if not (host=="huggingface.co" or host.endswith(".huggingface.co") or
                host=="hf.co" or host.endswith(".hf.co")):
            raise ValueError("Unapproved asset redirect host: "+host)
        data=response.read(limit+1)
    if not data or len(data)>limit:raise ValueError(f"Invalid size for {name}")
    path=DEST/name
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(data)
def check():
    entries={}
    for name,limit in FILES.items():
        path=DEST/name
        if not path.is_file():raise FileNotFoundError(path)
        size=path.stat().st_size
        if not 0<size<=limit:raise ValueError(f"Invalid size: {name}")
        sha=hashlib.file_digest(path.open("rb"),"sha256").hexdigest()
        entries[name]={"bytes":size,"sha256":sha}
    weight=entries[WEIGHTS]
    if weight["sha256"]!=EXPECTED_SHA256 or weight["bytes"]!=EXPECTED_BYTES:
        raise ValueError("ONNX checksum or size changed: review upstream model before use")
    metadata=json.loads((DEST/"config.json").read_text(encoding="utf-8"))
    if metadata.get("model_type")!="bert":raise ValueError("Unexpected model architecture")
    tokenizer=json.loads((DEST/"tokenizer.json").read_text(encoding="utf-8"))
    if not isinstance(tokenizer.get("model"),dict):raise ValueError("Invalid tokenizer")
    (DEST/"PROVENANCE.json").write_text(json.dumps({
      "repository":REPO,"origin":f"https://huggingface.co/{REPO}",
      "requestedRef":"main","license":"Apache-2.0 (model-card declaration)",
      "purpose":"optional semantic science reference retrieval candidate; not a generative tutor",
      "packagedInInstaller":False,"files":entries
    },indent=2)+"\n",encoding="utf-8")
    print("PASS: optional offline embedding model and tokenizer verified",weight["bytes"],"bytes")
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--download",action="store_true")
    ap.add_argument("--check",action="store_true")
    args=ap.parse_args()
    if not args.download and not args.check:ap.error("specify --download or --check")
    if args.download:
        for name,limit in FILES.items():download(name,limit)
    if args.check or args.download:check()
if __name__=="__main__":main()
