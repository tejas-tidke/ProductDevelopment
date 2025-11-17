#!/bin/bash

echo "=== Product Development Project Clean and Rebuild ==="
echo

echo "1. Cleaning Maven project..."
cd productdevelopment
./mvnw clean
if [ $? -eq 0 ]; then
    echo "   ✅ Maven clean completed successfully"
else
    echo "   ❌ Maven clean failed"
    cd ..
    exit 1
fi

echo
echo "2. Removing target directory..."
if [ -d "target" ]; then
    rm -rf target
    echo "   ✅ Target directory removed"
else
    echo "   ℹ️  Target directory not found"
fi

echo
echo "3. Cleaning local Maven repository cache for this project..."
REPO_DIR="$HOME/.m2/repository/com/htc"
if [ -d "$REPO_DIR" ]; then
    rm -rf "$REPO_DIR"
    echo "   ✅ Local Maven repository cache cleared"
else
    echo "   ℹ️  Local Maven repository cache not found"
fi

echo
echo "4. Rebuilding project..."
./mvnw clean install
if [ $? -eq 0 ]; then
    echo "   ✅ Project rebuilt successfully"
    echo
    echo "You can now run the application with:"
    echo "   ./mvnw spring-boot:run"
else
    echo "   ❌ Project rebuild failed"
    echo
    echo "Please check the error messages above."
    echo "Refer to LOMBOK_TROUBLESHOOTING.md for detailed solutions."
fi

cd ..