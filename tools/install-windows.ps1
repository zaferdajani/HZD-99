# CLAWBYTE — build the Windows app on your own machine, in one command.
#
# WHY A SCRIPT AND NOT A DOWNLOAD. The finished app is about 340 MB, most of
# which is the Chromium runtime Electron ships. That is too large to hand over
# through chat, and too large to keep in the git repository without making every
# future clone pay for it. Both halves are already published somewhere, though:
# the runtime on Electron's own release page, and the game in this repository.
# So nothing is stored twice — this fetches the two pieces and assembles them.
#
# It is also always current: it takes whatever is on the branch right now, so
# re-running it is how you update.
#
#   Right-click -> Run with PowerShell, or:
#   powershell -ExecutionPolicy Bypass -File install-windows.ps1
#
# Output:  .\CLAWBYTE\CLAWBYTE.exe

$ErrorActionPreference = 'Stop'
$ELECTRON = '33.4.11'
$REPO     = 'https://codeload.github.com/zaferdajani/odyssey/zip/refs/heads/main'
$Root     = Join-Path (Get-Location) 'CLAWBYTE'
$Tmp      = Join-Path $env:TEMP ('clawbyte-' + [guid]::NewGuid().ToString('N').Substring(0,8))

Write-Host ''
Write-Host '  CLAWBYTE — Windows build' -ForegroundColor Cyan
Write-Host '  ------------------------'
Write-Host ''

New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
# TLS 1.2 explicitly: Windows PowerShell 5.1 still defaults to SSL3/TLS1 on some
# machines, and GitHub refuses those, which surfaces as a bare "could not create
# SSL/TLS secure channel" that looks like a network fault and is not one.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Get-File($url, $dest, $label) {
  Write-Host "  downloading $label..." -NoNewline
  $wc = New-Object Net.WebClient
  $wc.Headers.Add('User-Agent', 'clawbyte-installer')
  $wc.DownloadFile($url, $dest)
  $mb = [math]::Round((Get-Item $dest).Length / 1MB, 1)
  Write-Host " $mb MB" -ForegroundColor Green
}

try {
  # ---- 1. the runtime ------------------------------------------------------
  $ezip = Join-Path $Tmp 'electron.zip'
  Get-File "https://github.com/electron/electron/releases/download/v$ELECTRON/electron-v$ELECTRON-win32-x64.zip" $ezip 'runtime'

  # ---- 2. the game ---------------------------------------------------------
  $gzip = Join-Path $Tmp 'game.zip'
  Get-File $REPO $gzip 'game'

  # ---- 3. assemble ---------------------------------------------------------
  Write-Host '  assembling...' -NoNewline
  if (Test-Path $Root) { Remove-Item $Root -Recurse -Force }
  Expand-Archive -Path $ezip -DestinationPath $Root -Force
  Expand-Archive -Path $gzip -DestinationPath $Tmp -Force
  $src = Get-ChildItem -Path $Tmp -Directory | Where-Object { $_.Name -like 'odyssey-*' } | Select-Object -First 1

  # Electron runs an unpacked resources\app directory as-is — no asar needed,
  # which is what keeps this script short and keeps the game readable on disk.
  $app = Join-Path $Root 'resources\app'
  $www = Join-Path $app 'www'
  New-Item -ItemType Directory -Force -Path $www | Out-Null
  Copy-Item (Join-Path $src.FullName 'desktop\main.js') $app
  Copy-Item (Join-Path $src.FullName 'index.html')      $www
  Copy-Item (Join-Path $src.FullName 'odyssey.html')    $www -ErrorAction SilentlyContinue
  Copy-Item (Join-Path $src.FullName 'assets')          $www -Recurse
  @{
    name = 'clawbyte'; productName = 'CLAWBYTE'; version = '1.0.0'
    main = 'main.js';  author = 'Zafer Dajani'
  } | ConvertTo-Json | Set-Content (Join-Path $app 'package.json') -Encoding UTF8

  # the runtime's own launcher, wearing the game's name
  Rename-Item (Join-Path $Root 'electron.exe') 'CLAWBYTE.exe'
  # Electron ships ~50 localisations of its own menus. The game carries its six
  # languages itself and never uses them; they are 40 MB of nothing.
  $loc = Join-Path $Root 'locales'
  Get-ChildItem $loc -Filter '*.pak' | Where-Object { $_.Name -ne 'en-US.pak' } | Remove-Item -Force
  Write-Host ' done' -ForegroundColor Green

  $size = [math]::Round(((Get-ChildItem $Root -Recurse | Measure-Object Length -Sum).Sum / 1MB), 0)
  Write-Host ''
  Write-Host "  Installed to  $Root  ($size MB)" -ForegroundColor Cyan
  Write-Host '  Run           CLAWBYTE.exe'
  Write-Host ''
  Write-Host '  First launch: Windows SmartScreen will warn that the publisher is' -ForegroundColor DarkYellow
  Write-Host '  unknown, because the build is not code-signed yet. "More info" ->' -ForegroundColor DarkYellow
  Write-Host '  "Run anyway". Signing is a Steam-release step, not a test-build one.' -ForegroundColor DarkYellow
  Write-Host ''
  Write-Host '  F11 fullscreen · Esc leaves fullscreen · Esc in game pauses'
  Write-Host ''
}
finally {
  Remove-Item $Tmp -Recurse -Force -ErrorAction SilentlyContinue
}
