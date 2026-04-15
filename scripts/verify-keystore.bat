@echo off
REM Script para verificar el SHA1 de un keystore (Windows)
REM Uso: scripts\verify-keystore.bat <ruta-keystore> <alias> <password>

if "%1"=="" goto :usage
if "%2"=="" goto :usage
if "%3"=="" goto :usage

set KEYSTORE_PATH=%1
set KEY_ALIAS=%2
set STORE_PASSWORD=%3

if not exist "%KEYSTORE_PATH%" (
    echo Error: El keystore no existe en: %KEYSTORE_PATH%
    exit /b 1
)

echo Verificando keystore: %KEYSTORE_PATH%
echo Alias: %KEY_ALIAS%
echo.

keytool -list -v -keystore "%KEYSTORE_PATH%" -alias "%KEY_ALIAS%" -storepass "%STORE_PASSWORD%" | findstr /i "SHA1"

echo.
echo SHA1 esperado por Google Play: 34:A1:69:FD:6E:CF:5B:12:35:CC:1E:0C:8F:2A:A3:BB:42:0B:2E:6F
echo.
echo Verifica manualmente si el SHA1 mostrado coincide con el esperado.

exit /b 0

:usage
echo Uso: %0 ^<ruta-keystore^> ^<alias^> ^<password^>
echo Ejemplo: %0 android\app\punto-encuentro-release.keystore punto-encuentro-key puntoencuentro2024
exit /b 1
