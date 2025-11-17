@echo off
echo === Product Development Environment Verification ===
echo.

echo 1. Checking Java version...
java -version >nul 2>&1
if %errorlevel% == 0 (
    echo    Java is installed
    java -version 2>&1 | findstr "17" >nul
    if %errorlevel% == 0 (
        echo    ✅ Java 17 detected
    ) else (
        echo    ❌ Java 17 not detected. Please install Java 17.
    )
) else (
    echo    ❌ Java not found. Please install Java 17.
)

echo.
echo 2. Checking JAVA_HOME...
if defined JAVA_HOME (
    echo    JAVA_HOME: %JAVA_HOME%
    echo %JAVA_HOME% | findstr "jdk-17\|java-17\|openjdk-17" >nul
    if %errorlevel% == 0 (
        echo    ✅ JAVA_HOME points to Java 17
    ) else (
        echo    ⚠️  JAVA_HOME may not point to Java 17
    )
) else (
    echo    ⚠️  JAVA_HOME not set. Please set JAVA_HOME to your Java 17 installation.
)

echo.
echo 3. Checking Maven Wrapper...
if exist "productdevelopment\mvnw.cmd" (
    echo    ✅ Maven Wrapper found
    echo    Testing Maven Wrapper...
    cd productdevelopment
    call mvnw.cmd --version >nul 2>&1
    if %errorlevel% == 0 (
        echo    ✅ Maven Wrapper is working
    ) else (
        echo    ❌ Maven Wrapper is not working properly
    )
    cd ..
) else (
    echo    ❌ Maven Wrapper not found
)

echo.
echo 4. Checking project structure...
if exist "productdevelopment" if exist "free-react-tailwind-admin-dashboard-main" (
    echo    ✅ Project directories found
) else (
    echo    ❌ Project directories not found. Please check your project structure.
)

echo.
echo 5. Checking key files...
if exist "productdevelopment\pom.xml" (
    echo    ✅ pom.xml found
) else (
    echo    ❌ pom.xml not found
)

if exist "productdevelopment\src\main\java\com\htc\productdevelopment\model\User.java" (
    echo    ✅ User.java found
) else (
    echo    ❌ User.java not found
)

echo.
echo === Verification Complete ===
echo.
echo If all checks passed, you're ready to build the project.
echo Next steps:
echo   1. cd productdevelopment
echo   2. mvnw.cmd clean install
echo   3. mvnw.cmd spring-boot:run