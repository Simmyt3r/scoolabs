#!/usr/bin/env python3
"""Acquire a compact verified taxonomy index; never copy occurrences or photos.
Only exact species names from a fixed school-focused list are included.
"""
import argparse
import datetime
import hashlib
import json
import pathlib
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"src/data/taxonomy.json"
REPORT=ROOT/"docs/TAXONOMY_DATA.md"
TAXA=(
  ("Allium cepa","Plantae"),("Saccharomyces cerevisiae","Fungi"),
  ("Zea mays","Plantae"),("Oryza sativa","Plantae"),("Sorghum bicolor","Plantae"),
  ("Manihot esculenta","Plantae"),("Vigna unguiculata","Plantae"),
  ("Arachis hypogaea","Plantae"),("Solanum lycopersicum","Plantae"),
  ("Bos taurus","Animalia"),("Capra hircus","Animalia"),("Gallus gallus","Animalia"),
)
def fetch(name):
    query=urllib.parse.urlencode({"name":name,"strict":"true","rank":"SPECIES"})
    url="https://api.gbif.org/v1/species/match?"+query
    req=urllib.request.Request(url,headers={"User-Agent":"Scoolabs-taxonomy-reference/1.0"})
    with urllib.request.urlopen(req,timeout=45) as response:
        if urllib.parse.urlsplit(response.geturl()).hostname!="api.gbif.org":
            raise ValueError("Unexpected taxonomy provider")
        raw=response.read(25_001)
    if len(raw)>25_000:raise ValueError("Taxonomy response too large")
    return json.loads(raw),url,hashlib.sha256(raw).hexdigest()
def validate(rows):
    if not isinstance(rows,list) or len(rows)!=len(TAXA):raise ValueError("Taxonomy source incomplete")
    for (expected,kingdom),row in zip(TAXA,rows):
        if row.get("name")!=expected or row.get("kingdom")!=kingdom:
            raise ValueError("Wrong taxon or kingdom: "+expected)
        if row.get("rank")!="SPECIES" or type(row.get("gbifKey")) is not int or row["gbifKey"]<=0:
            raise ValueError("Unexpected species rank/key")
        if not isinstance(row.get("family"),str) or len(row["family"])<3:
            raise ValueError("Missing family")
        if row.get("source")!="https://www.gbif.org/species/"+str(row["gbifKey"]):
            raise ValueError("Incorrect provenance URL")
        if not row.get("acceptedName"):raise ValueError("Empty accepted name")
    if len({row["gbifKey"] for row in rows})!=len(rows):
        raise ValueError("Taxon IDs are not distinct")
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--download",action="store_true")
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    if not(args.download or args.check):parser.error("Select --download or --check")
    if args.download:
        out=[];logs=[]
        for name,kingdom in TAXA:
            raw,url,sha=fetch(name)
            if raw.get("matchType")!="EXACT" or raw.get("rank")!="SPECIES" or raw.get("kingdom")!=kingdom:
                raise ValueError("Source needs manual review: "+name)
            if raw.get("canonicalName","").casefold()!=name.casefold():
                raise ValueError("Name match drift: "+name)
            key=raw.get("usageKey")
            if type(key) is not int or key<=0:raise ValueError("Missing usage key: "+name)
            out.append({"name":name,"acceptedName":str(raw.get("scientificName",name)),
                "gbifKey":key,"rank":"SPECIES","kingdom":kingdom,
                "family":str(raw.get("family","")),"source":f"https://www.gbif.org/species/{key}"})
            logs.append((name,url,sha,key))
        validate(out)
        OUTPUT.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
        retrieved=datetime.datetime.now(datetime.timezone.utc).isoformat()
        lines=["# GBIF species taxonomy for Scoolabs","","Only taxonomic identifiers and family/kingdom names are included. No photos, species occurrence records, distribution claims, cultivation advice or inference are downloaded.","",
        "Reference: GBIF Secretariat, GBIF Backbone Taxonomy, https://doi.org/10.15468/39omei. Accessed UTC: "+retrieved,"",
        "| Queried species | API match | SHA-256 of response | GBIF key |",
        "| --- | --- | --- | --- |"]
        lines.extend(f"| {n} | {u} | \`{h}\` | {k} |" for n,u,h,k in logs)
        lines.extend(["","Source identities are subject to taxonomic changes. All name, rank and kingdom mismatches cause workflow failure and require educator review. No internet connection is needed to view the saved pack."])
        REPORT.write_text("\n".join(lines)+"\n",encoding="utf-8")
        print("Downloaded",len(out),"matched taxa")
    if args.check:
        validate(json.loads(OUTPUT.read_text(encoding="utf-8")))
        print("PASS: validated",len(TAXA),"curated offline species identities")
if __name__=="__main__":main()
