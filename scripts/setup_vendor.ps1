Set-Location $PSScriptRoot\..
if (-not (Test-Path backend\vendor\AASIST3)) {
  git clone --depth 1 https://github.com/lab260ru/AASIST3.git backend/vendor/AASIST3
}
