param([string]$Pack=(Join-Path (Split-Path -Parent $PSScriptRoot) 'whisper-pack'))
$ErrorActionPreference='Stop'
$pack=(Resolve-Path -LiteralPath $Pack).Path
& (Join-Path $pack 'Start-Whisper.ps1') -VerifyOnly
$stage=Join-Path ([System.IO.Path]::GetTempPath()) ('whisper-smoke-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
$process=$null
try {
    Expand-Archive -LiteralPath (Join-Path $pack 'runtime.zip') -DestinationPath $stage
    $servers=@(Get-ChildItem -LiteralPath $stage -Filter 'whisper-server.exe' -File -Recurse)
    if ($servers.Count -ne 1) { throw 'Whisper server missing.' }
    $sample=Join-Path $stage 'jfk.wav'
    Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/ggml-org/whisper.cpp/b5454/samples/jfk.wav' -OutFile $sample -UseBasicParsing -TimeoutSec 60
    $model=Join-Path $pack 'ggml-base.bin'
    $process=Start-Process -FilePath $servers[0].FullName -WorkingDirectory $servers[0].DirectoryName -ArgumentList @('-m',('"'+$model+'"'),'--host','127.0.0.1','--port','17892','-l','en','-ng') -PassThru -NoNewWindow -RedirectStandardOutput (Join-Path $pack 'smoke-stdout.log') -RedirectStandardError (Join-Path $pack 'smoke-stderr.log')
    $ready=$false
    for ($i=0;$i -lt 60;$i++) {
        if ($process.HasExited) { throw 'Whisper server exited before ready.' }
        try {
            $health=Invoke-WebRequest -Uri 'http://127.0.0.1:17892/' -UseBasicParsing -TimeoutSec 3
            if ($health.StatusCode -eq 200 -and $health.Headers['Server'] -eq 'whisper.cpp') { $ready=$true;break }
        } catch {}
        Start-Sleep -Seconds 2
    }
    if (!$ready) { throw 'Whisper server did not become ready.' }
    $watch=[Diagnostics.Stopwatch]::StartNew()
    $raw=& curl.exe --silent --show-error --fail --max-time 90 --noproxy '*' -F "file=@$sample;type=audio/wav" -F 'language=en' -F 'temperature=0.0' -F 'temperature_inc=0.0' -F 'response_format=json' 'http://127.0.0.1:17892/inference'
    if ($LASTEXITCODE -ne 0) { throw 'Local Whisper inference request failed.' }
    $result=($raw -join "") | ConvertFrom-Json
    if ($result.text -notmatch '(?i)ask not' -or $result.text -notmatch '(?i)country') { throw 'Expected public sample phrase not recognized.' }
    Write-Host "Actual local Whisper CPU inference passed in $($watch.Elapsed.TotalSeconds) seconds."
    Write-Host $result.text
} finally {
    if ($process -and !$process.HasExited) { Stop-Process -Id $process.Id -Force; $process.WaitForExit() }
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
