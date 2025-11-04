# Jira Integration Guide

This document explains how to integrate the dashboard with Jira to fetch and display projects.

## Setup

1. Create a `.env` file in the root of the project (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Obtain your Jira API credentials:
   - Go to your Jira instance
   - Navigate to Profile > Account settings > Security > API token
   - Create a new API token

3. Update the `.env` file with your credentials:
   ```
   VITE_JIRA_BASE_URL=https://your-domain.atlassian.net
   VITE_JIRA_API_TOKEN=your-generated-api-token
   VITE_JIRA_EMAIL=your-email@domain.com
   ```

## How It Works

The integration works by:

1. On component mount, the `fetchJiraProjects` function is called
2. If API credentials are provided, it makes a request to the Jira REST API
3. The response is transformed into the Project format used by the sidebar
4. Projects are displayed in the dropdown with the same logic (max 3 + "View All")

## Fallback Behavior

If Jira credentials are not provided or the API call fails, the application will use the default projects:
- Ecommerce
- CRM
- Analytics
- Project Management
- Create New Project

## Customization

To modify the Jira API endpoint or response handling, update:
- `src/config/jiraConfig.ts` - API endpoints and authentication
- `fetchJiraProjects` function in `AppSidebar.tsx` - Response transformation

## Security Notes

- API tokens are stored in environment variables and are only accessible on the client side
- Credentials are not exposed in the bundled JavaScript
- For production, ensure your `.env` file is not committed to version control