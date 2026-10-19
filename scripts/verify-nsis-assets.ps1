# Verify that the output NSIS archive actually includes the audited offline data.
# This complements the pre-packaging SHA-256 manifest checks.
$ErrorActionPreference = 'Stop'
$installers = @(Get-ChildItem 'src-tauri/target/release/bundle/nsis/*.exe' -ErrorAction Stop)
if ($installers.Count -ne 1) { throw "Expected one Windows installer, found $($installers.Count)" }
$sevenZip = Get-Command '7z.exe' -ErrorAction SilentlyContinue
if ($sevenZip) { $binary = $sevenZip.Source }
elseif (Test-Path 'C:\Program Files\7-Zip\7z.exe') { $binary = 'C:\Program Files\7-Zip\7z.exe' }
else { throw '7-Zip executable is missing on Windows CI runner' }
$listing = (& $binary l -slt $installers[0].FullName) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect the completed NSIS installer' }
$required = @(
  'model_quantized.onnx', 'tokenizer.json', 'PROVENANCE.json',
  'manifest.json', 'elements.json', 'compounds.json',
  'physical-constants.json', 'taxonomy.json', 'reference-atlas.json'
)
foreach ($name in $required) {
  if (!$listing.Contains($name)) { throw "Packaged installer is missing $name" }
}
Write-Host "PASS: NSIS installer contains AI model, tokenizer, provenance, manifest and five science references"

# Tauri embeds Vite frontend files inside its executable; these are not listed
# individually when 7-Zip inspects the compressed NSIS archive.
$wasmFiles = @(Get-ChildItem 'dist/offline-ai/wasm/ort-wasm*.wasm' -File -ErrorAction Stop)
if ($wasmFiles.Count -lt 1) { throw 'ONNX WASM runtime missing from compiled frontend' }
foreach ($file in $wasmFiles) {
  if ($file.Length -lt 10000) { throw "Incomplete ONNX WASM binary: $($file.Name)" }
}
$embeddedModel = 'dist/offline-ai/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx'
if (!(Test-Path $embeddedModel)) { throw 'The local model weights were not included in Vite frontend assets' }
Write-Host "PASS: Vite assets contain $($wasmFiles.Count) local ONNX WASM binaries"
