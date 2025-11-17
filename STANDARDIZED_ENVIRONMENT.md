# Standardized Development Environment

This document outlines the standardized development environment for the Product Development project to ensure consistency across all team members and prevent common issues like Lombok compilation errors.

## Standardized Versions

All team members must use these exact versions:

| Component | Version | Notes |
|-----------|---------|-------|
| Java | OpenJDK 17 | Must be the same version across all environments |
| Maven | 3.9.11 | Provided via Maven Wrapper |
| Lombok | 1.18.30 | Must match pom.xml version |
| Spring Boot | 3.5.6 | Defined in pom.xml |
| PostgreSQL | 14+ | For database compatibility |

## Why Standardization Matters

Inconsistent environments lead to:
1. **Lombok compilation errors** - Different Lombok versions or missing annotation processing
2. **ClassNotFoundException** - Different Java versions or classpath issues
3. **Build failures** - Different Maven versions or missing dependencies
4. **Runtime issues** - Different Java versions causing compatibility problems

## Environment Setup Process

### 1. Java Installation

**Recommended**: Eclipse Temurin 17 (OpenJDK)
- Download from: https://adoptium.net/
- Install using default settings
- Set JAVA_HOME environment variable

### 2. IDE Configuration

All team members should use one of these IDEs with the specified configuration:

#### IntelliJ IDEA
- Install Lombok plugin
- Enable annotation processing
- Set Project SDK to Java 17
- Use Maven Wrapper for imports

#### Eclipse/STS
- Install Lombok using lombok.jar
- Enable annotation processing
- Set Java 17 as default JRE

#### VS Code
- Install Extension Pack for Java
- Install Lombok Annotations Support
- Configure to use Java 17

### 3. Build Process

**Always use Maven Wrapper**:
```bash
# Instead of: mvn clean install
./mvnw clean install

# Instead of: mvn spring-boot:run
./mvnw spring-boot:run
```

## Verification Process

Team members should verify their setup using the provided scripts:

### For macOS/Linux:
```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

### For Windows:
```cmd
verify-setup.bat
```

## Common Issues and Prevention

### Lombok Issues Prevention
1. Always enable annotation processing in your IDE
2. Ensure Lombok plugin is installed and enabled
3. Verify Lombok version matches pom.xml (1.18.30)
4. Use Maven Wrapper for all builds

### Environment Issues Prevention
1. Set JAVA_HOME to Java 17 installation
2. Use only the Maven Wrapper, not system Maven
3. Keep IDE plugins updated
4. Regularly clean and rebuild the project

## Team Workflow

### New Team Members
1. Follow SETUP.md instructions
2. Run verification scripts
3. Confirm setup with team lead before starting development

### Existing Team Members
1. Review STANDARDIZED_ENVIRONMENT.md
2. Verify your environment matches the standardized versions
3. Update any components that don't match

### When Issues Occur
1. Try the clean and rebuild process first
2. Refer to LOMBOK_TROUBLESHOOTING.md for detailed solutions
3. Contact team lead if issues persist

## Benefits of Standardization

1. **Reduced Setup Time** - Clear instructions and verification scripts
2. **Fewer Environment Issues** - Consistent versions prevent compatibility problems
3. **Faster Troubleshooting** - Common solutions documented
4. **Improved Collaboration** - Everyone works in the same environment
5. **Reliable Builds** - Maven Wrapper ensures consistent builds

## Maintenance

This document should be updated when:
- Java version changes
- Lombok version updates
- Maven version changes
- New IDE requirements
- Team expands and new setup issues are discovered

Team leads are responsible for keeping this document current and ensuring all team members are aware of updates.