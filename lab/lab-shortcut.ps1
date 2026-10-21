# Кладёт на рабочий стол ярлык «Лаборатория Дрейфа» → пульт lab\lab-ui.py (консольное меню — lab\lab-start.ps1).
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desk = [Environment]::GetFolderPath("Desktop")
$W = New-Object -ComObject WScript.Shell
# WScript.Shell не сохраняет кириллицу в имени: пишем латиницей и переименовываем
$Tmp = Join-Path $Desk "drift-lab.lnk"
$Fin = Join-Path $Desk "Drift Lab.lnk"
$L = $W.CreateShortcut($Tmp)
$Pyw = (Get-Command pythonw -ErrorAction SilentlyContinue).Source
if (-not $Pyw) { $Pyw = Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\pythonw.exe" }
$L.TargetPath = $Pyw
$L.Arguments = "`"$(Join-Path $Here 'lab-ui.py')`""
$L.WorkingDirectory = $Here
$L.IconLocation = "$env:WINDIR\System32\imageres.dll,144"
$L.Description = "Лаборатория Дрейфа: тесты и охота ботом"
$L.Save()
if (Test-Path -LiteralPath $Fin) { Remove-Item -LiteralPath $Fin }
Rename-Item -LiteralPath $Tmp -NewName (Split-Path $Fin -Leaf)
Write-Host "Ярлык: $Fin"
