# ── GPU-флаги для headless-Хрома: ОДНО место ──
# Список SwiftShader живёт в docs/shot.py (там же объяснено, почему именно эти флаги
# и почему никогда не --disable-vulkan-surface). Здесь только чтение его и общая
# развилка: дома на Windows с настоящей картой — пусто; без карты (DRIFT_GPU=swiftshader)
# — SwiftShader; на Linux — ещё --enable-unsafe-webgpu, без него WebGPU за флагом.
# Зовут test.ps1, docs/pageshot.ps1, docs/shot.ps1.
function Get-GpuArgs {
  param([Parameter(Mandatory = $true)][string]$Root, [switch]$OnLin)
  $gpuArgs = @()
  if ($OnLin -or $env:DRIFT_GPU -eq "swiftshader") { $gpuArgs += "--enable-unsafe-webgpu" }
  if ($env:DRIFT_GPU -eq "swiftshader") {
    $shotPy = [System.IO.File]::ReadAllText((Join-Path $Root "docs\shot.py"), [System.Text.Encoding]::UTF8)
    $swm = [regex]::Match($shotPy, '(?s)\nSWIFTSHADER = \[(.*?)\]')
    if (-not $swm.Success) { throw "docs/shot.py: no SWIFTSHADER list — the GPU flags live there" }
    $gpuArgs += @([regex]::Matches($swm.Groups[1].Value, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value })
  }
  return ,$gpuArgs
}
