param([switch]$VerifyOnly)
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$manifest=Get-Content -LiteralPath (Join-Path $root 'whisper-pack.lock.json') -Raw | ConvertFrom-Json
$model=Join-Path $root 'ggml-base.bin'
$archive=Join-Path $root 'runtime.zip'
# Keep pins in the launcher as well as the provenance file: replacing the
# manifest alone cannot authorize executing an arbitrary runtime.
if (!(Test-Path -LiteralPath $model -PathType Leaf) -or
    (Get-Item -LiteralPath $model).Length -ne 147951465 -or
    (Get-FileHash -LiteralPath $model -Algorithm SHA256).Hash -ne '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe') {
    throw 'Whisper base model missing or checksum invalid.'
}
if (!(Test-Path -LiteralPath $archive -PathType Leaf) -or
    (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne '6ba69e3482d7826214f90a6a9c84ca07782aec1e1d0c6a7c30c994fd5d816ccb') {
    throw 'Whisper Windows runtime missing or checksum invalid.'
}
if ($VerifyOnly) { Write-Host 'Whisper pack hashes verified.'; return }
$stage=Join-Path ([System.IO.Path]::GetTempPath()) ('scoolabs-whisper-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
try {
    Expand-Archive -LiteralPath $archive -DestinationPath $stage
    $servers=@(Get-ChildItem -LiteralPath $stage -Recurse -Filter 'whisper-server.exe' -File)
    if ($servers.Count -ne 1) { throw 'Expected exactly one Whisper server executable.' }
    $server=$servers[0]
    Write-Host 'Starting offline speech service at 127.0.0.1:17892. Keep this window open.'
    Write-Host 'Select Whisper local service in Smart Teacher and Check Whisper service. Press Ctrl+C to stop.'
    Push-Location -LiteralPath $server.DirectoryName
    try {
        & $server.FullName -m $model --host 127.0.0.1 --port 17892 -l en -ng
        if ($LASTEXITCODE -ne 0) { throw "Whisper exited with code $LASTEXITCODE." }
    } finally { Pop-Location }
} finally {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
