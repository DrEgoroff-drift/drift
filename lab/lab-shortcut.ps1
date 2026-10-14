# Кладёт на рабочий стол ярлык «Лаборатория Дрейфа» → lab\lab-start.ps1.
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desk = [Environment]::GetFolderPath("Desktop")
$W = New-Object -ComObject WScript.Shell
$L = $W.CreateShortcut((Join-Path $Desk "Лаборатория Дрейфа.lnk"))
$L.TargetPath = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
$L.Arguments = "-NoLogo -ExecutionPolicy Bypass -File `"$(Join-Path $Here 'lab-start.ps1')`""
$L.WorkingDirectory = $Here
$L.IconLocation = "$env:WINDIR\System32\imageres.dll,144"
$L.Description = "Лаборатория Дрейфа: тесты и охота ботом"
$L.Save()
Write-Host "Ярлык: $(Join-Path $Desk 'Лаборатория Дрейфа.lnk')"
