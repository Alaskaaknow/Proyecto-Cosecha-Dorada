@echo off 
title 🏨 Hotel La Cosecha Dorada - Inicio Automático 
 
echo ========================================== 
echo   🚀 INICIANDO SISTEMA DEL HOTEL 
echo ========================================== 
echo. 
 
echo 🔍 Verificando puertos... 
set FRONTEND_PORT=3000 
set BACKEND_PORT=5001  # ← CAMBIADO A 5001
 
:CHECK_FRONTEND_PORT 
netstat -ano | findstr :%FRONTEND_PORT% >nul 
if not errorlevel 1 ( 
    echo 🔄 Puerto %FRONTEND_PORT% ocupado, intentando con 3001... 
    set FRONTEND_PORT=3001 
    goto CHECK_FRONTEND_PORT 
) 
 
echo ✅ Puerto frontend: %FRONTEND_PORT% 
echo ✅ Puerto backend: %BACKEND_PORT% 
echo. 
 
echo 🛑 Cerrando procesos anteriores de Node.js... 
taskkill /f /im node.exe >nul 2>&1 
timeout /t 2 >nul 
 
echo 🚀 Iniciando Backend... 
cd backend 
start "Backend Hotel - Puerto %BACKEND_PORT%" cmd /k "npm start" 
 
echo ⏳ Esperando backend... 
timeout /t 5 >nul 
 
echo 🌐 Iniciando Frontend en puerto %FRONTEND_PORT%... 
cd ..\miproyecto 
start "Frontend Hotel - Puerto %FRONTEND_PORT%" cmd /k "set PORT=%FRONTEND_PORT% && npm start" 
 
echo. 
echo ========================================== 
echo   ✅ SISTEMA INICIADO CORRECTAMENTE 
echo ========================================== 
echo. 
echo 🌐 Frontend: http://localhost:%FRONTEND_PORT% 
echo 🚀 Backend:  http://localhost:%BACKEND_PORT% 
echo. 
echo 📝 Notas: 
echo    - Espera 10-15 segundos para que todo cargue 
echo    - Si un puerto estaba ocupado, se uso uno alternativo 
echo    - Los deprecation warnings son normales en desarrollo 
echo. 
pause