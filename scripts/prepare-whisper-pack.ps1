param([string]$OutputDirectory=(Join-Path (Split-Path -Parent $PSScriptRoot) 'whisper-pack'))
$ErrorActionPreference='Stop'
$lock=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'whisper-pack.lock.json') -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$dest=(Resolve-Path -LiteralPath $OutputDirectory).Path
foreach ($asset in @($lock.model,$lock.runtime)) {
    $file=Join-Path $dest $asset.name
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) {
        $part=$file+'.part'
        try {
            Write-Host "Downloading $($asset.name)."
            Invoke-WebRequest -Uri $asset.url -OutFile $part -UseBasicParsing -TimeoutSec 600
            if ((Get-FileHash -LiteralPath $part -Algorithm SHA256).Hash -ne $asset.sha256) { throw 'Download checksum mismatch.' }
            Move-Item -LiteralPath $part -Destination $file
        } finally { Remove-Item -LiteralPath $part -Force -ErrorAction SilentlyContinue }
    }
    if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $asset.sha256) { throw "Invalid $($asset.name). Remove it and retry preparation." }
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'whisper-pack.lock.json') -Destination $dest -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'start-whisper-pack.ps1') -Destination (Join-Path $dest 'Start-Whisper.ps1') -Force
Copy-Item -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs\OFFLINE_WHISPER.md') -Destination (Join-Path $dest 'README.md') -Force
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/ggml-org/whisper.cpp/b5454/LICENSE' -OutFile (Join-Path $dest 'WHISPER-CPP-LICENSE.txt') -UseBasicParsing -TimeoutSec 60
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/openai/whisper/v20250625/LICENSE' -OutFile (Join-Path $dest 'MODEL-LICENSE.txt') -UseBasicParsing -TimeoutSec 60
& (Join-Path $dest 'Start-Whisper.ps1') -VerifyOnly
Write-Host 'Portable offline Whisper pilot pack prepared. Actual microphone testing remains required.'
