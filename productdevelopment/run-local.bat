@echo off
echo Starting Product Development Application with local profile...
echo The application will be accessible at:
echo  - http://localhost:8080
echo  - http://192.168.1.115:8080
echo.
echo Press Ctrl+C to stop the application.
echo.
./mvnw spring-boot:run -Dspring.profiles.active=local