@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$url='http://127.0.0.1:8000/index.html'; $ready=$false; try { $page=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; $ready=$page.StatusCode -eq 200 -and $page.Content.Contains('Nexora Technology') } catch {}; if (-not $ready) { $python=Get-Command py -ErrorAction SilentlyContinue; if ($python) { Start-Process -FilePath $python.Source -ArgumentList @('-m','http.server','8000','--bind','127.0.0.1') -WorkingDirectory (Get-Location).Path -WindowStyle Hidden } else { $python=Get-Command python -ErrorAction SilentlyContinue; if (-not $python) { Write-Error 'Python is required to start this local website.'; exit 1 }; Start-Process -FilePath $python.Source -ArgumentList @('-m','http.server','8000','--bind','127.0.0.1') -WorkingDirectory (Get-Location).Path -WindowStyle Hidden }; Start-Sleep -Seconds 2; try { $page=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5; if ($page.StatusCode -ne 200 -or -not $page.Content.Contains('Nexora Technology')) { throw 'A different service is using port 8000.' } } catch { Write-Error ('Could not start the website: ' + $_.Exception.Message); exit 1 } }; Start-Process $url"
if errorlevel 1 (
  echo Could not start the website. Make sure Python is installed and port 8000 is available.
  pause
)
