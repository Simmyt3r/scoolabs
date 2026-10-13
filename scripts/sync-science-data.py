#!/usr/bin/env python3
"""Acquire and validate two versioned scientific reference sources for offline Scoolabs.

The original 118-element dataset is deliberately NOT overwritten. New upstream revisions
must be reviewed against the existing CC BY-SA licensed educational adaptation.
Only a curated selection of 2022 NIST constants becomes a runtime reference JSON.
"""
from __future__ import annotations
import argparse
import datetime
import hashlib
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REVISION = "9090b1c472a1e68f7295e77280f374f8d125cefc"
PERIODIC_URL = (
    "https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/"
    + SOURCE_REVISION + "/PeriodicTableJSON.json"
)
NIST_URL = "https://physics.nist.gov/cuu/Constants/Table/allascii.txt"
OUTPUT = ROOT / "src/data/physical-constants.json"
REPORT = ROOT / "docs/SCIENCE_DATA_SOURCES.md"
SNAPSHOT = ROOT / "science-data-artifacts"
CONSTANT_NAMES = (
    "speed of light in vacuum",
    "Planck constant",
    "elementary charge",
    "Avogadro constant",
    "Boltzmann constant",
    "Newtonian constant of gravitation",
    "electron mass",
    "proton mass",
    "atomic mass constant",
    "molar gas constant",
)

def fetch(url: str, max_bytes: int = 2_000_000) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Scoolabs-data-curator/1.0"})
    with urllib.request.urlopen(request, timeout=35) as response:
        data = response.read(max_bytes + 1)
    if not data or len(data) > max_bytes:
        raise ValueError(f"Refusing empty or oversized reference from {url}")
    return data

def validate_elements(source: bytes, curated: list[dict]) -> dict:
    upstream = json.loads(source)
    rows = upstream.get("elements", [])
    if not isinstance(rows, list):
        raise ValueError("Periodic source missing list of elements")
    elements = {r["number"]: r for r in rows if isinstance(r, dict) and type(r.get("number")) is int}
    if len(curated) != 118 or any(x["number"] != i for i, x in enumerate(curated, 1)):
        raise ValueError("Installed periodic dataset does not have atomic numbers 1–118")
    for i, installed in enumerate(curated, 1):
        remote = elements.get(i)
        if not remote or remote.get("name") != installed["name"] or remote.get("symbol") != installed["symbol"]:
            raise ValueError(f"Upstream element identity differs at atomic number {i}. Review manually.")
    if len(elements) < 118:
        raise ValueError("Upstream periodic table has fewer than 118 recognized elements")
    return {"recognizedElements": 118, "upstreamEntries": len(elements),
            "sha256": hashlib.sha256(source).hexdigest(), "revision": SOURCE_REVISION}

def parse_nist(source: bytes) -> list[dict]:
    text = source.decode("utf-8", "replace")
    if "2022 CODATA adjustment" not in text:
        raise ValueError("Unexpected NIST adjustment; reference update needs scientific review")
    found: dict[str,dict] = {}
    for raw in text.splitlines():
        parts = re.split(r" {2,}", raw.strip(), maxsplit=3)
        if len(parts) < 3:
            continue
        key = parts[0]
        if key not in CONSTANT_NAMES or key in found:
            continue
        value_text = parts[1].strip()
        uncertainty = parts[2].strip()
        unit = parts[3].strip() if len(parts) > 3 else ""
        if not re.fullmatch(r"[0-9 +eE.\-]+", value_text) or not re.search(r"\d", value_text):
            raise ValueError(f"Invalid numeric value from NIST for {key}")
        if len(unit) > 90 or len(uncertainty) > 70:
            raise ValueError("Malformed CODATA row")
        found[key] = {
            "id": re.sub(r"[^a-z0-9]+", "-", key).strip("-"),
            "name": key[0].upper() + key[1:],
            "valueText": value_text,
            "uncertainty": uncertainty,
            "unit": unit,
            "source": "NIST 2022 CODATA",
        }
    missing = set(CONSTANT_NAMES) - found.keys()
    if missing:
        raise ValueError("Missing required NIST constants: " + ", ".join(sorted(missing)))
    return [found[name] for name in CONSTANT_NAMES]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--download", action="store_true", help="Fetch pinned data; no app-time networking")
    parser.add_argument("--check", action="store_true", help="Validate the checked-in reference subset")
    args = parser.parse_args()
    if not args.download and not args.check:
        parser.error("Use --download or --check")
    if args.download:
        periodic = fetch(PERIODIC_URL)
        nist = fetch(NIST_URL)
        curated = json.loads((ROOT / "src/data/elements.json").read_text(encoding="utf-8"))
        periodic_report = validate_elements(periodic, curated)
        constants = parse_nist(nist)
        OUTPUT.write_text(json.dumps(constants, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
        SNAPSHOT.mkdir(exist_ok=True)
        (SNAPSHOT / "source-hashes.json").write_text(json.dumps({
            "periodic": {"url": PERIODIC_URL, **periodic_report},
            "nist": {"url": NIST_URL, "sha256": hashlib.sha256(nist).hexdigest(),
                     "edition": "2022 CODATA", "entries": len(constants)},
            "retrievedUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }, indent=2)+"\n", encoding="utf-8")
        REPORT.write_text(
            "# Science reference data provenance\n\n"
            "This is a **build-time** download, never an application-time network request.\n\n"
            "## Chemistry\n\n"
            f"Source: {PERIODIC_URL}\n\n"
            f"Upstream Git revision: \`{SOURCE_REVISION}\`. "
            "The existing 118-element licensed Scoolabs adaptation remains unchanged. "
            "The workflow compares all names, numbers and symbols against the pinned upstream snapshot. "
            "Original licensing and transformation information: [ELEMENT_DATA_ATTRIBUTION.md](ELEMENT_DATA_ATTRIBUTION.md). "
            "Reference tables are not chemical safety data sheets.\n\n"
            "## Physics\n\n"
            f"Source: {NIST_URL}\n\n"
            "Reference: 2022 CODATA recommended values, NIST Standard Reference Database 121 (May 2024). "
            "Only ten selected entries are distributed in \`src/data/physical-constants.json\`, "
            "including uncertainties and units. Displayed values are source strings so no precision is silently invented.\n\n"
            "## Review boundary\n\n"
            "New upstream data is validated automatically but still requires a qualified science-teacher review. "
            "Source hashes from each download are published in the workflow artifact, not generated during app use.\n",
            encoding="utf-8",
        )
        print("Downloaded: periodic source hash and",len(constants),"CODATA constants")
    stored = json.loads(OUTPUT.read_text(encoding="utf-8"))
    if len(stored) != len(CONSTANT_NAMES) or [row["name"].casefold() for row in stored] != [name.casefold() for name in CONSTANT_NAMES]:
        raise ValueError("The packaged physics constants list has unexpected names or order")
    for row in stored:
        if row.get("source") != "NIST 2022 CODATA" or not row.get("valueText") or "unit" not in row:
            raise ValueError("Invalid CODATA constant metadata")
    print("PASS: ten offline physics constants, named provenance and preserved atomic elements")

if __name__ == "__main__":
    main()
