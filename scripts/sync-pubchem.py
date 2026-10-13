#!/usr/bin/env python3
"""Download a small, validated, attributed PubChem compound reference for offline Scoolabs.
No AI inference, hazardous handling instructions, or live network requests at application runtime.
"""
import argparse, json, urllib.request, pathlib, time, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/"src/data/compounds.json"
TARGETS=[
  (962,"Water"),(702,"Ethanol"),(5234,"Sodium chloride"),(176,"Acetic acid"),
  (5793,"Glucose"),(280,"Carbon dioxide"),(222,"Ammonia"),(297,"Methane"),
  (10112,"Calcium carbonate"),(14798,"Sodium hydroxide"),(313,"Hydrochloric acid"),
  (1118,"Sulfuric acid"),(784,"Hydrogen peroxide"),(2519,"Caffeine"),(2244,"Aspirin")
]
BASE="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/"
FIELDS="MolecularFormula,MolecularWeight,IUPACName"
def fetch():
  ids=",".join(str(cid) for cid,_ in TARGETS)
  url=BASE+ids+"/property/"+FIELDS+"/JSON"
  req=urllib.request.Request(url,headers={"User-Agent":"Scoolabs-educational-reference/0.12 (research and attribution)"})
  for attempt in range(4):
    try:
      with urllib.request.urlopen(req,timeout=45) as response:
        data=response.read(250000)
      return json.loads(data),url,hashlib.sha256(data).hexdigest()
    except Exception:
      if attempt==3: raise
      time.sleep(4*(attempt+1))
def validate(records):
  assert isinstance(records,list) and len(records)==len(TARGETS),"Unexpected compound count"
  expected=dict(TARGETS)
  seen=set()
  for row in records:
    assert row["cid"] in expected and row["cid"] not in seen
    seen.add(row["cid"])
    assert row["name"]==expected[row["cid"]]
    assert len(row["formula"])<80 and row["formula"].strip()
    assert len(row["iupacName"])<250
    assert isinstance(row["molecularWeight"],(int,float)) and 1<=row["molecularWeight"]<2000
    assert row["source"]==f"https://pubchem.ncbi.nlm.nih.gov/compound/{row['cid']}"
  assert seen==set(expected)
def main():
  parser=argparse.ArgumentParser()
  parser.add_argument("--download",action="store_true")
  parser.add_argument("--check",action="store_true")
  args=parser.parse_args()
  if args.download:
    payload,url,digest=fetch()
    raw=payload["PropertyTable"]["Properties"]
    lookup={int(row["CID"]):row for row in raw}
    assert set(lookup)=={cid for cid,_ in TARGETS},"Compound IDs do not match requested CIDs"
    rows=[]
    for cid,name in TARGETS:
      row=lookup[cid]
      # No unsafe handling advice, only identification fields and molar mass.
      rows.append({"cid":cid,"name":name,"formula":str(row["MolecularFormula"]),
        "molecularWeight":float(row["MolecularWeight"]),
        "iupacName":str(row.get("IUPACName","")),"source":f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}"})
    validate(rows)
    DEST.parent.mkdir(parents=True,exist_ok=True)
    DEST.write_text(json.dumps(rows,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    report=ROOT/"docs/PUBCHEM_DATA.md"
    report.write_text("# PubChem molecular property reference\n\nSource: "+url+"\n\nRetrieval SHA-256: "+digest+
      "\n\nThese data cover 15 named compounds and come from the US NIH PubChem PUG REST service. "+
      "The app bundles only CID, chemical formula, molecular weight and IUPAC name. "+
      "Reference values and identification are not safety instructions; review primary sources before use. "+
      "Source information: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest\n",encoding="utf-8")
    print("Downloaded and validated",len(rows),"PubChem compounds.")
  if args.check or not args.download:
    rows=json.loads(DEST.read_text(encoding="utf-8"));validate(rows)
    print("Validated offline compound reference:",len(rows))
if __name__=="__main__": main()
