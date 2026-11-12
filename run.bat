@echo off
setlocal
cd /d "%~dp0"

where java >nul 2>nul || (echo Java is required. Install JDK 21 or newer. & exit /b 1)
where npm >nul 2>nul || (echo Node.js and npm are required. & exit /b 1)

if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

if not exist "backend\mvnw.cmd" (
  echo Maven wrapper not found at backend\mvnw.cmd.
  exit /b 1
)

if "%SIRH_DEMO_CREDENTIALS_ENABLED%"=="" set "SIRH_DEMO_CREDENTIALS_ENABLED=true"
if "%SIRH_DEMO_PASSWORD_RH%"=="" set "SIRH_DEMO_PASSWORD_RH=rh"
if "%SIRH_DEMO_PASSWORD_MANAGER%"=="" set "SIRH_DEMO_PASSWORD_MANAGER=manager"
if "%SIRH_DEMO_PASSWORD_FINANCE%"=="" set "SIRH_DEMO_PASSWORD_FINANCE=finance"
if "%SIRH_DEMO_PASSWORD_DIRECTION%"=="" set "SIRH_DEMO_PASSWORD_DIRECTION=codir"

echo Starting Spring Boot API (http://localhost:8080/api)...
start "SIRH API" /D "%~dp0backend" cmd /k "mvnw.cmd spring-boot:run"
echo Starting React app (http://localhost:3000)...
call npm run dev

endlocal
