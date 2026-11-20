# Start the separately downloaded Scoolabs Smart Teacher CPU pilot pack.
# This script never downloads data. It verifies both payloads before running.
$ErrorActionPreference = 'Stop'
$pack = $PSScriptRoot
$model = Join-Path $pack 'model.gguf'
$archive = Join-Path $pack 'runtime.zip'
$expectedModel = '2fde00ce69dd4899c70d020845e2638353015bba0fdf161b3eb965f2bca4464e'
$expectedRuntime = '05865586d8cc235e7ed1e975e0df4c6d02ba81cab637845aed888ad5fe4ba061'
if (-not [Environment]::Is64BitOperatingSystem) { throw 'This pack requires 64-bit Windows.' }
if (!(Test-Path -LiteralPath $model -PathType Leaf) -or !(Test-Path -LiteralPath $archive -PathType Leaf)) {
    throw 'Extract the complete model pack first; model.gguf and runtime.zip must be next to this script.'
}
Write-Host 'Verifying local model and CPU runtime. This may take a while...'
if ((Get-Item -LiteralPath $model).Length -ne 2497280736 -or (Get-FileHash -LiteralPath $model -Algorithm SHA256).Hash -ne $expectedModel) {
    throw 'The model file is corrupt or not the approved pilot model.'
}
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expectedRuntime) {
    throw 'The runtime archive is not the pinned Windows CPU release.'
}
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ('scoolabs-teacher-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
try {
    Expand-Archive -LiteralPath $archive -DestinationPath $stage
    $servers = @(Get-ChildItem -LiteralPath $stage -Filter 'llama-server.exe' -File -Recurse)
    if ($servers.Count -ne 1) { throw 'The verified archive does not contain exactly one llama-server executable.' }
    $server = $servers[0]
    Write-Host 'Starting local classroom model on 127.0.0.1:17891. Keep this window open.'
    Write-Host 'In Scoolabs, open Smart Teacher and select Check local model after loading. Press Ctrl+C here to stop.'
    Push-Location -LiteralPath $server.DirectoryName
    try {
        & $server.FullName -m $model --host 127.0.0.1 --port 17891 --alias scoolabs-teacher -c 8192 -np 1 -ngl 0
        if ($LASTEXITCODE -ne 0) { throw "Local runtime exited with code $LASTEXITCODE." }
    } finally { Pop-Location }
} finally {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
