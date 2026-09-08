# Legacy entry point retained for existing links. Use the verified package.
$ErrorActionPreference = 'Stop'
$BuildPage = 'https://github.com/zaferdajani/HZD-99/actions/workflows/desktop.yml'
Write-Host 'CLAWBYTE Windows playtest'
Write-Host 'Open the latest successful build and download CLAWBYTE-Windows-x64-<commit>.'
Write-Host 'Sign in to GitHub, extract the complete ZIP, then run CLAWBYTE.exe.'
Write-Host 'Existing installations and saves have not been changed.'
Write-Host $BuildPage
Start-Process $BuildPage
