#!/bin/bash

echo "=== Product Development Environment Verification ==="
echo

# Check Java version
echo "1. Checking Java version..."
if command -v java &> /dev/null; then
    java_version=$(java -version 2>&1 | head -1)
    echo "   Java version: $java_version"
    
    # Check if it's Java 17
    if java -version 2>&1 | grep -q "version \"17"; then
        echo "   ✅ Java 17 detected"
    else
        echo "   ❌ Java 17 not detected. Please install Java 17."
    fi
else
    echo "   ❌ Java not found. Please install Java 17."
fi

echo

# Check JAVA_HOME
echo "2. Checking JAVA_HOME..."
if [ -n "$JAVA_HOME" ]; then
    echo "   JAVA_HOME: $JAVA_HOME"
    if [[ "$JAVA_HOME" == *"jdk-17"* ]] || [[ "$JAVA_HOME" == *"java-17"* ]] || [[ "$JAVA_HOME" == *"openjdk-17"* ]]; then
        echo "   ✅ JAVA_HOME points to Java 17"
    else
        echo "   ⚠️  JAVA_HOME may not point to Java 17"
    fi
else
    echo "   ⚠️  JAVA_HOME not set. Please set JAVA_HOME to your Java 17 installation."
fi

echo

# Check Maven Wrapper
echo "3. Checking Maven Wrapper..."
if [ -f "productdevelopment/mvnw" ] && [ -f "productdevelopment/mvnw.cmd" ]; then
    echo "   ✅ Maven Wrapper found"
    
    # Try to get Maven version
    if cd productdevelopment && ./mvnw --version &> /dev/null; then
        echo "   ✅ Maven Wrapper is working"
        cd ..
    else
        echo "   ❌ Maven Wrapper is not working properly"
        cd ..
    fi
else
    echo "   ❌ Maven Wrapper not found"
fi

echo

# Check project structure
echo "4. Checking project structure..."
if [ -d "productdevelopment" ] && [ -d "free-react-tailwind-admin-dashboard-main" ]; then
    echo "   ✅ Project directories found"
else
    echo "   ❌ Project directories not found. Please check your project structure."
fi

echo

# Check key files
echo "5. Checking key files..."
if [ -f "productdevelopment/pom.xml" ]; then
    echo "   ✅ pom.xml found"
else
    echo "   ❌ pom.xml not found"
fi

if [ -f "productdevelopment/src/main/java/com/htc/productdevelopment/model/User.java" ]; then
    echo "   ✅ User.java found"
else
    echo "   ❌ User.java not found"
fi

echo
echo "=== Verification Complete ==="
echo
echo "If all checks passed, you're ready to build the project."
echo "Next steps:"
echo "  1. cd productdevelopment"
echo "  2. ./mvnw clean install"
echo "  3. ./mvnw spring-boot:run"