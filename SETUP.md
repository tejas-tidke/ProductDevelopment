# Development Environment Setup Guide

This guide will help you set up a consistent development environment to avoid Lombok and other compatibility issues. The key to avoiding these issues is ensuring everyone uses the same versions of Java, Maven, and Lombok.

## Prerequisites

1. **Java 17** - Required for the project (OpenJDK recommended)
2. **Maven** - Project uses Maven Wrapper (no need to install separately)
3. **IDE with Lombok Support** - IntelliJ IDEA, Eclipse, or VS Code with appropriate plugins

## Setup Instructions

### 1. Install Java 17

#### For Windows:
1. Download OpenJDK 17 from [Adoptium](https://adoptium.net/)
2. Run the installer and follow the prompts
3. Set JAVA_HOME environment variable:
   - Open System Properties → Advanced → Environment Variables
   - Under System Variables, click New
   - Variable name: `JAVA_HOME`
   - Variable value: Path to your Java installation (e.g., `C:\Program Files\Java\jdk-17.0.8.7`)
   - Click OK
4. Add Java to PATH:
   - In Environment Variables, select Path under System Variables and click Edit
   - Click New and add `%JAVA_HOME%\bin`
   - Click OK
5. Verify installation:
   ```bash
   java -version
   javac -version
   echo %JAVA_HOME%
   ```

#### For macOS:
1. Using Homebrew:
   ```bash
   brew install openjdk@17
   sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
   ```
2. Or download from [Adoptium](https://adoptium.net/)
3. Set JAVA_HOME:
   ```bash
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home
   echo 'export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home' >> ~/.zshrc
   ```

#### For Linux:
1. Using apt (Ubuntu/Debian):
   ```bash
   sudo apt update
   sudo apt install openjdk-17-jdk
   ```
2. Or download from [Adoptium](https://adoptium.net/)
3. Set JAVA_HOME:
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
   ```

### 2. Verify Java Installation

Run these commands to verify:
```bash
java -version
javac -version
echo $JAVA_HOME
```

All commands should show Java 17.

### 3. Using Maven Wrapper (Recommended)

This project includes Maven Wrapper, so you don't need to install Maven separately. The Maven Wrapper ensures everyone uses the same Maven version.

Instead of using `mvn`, use:
- **Windows**: `mvnw.cmd`
- **Mac/Linux**: `./mvnw`

Examples:
```bash
# Clean and build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run

# Clean all build artifacts
./mvnw clean
```

**Important**: Always use the Maven Wrapper instead of your system Maven to avoid version conflicts.

### 4. IDE Configuration

#### For IntelliJ IDEA:
1. Open the project
2. Go to **File → Project Structure**
3. Set **Project SDK** to Java 17
4. Set **Project language level** to 17
5. Go to **Settings → Build → Compiler → Annotation Processors**
6. Check **Enable annotation processing**
7. Install the Lombok plugin:
   - Go to **Settings → Plugins**
   - Search for "Lombok"
   - Install and restart IDE

#### For Eclipse/STS:
1. Install Lombok:
   - Download `lombok.jar` from the project root or [Lombok website](https://projectlombok.org/download)
   - Run: `java -jar lombok.jar`
   - Select your Eclipse/STS installation directory
   - Click "Install/Update"
   - Restart Eclipse/STS
2. Enable annotation processing:
   - Right-click project → Properties
   - Go to **Java Compiler → Annotation Processing**
   - Check **Enable annotation processing**

#### For VS Code:
1. Install the following extensions:
   - Extension Pack for Java
   - Lombok Annotations Support
2. Ensure Java 17 is selected:
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Java: Configure Classpath"
   - Verify JDK is set to Java 17
3. Enable annotation processing:
   - Open Settings (Ctrl+,)
   - Search for "java.compile.nullAnalysis.mode"
   - Set to "automatic"

### 5. Building the Project

Use the Maven Wrapper for consistent builds:

```bash
# Clean and install dependencies
./mvnw clean install

# Run the application
./mvnw spring-boot:run

# Run tests
./mvnw test
```

**If you encounter Lombok-related compilation errors:**
1. Clean the project:
   ```bash
   ./mvnw clean
   ```
2. Delete the target directory:
   ```bash
   rm -rf target/
   # On Windows: rmdir /s target/
   ```
3. Rebuild:
   ```bash
   ./mvnw clean install
   ```

### 6. Common Issues and Solutions

#### Lombok Issues:
1. Make sure annotation processing is enabled in your IDE
2. Verify Lombok version matches the one in `pom.xml` (1.18.30)
3. Restart your IDE after Lombok installation
4. If you're still getting "Unresolved compilation problems" errors:
   - Clean and rebuild the project using Maven Wrapper
   - Delete your local Maven repository cache for the project:
     ```bash
     rm -rf ~/.m2/repository/com/htc/
     # On Windows: rmdir /s %USERPROFILE%\.m2\repository\com\htc\
     ```
   - Reimport Maven dependencies in your IDE
5. For Eclipse/STS users:
   - If Lombok installation fails, try running it as administrator
   - Ensure the lombok.jar version matches the one in pom.xml
   - Check that the eclipse.ini file has the `-javaagent:lombok.jar` entry
6. For IntelliJ IDEA users:
   - Ensure the Lombok plugin is installed and enabled
   - Check that annotation processing is enabled for the project
   - Try "File → Invalidate Caches and Restart"
7. For comprehensive troubleshooting, refer to the [Lombok Troubleshooting Guide](LOMBOK_TROUBLESHOOTING.md)

#### Java Version Issues:
1. Check that JAVA_HOME points to Java 17
2. Verify no other Java versions are interfering
3. If you have multiple Java versions installed:
   - Uninstall older versions if possible
   - Or ensure your IDE is configured to use Java 17 specifically
   - Use SDKMAN (for macOS/Linux) or manually set JAVA_HOME to point to Java 17

#### Maven Issues:
1. Always use the Maven Wrapper (`./mvnw` or `mvnw.cmd`) instead of your system Maven
2. Delete `.m2/repository/com/htc/` folder if you encounter dependency issues
3. If you're getting "ClassNotFoundException" errors:
   - Clean and rebuild using Maven Wrapper
   - Check that you're running the correct main class:
     - Correct: `com.htc.productdevelopment.ProductdevelopmentApplication`
     - Incorrect: `com.htc.productdevelopment.ProductDevelopmentApplication` (note the lowercase 'd')

### 7. First Time Setup

1. Clone the repository
2. Open in your IDE
3. Configure Java 17 SDK
4. Enable annotation processing
5. Install Lombok in your IDE (if not already done)
6. Build with Maven Wrapper:
   ```bash
   ./mvnw clean install
   ```
7. If the build succeeds, you're ready to run the application

### 8. Running the Application

```bash
# Backend
./mvnw spring-boot:run

# Frontend (from free-react-tailwind-admin-dashboard-main directory)
npm install
npm run dev
```

## Troubleshooting

If you encounter issues:

1. **Clean everything**:
   ```bash
   ./mvnw clean
   rm -rf target/
   # On Windows: rmdir /s target/
   ```

2. **Refresh IDE**:
   - IntelliJ: View → Tool Windows → Maven → Refresh
   - Eclipse: Right-click project → Refresh

3. **Reimport Maven project**:
   - IntelliJ: Right-click pom.xml → Maven → Reload project
   - Eclipse: Right-click project → Maven → Reload Projects

4. **Check Java version**:
   ```bash
   java -version
   echo $JAVA_HOME
   # On Windows: echo %JAVA_HOME%
   ```

5. **Verify Lombok installation**:
   - Check that annotation processing is enabled
   - Verify Lombok plugin is installed in your IDE
   - Ensure lombok.jar version matches pom.xml

6. **Check main class name**:
   - Correct: `com.htc.productdevelopment.ProductdevelopmentApplication`
   - Incorrect: `com.htc.productdevelopment.ProductDevelopmentApplication`

If problems persist, contact the team lead for assistance.