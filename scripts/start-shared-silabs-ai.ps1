param(
    [Parameter(Mandatory=$true)][string]$SilabsRepo,
    [string]$Python = '',
    [ValidateSet('auto','cpu')][string]$Device = 'cpu',
    [ValidateSet('auto','float32','bfloat16','float16')][string]$Dtype = 'auto'
)
# Start the shared model from a separately prepared Silabs AI checkout.
# No dependencies or models are downloaded by this script.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $SilabsRepo).Path
$model = Join-Path $root 'models\base\Qwen3-1.7B'
if (!(Test-Path -LiteralPath (Join-Path $root 'api\main.py') -PathType Leaf) -or
    !(Test-Path -LiteralPath (Join-Path $model 'config.json') -PathType Leaf)) {
    throw 'A Silabs AI repository and its materialized Qwen3-1.7B weights are required.'
}
$weights = @(Get-ChildItem -LiteralPath $model -Filter '*.safetensors' -File)
if ($weights.Count -eq 0) { throw 'No local Qwen safetensors were found. Ask the technician to prepare the shared model once.' }
if (!$Python) { $Python = Join-Path $root '.venv\Scripts\python.exe' }
$Python = (Resolve-Path -LiteralPath $Python).Path
$settings = @{
    HF_HUB_OFFLINE='1'; TRANSFORMERS_OFFLINE='1'; HF_HUB_DISABLE_TELEMETRY='1'
    SILABS_MODEL_ID='Qwen/Qwen3-1.7B'; SILABS_MODEL_PATH=$model
    SILABS_ALLOW_REMOTE_MODEL_DOWNLOAD='false'; SILABS_TRUST_REMOTE_CODE='false'
    SILABS_PRELOAD_MODEL='true'; SILABS_ENABLE_GUARDRAILS='true'
    SILABS_ENABLE_THINKING='false'; SILABS_RAG_ENABLED='false'; SILABS_ADAPTER_PATH=''
    SILABS_DEVICE=$Device; SILABS_DTYPE=$Dtype
    SILABS_API_HOST='127.0.0.1'; SILABS_API_PORT='8000'
}
# Preserve the technician's API authentication configuration; no secret is logged.
$previous = @{}
foreach ($key in $settings.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key,'Process')
    [Environment]::SetEnvironmentVariable($key,$settings[$key],'Process')
}
Push-Location -LiteralPath $root
try {
    Write-Host 'Loading existing shared Silabs AI Qwen weights offline on 127.0.0.1:8000.'
    & $Python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --workers 1
    if ($LASTEXITCODE -ne 0) { throw "Silabs AI exited with code $LASTEXITCODE." }
} finally {
    Pop-Location
    foreach ($key in $previous.Keys) {
        [Environment]::SetEnvironmentVariable($key,$previous[$key],'Process')
    }
}
