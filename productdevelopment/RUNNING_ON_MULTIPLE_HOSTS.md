# Running the Application on Multiple Hosts

This guide explains how to run the Product Development application on both localhost and your local network IP (192.168.1.115).

## Configuration Changes Made

1. **Server Binding**: The application is now configured to bind to all network interfaces (`0.0.0.0`) instead of just localhost.
2. **CORS Configuration**: Updated to allow requests from both localhost and 192.168.1.115 origins.
3. **Profile-Specific Configuration**: Created a dedicated `application-local.properties` file for local development.

## How to Run

### Option 1: Using the default profile (recommended for most cases)
```bash
./mvnw spring-boot:run
```

The application will be accessible at:
- http://localhost:8080
- http://192.168.1.115:8080

### Option 2: Using the local profile
```bash
./mvnw spring-boot:run -Dspring.profiles.active=local
```

The application will be accessible at:
- http://localhost:8080
- http://192.168.1.115:8080

## Frontend Access

When accessing the frontend, you can now use either:
- http://localhost:5173 (for local development)
- http://192.168.1.115:5173 (for accessing from other devices on the network)

## Troubleshooting

1. **Port already in use**: If port 8080 is already in use, you can change it in the `application.properties` file:
   ```
   server.port=8081
   ```

2. **Network access issues**: Make sure your firewall allows connections on port 8080.

3. **Database connection issues**: The local profile uses a local PostgreSQL database. Make sure PostgreSQL is running and the credentials are correct.