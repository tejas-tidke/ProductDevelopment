# Lombok Troubleshooting Guide

This guide provides detailed steps to resolve common Lombok-related issues that team members may encounter when setting up the development environment.

## Understanding the Problem

Lombok is a Java library that automatically plugs into your editor and build tools, spicing up your Java experience. It eliminates the need to write boilerplate code like getters, setters, constructors, etc. However, it requires proper setup in both your IDE and build tools.

The most common Lombok issues are:
1. "Unresolved compilation problems" errors
2. Missing getter/setter methods
3. IDE not recognizing Lombok annotations

## Solution 1: Verify Environment Setup

Before troubleshooting Lombok specifically, ensure your environment is correctly set up:

1. **Java Version**: Must be Java 17
   ```bash
   java -version
   javac -version
   ```

2. **JAVA_HOME**: Should point to Java 17 installation
   ```bash
   echo $JAVA_HOME  # macOS/Linux
   echo %JAVA_HOME% # Windows
   ```

3. **Maven Wrapper**: Always use the project's Maven Wrapper
   ```bash
   ./mvnw --version  # macOS/Linux
   mvnw.cmd --version # Windows
   ```

## Solution 2: IDE-Specific Lombok Setup

### IntelliJ IDEA

1. Install the Lombok plugin:
   - Go to **Settings** → **Plugins**
   - Search for "Lombok"
   - Install and restart IDE

2. Enable annotation processing:
   - Go to **Settings** → **Build, Execution, Deployment** → **Compiler** → **Annotation Processors**
   - Check **Enable annotation processing**

3. Verify project settings:
   - Go to **Project Structure** → **Project**
   - Ensure **Project SDK** is set to Java 17
   - Ensure **Project language level** is set to 17

### Eclipse/STS

1. Install Lombok:
   - Navigate to your project directory
   - Run: `java -jar lombok.jar`
   - Select your Eclipse/STS installation directory
   - Click "Install/Update"
   - Restart Eclipse/STS

2. Enable annotation processing:
   - Right-click project → **Properties**
   - Go to **Java Compiler** → **Annotation Processing**
   - Check **Enable annotation processing**

3. If Lombok installation fails:
   - Try running the installer as administrator
   - Manually add the javaagent to eclipse.ini:
     ```
     -javaagent:path/to/lombok.jar
     ```

### VS Code

1. Install required extensions:
   - Extension Pack for Java
   - Lombok Annotations Support

2. Configure Java settings:
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Java: Configure Classpath"
   - Verify JDK is set to Java 17

3. Enable annotation processing:
   - Open Settings (Ctrl+,)
   - Search for "java.compile.nullAnalysis.mode"
   - Set to "automatic"

## Solution 3: Clean and Rebuild

If Lombok is properly installed but you're still seeing errors:

1. Clean the project:
   ```bash
   ./mvnw clean  # macOS/Linux
   mvnw.cmd clean # Windows
   ```

2. Delete the target directory:
   ```bash
   rm -rf target/  # macOS/Linux
   rmdir /s target\ # Windows
   ```

3. Clear IDE cache:
   - IntelliJ: **File** → **Invalidate Caches and Restart**
   - Eclipse: **Project** → **Clean** → **Clean all projects**
   - VS Code: Restart the application

4. Reimport Maven dependencies:
   - IntelliJ: Right-click pom.xml → **Maven** → **Reload project**
   - Eclipse: Right-click project → **Maven** → **Reload Projects**
   - VS Code: Open Command Palette → "Java: Reload Projects"

5. Rebuild the project:
   ```bash
   ./mvnw clean install  # macOS/Linux
   mvnw.cmd clean install # Windows
   ```

## Solution 4: Maven Repository Cache Issues

If you're still encountering issues:

1. Delete the project-specific cache:
   ```bash
   rm -rf ~/.m2/repository/com/htc/  # macOS/Linux
   rmdir /s %USERPROFILE%\.m2\repository\com\htc\ # Windows
   ```

2. Rebuild the project:
   ```bash
   ./mvnw clean install  # macOS/Linux
   mvnw.cmd clean install # Windows
   ```

## Solution 5: Verify Lombok Version

Ensure the Lombok version in your IDE matches the one in pom.xml:

1. Check pom.xml version:
   ```xml
   <dependency>
       <groupId>org.projectlombok</groupId>
       <artifactId>lombok</artifactId>
       <version>1.18.30</version>
       <scope>provided</scope>
   </dependency>
   ```

2. If using Eclipse/STS, ensure the lombok.jar version matches this version.

## Solution 6: Check IDE Configuration

### For IntelliJ IDEA:

1. Check Lombok plugin version:
   - **Settings** → **Plugins** → **Lombok**
   - Ensure it's enabled and up to date

2. Check annotation processors:
   - **Settings** → **Build, Execution, Deployment** → **Compiler** → **Annotation Processors**
   - Ensure **Enable annotation processing** is checked

### For Eclipse/STS:

1. Check lombok installation:
   - Look for `lombok.jar` in your Eclipse installation directory
   - Verify that eclipse.ini contains `-javaagent:lombok.jar`

## Solution 7: Common Error Messages and Solutions

### "Unresolved compilation problems"

This typically means Lombok annotations aren't being processed:

1. Verify annotation processing is enabled in your IDE
2. Clean and rebuild the project using Maven Wrapper
3. Restart your IDE

### "The method getX() is undefined for the type Y"

This indicates Lombok-generated methods aren't being recognized:

1. Ensure Lombok plugin is installed and enabled
2. Verify annotation processing is enabled
3. Clean and rebuild the project

### "Cannot infer type argument(s) for <U> map"

This can occur with Lombok-generated methods in complex generic scenarios:

1. Clean and rebuild the project
2. Check that your IDE is using Java 17
3. Verify annotation processing is enabled

## Solution 8: Last Resort Solutions

If all else fails:

1. **Complete clean setup**:
   ```bash
   ./mvnw clean
   rm -rf target/
   rm -rf ~/.m2/repository/com/htc/
   ./mvnw clean install
   ```

2. **Re-import the project**:
   - Close the project in your IDE
   - Delete `.idea/`, `.classpath`, `.project` files (if applicable)
   - Re-import the project as a Maven project

3. **Check for conflicting Lombok versions**:
   - Ensure no other Lombok versions are in your classpath
   - Check for Lombok in your IDE's installation directory

## Prevention Tips

1. **Always use Maven Wrapper** instead of system Maven
2. **Keep Lombok versions consistent** across team members
3. **Enable annotation processing** in your IDE
4. **Regularly clean and rebuild** when switching branches or after major changes
5. **Use the verification scripts** provided in the project root

## Contact for Help

If you've tried all these solutions and are still experiencing issues, please:

1. Take a screenshot of the error
2. Note which IDE and version you're using
3. Include the output of:
   ```bash
   java -version
   ./mvnw --version
   ```
4. Contact the team lead for assistance

Remember: The key to avoiding Lombok issues is consistency - everyone on the team should use the same Java version, Maven version (via Wrapper), and Lombok version.