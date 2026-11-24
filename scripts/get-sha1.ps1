# Muestra SHA-1 de debug y release para Firebase / Google Sign-In
$jdk = "C:\Program Files\Java\jdk-17\bin\keytool.exe"
$releaseKeystore = Join-Path $PSScriptRoot "..\android\app\my-release-key.jks"
$debugKeystore = Join-Path $env:USERPROFILE ".android\debug.keystore"

Write-Host "=== SHA-1 para Google Sign-In ===" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $releaseKeystore) {
  Write-Host "RELEASE (my-release-key.jks):" -ForegroundColor Green
  & $jdk -list -v -keystore $releaseKeystore -alias my-key-alias -storepass 1234561 2>$null | Select-String "SHA1:"
} else {
  Write-Host "No se encontró release keystore en android/app/my-release-key.jks" -ForegroundColor Yellow
}

Write-Host ""

if (Test-Path $debugKeystore) {
  Write-Host "DEBUG (Android Studio):" -ForegroundColor Green
  & $jdk -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android 2>$null | Select-String "SHA1:"
} else {
  Write-Host "No se encontró debug.keystore (normal si nunca abriste Android Studio)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Agregá cada SHA-1 en Firebase → Configuración → Android com.encuentro12 → Huellas digitales" -ForegroundColor Cyan
