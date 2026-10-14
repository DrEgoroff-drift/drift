# Кладёт на рабочий стол ярлык «Лаборатория Дрейфа» → lab\lab-start.ps1.
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desk = [Environment]::GetFolderPath("Desktop")
$W = New-Object -ComObject WScript.Shell
# WScript.Shell не сохраняет кириллицу в имени: пишем латиницей и переименовываем
$Tmp = Join-Path $Desk "drift-lab.lnk"
$Fin = Join-Path $Desk "Drift Lab.lnk"
$L = $W.CreateShortcut($Tmp)
$L.TargetPath = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
$L.Arguments = "-NoLogo -ExecutionPolicy Bypass -File `"$(Join-Path $Here 'lab-start.ps1')`""
$L.WorkingDirectory = $Here
$L.IconLocation = "$env:WINDIR\System32\imageres.dll,144"
$L.Description = "Лаборатория Дрейфа: тесты и охота ботом"
$L.Save()
if (Test-Path -LiteralPath $Fin) { Remove-Item -LiteralPath $Fin }
Rename-Item -LiteralPath $Tmp -NewName (Split-Path $Fin -Leaf)
Write-Host "Ярлык: $(Join-Path $Desk 'Лаборатория Дрейфа.lnk')"
