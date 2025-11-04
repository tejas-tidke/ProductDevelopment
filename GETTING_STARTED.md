# Getting Started Guide

This guide will help you set up and run the Product Development project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- Java 17 or higher
- Node.js 16 or higher
- MySQL 8.0 or higher
- Git

## Backend Setup

### 1. Database Configuration

1. Install MySQL if you haven't already
2. Create a new database:
   ```sql
   CREATE DATABASE product_development_db;
   ```
3. Update the database credentials in `productdevelopment/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/product_development_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

### 2. Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com/
2. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
3. Save the JSON file as `productdevelopment/src/main/resources/firebase-service-account.json`

### 3. Jira Configuration

1. Obtain your Jira API credentials:
   - Jira base URL (e.g., https://your-domain.atlassian.net)
   - Email address
   - API token (generate at https://id.atlassian.com/manage/api-tokens)
2. Update the Jira credentials in `productdevelopment/src/main/resources/application.properties`:
   ```properties
   jira.base-url=https://your-domain.atlassian.net
   jira.email=your_email@domain.com
   jira.api-token=your_api_token
   ```

### 4. Run the Backend

1. Navigate to the backend directory:
   ```bash
   cd productdevelopment
   ```
2. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
3. The backend will start on http://localhost:8080

## Frontend Setup

### 1. Install Dependencies

1. Navigate to the frontend directory:
   ```bash
   cd free-react-tailwind-admin-dashboard-main
   ```
2. Install the required packages:
   ```bash
   npm install
   ```

### 2. Environment Variables

1. Create a `.env` file in the frontend root directory:
   ```bash
   touch .env
   ```
2. Add the backend API URL:
   ```env
   VITE_API_URL=http://localhost:8080
   ```

### 3. Run the Frontend

1. Start the development server:
   ```bash
   npm run dev
   ```
2. The frontend will start on http://localhost:5173

## First Time Usage

### 1. Access the Application

1. Open your browser and go to http://localhost:5173
2. The application should load with the login screen

### 2. Login

1. Use your Firebase credentials to log in
2. The first user to log in will automatically be assigned the ADMIN role
3. Subsequent users will be assigned the USER role by default

### 3. View Projects

1. After logging in, you'll be redirected to the dashboard
2. Navigate to "All Projects" to see your Jira projects
3. Click on any project to view its details

## Common Issues and Solutions

### Database Connection Failed

- Ensure MySQL is running
- Verify database credentials in `application.properties`
- Check that the `product_development_db` database exists

### Firebase Authentication Not Working

- Verify `firebase-service-account.json` exists in the correct location
- Check that the Firebase project is properly configured
- Ensure the user exists in Firebase

### Jira API Not Returning Data

- Verify Jira credentials in `application.properties`
- Check that the API token has the necessary permissions
- Confirm that the project key exists in Jira

### CORS Errors

- Check that the frontend URL is allowed in `CorsConfig.java`
- Ensure the backend is running on http://localhost:8080

## Development Workflow

### Backend Development

1. Make changes to Java files in `productdevelopment/src/main/java/`
2. The application will automatically restart with Spring Boot DevTools
3. Check the console for any compilation errors

### Frontend Development

1. Make changes to TypeScript/React files in `free-react-tailwind-admin-dashboard-main/src/`
2. The frontend will automatically reload with Vite's hot module replacement
3. Check the browser console for any errors

## Building for Production

### Backend

1. Navigate to the backend directory:
   ```bash
   cd productdevelopment
   ```
2. Build the application:
   ```bash
   ./mvnw clean package
   ```
3. The JAR file will be created in `target/`

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd free-react-tailwind-admin-dashboard-main
   ```
2. Build the application:
   ```bash
   npm run build
   ```
3. The built files will be in `dist/`

## Next Steps

1. Explore the different pages and features
2. Review the documentation files:
   - [Backend Documentation](BACKEND_DOCUMENTATION.md)
   - [Frontend Documentation](FRONTEND_DOCUMENTATION.md)
   - [README](README.md)
3. Try creating new projects or issues
4. Experiment with user role management