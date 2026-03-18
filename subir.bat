@echo off
cd /d %~dp0

:: Nombre del proyecto
set PROYECTO=Stratega Planner

:: Fecha
set FECHA=%date%

:: Hora sin segundos
for /f "tokens=1-2 delims=:" %%a in ("%time%") do (
    set HORA=%%a:%%b
)

:: Mensaje automático
set msg=%PROYECTO% actualizado el %FECHA% %HORA%

echo.
echo ==== Subiendo cambios de %PROYECTO% ====

git add .
git commit -m "%msg%"
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo ==== ERROR: No se pudieron subir los cambios ====
) else (
    echo.
    echo ==== Cambios SUBIDOS correctamente 🚀 ====
)

pause