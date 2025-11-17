@echo off
echo === Product Development Project Clean and Rebuild ===
echo.

echo 1. Cleaning Maven project...
cd productdevelopment
call mvnw.cmd clean
if %errorlevel% == 0 (
    echo    ✅ Maven clean completed successfully
) else (
    echo    ❌ Maven clean failed
    cd ..
    exit /b 1
)

echo.
echo 2. Removing target directory...
if exist "target" (
    rmdir /s /q target
    echo    ✅ Target directory removed
) else (
    echo    ℹ️  Target directory not found
)

echo.
echo 3. Cleaning local Maven repository cache for this project...
set REPO_DIR=%USERPROFILE%\.m2\repository\com\htc
if exist "%REPO_DIR%" (
    rmdir /s /q "%REPO_DIR%"
    echo    ✅ Local Maven repository cache cleared
) else (
    echo    ℹ️  Local Maven repository cache not found
)

echo.
echo 4. Rebuilding project...
call mvnw.cmd clean install
if %errorlevel% == 0 (
    echo    ✅ Project rebuilt successfully
    echo.
    echo You can now run the application with:
    echo    mvnw.cmd spring-boot:run
) else (
    echo    ❌ Project rebuild failed
    echo.
    echo Please check the error messages above.
    echo Refer to LOMBOK_TROUBLESHOOTING.md for detailed solutions.
)

cd ..