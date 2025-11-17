@echo off
echo Setting up JAVA_HOME for Product Development Project
echo.

REM This script helps set up JAVA_HOME for the project
REM It assumes Java 17 is installed in the default location

echo Possible Java 17 locations:
echo 1. C:\Program Files\Java\jdk-17.x.x
echo 2. C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
echo 3. C:\Program Files\OpenJDK\jdk-17.x.x

echo.
echo Please find your Java 17 installation path and set JAVA_HOME accordingly.
echo.

echo To set JAVA_HOME manually:
echo 1. Open System Properties ^> Advanced ^> Environment Variables
echo 2. Under System Variables, click New
echo 3. Variable name: JAVA_HOME
echo 4. Variable value: [Your Java 17 installation path]
echo 5. Click OK
echo.
echo Then add Java to PATH:
echo 1. In Environment Variables, select Path under System Variables and click Edit
echo 2. Click New and add %%JAVA_HOME%%\bin
echo 3. Click OK

echo.
echo Alternatively, you can run these commands in Command Prompt as Administrator:
echo setx JAVA_HOME "C:\Program Files\Java\jdk-17.x.x" /M
echo setx PATH "%%JAVA_HOME%%\bin;%%PATH%%" /M

echo.
echo Note: Replace "C:\Program Files\Java\jdk-17.x.x" with your actual Java 17 installation path.
echo After setting JAVA_HOME, please restart your command prompt and IDE.