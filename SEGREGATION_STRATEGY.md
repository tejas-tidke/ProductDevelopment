# Jira Service Backend Segregation Strategy

This document explains how to segregate the Jira service backend components without making any changes to the existing code, just organizing and understanding the current structure.

## Understanding the Current Structure

The Jira service functionality is currently distributed across several components:

### 1. Frontend Service Layer
**File**: `free-react-tailwind-admin-dashboard-main/src/services/jiraService.ts`

This TypeScript service acts as the frontend interface to all backend Jira functionality.

**Key Functional Areas**:
- Issue management (create, update, get)
- Attachment handling (upload, retrieve)
- Contract creation
- User and project management
- Transition handling

### 2. Backend Controller Layer
**File**: `productdevelopment/src/main/java/com/htc/productdevelopment/controller/JiraController.java`

This is the main entry point for all Jira-related API requests from the frontend.

**Endpoint Categories**:
- **Pure Jira API Endpoints**: Direct proxies to Jira Cloud
  - `/api/jira/issues/{issueIdOrKey}` (GET, PUT)
  - `/api/jira/issues` (POST)
  - `/api/jira/issues/{issueIdOrKey}/attachments` (POST, GET)
  - `/api/jira/issues/{issueIdOrKey}/transitions` (GET, POST)

- **Business Logic Endpoints**: Custom application logic
  - `/api/jira/contracts/create` (POST)
  - `/api/jira/contracts` (GET)
  - `/api/jira/contracts/type/{contractType}/dto` (GET)

- **Attachment Management Endpoints**: Local attachment handling
  - `/api/jira/contracts/attachments/issue/{issueKey}` (GET)
  - `/api/jira/contracts/attachments/{attachmentId}/content` (GET)
  - `/api/jira/contracts/save-attachment` (POST)

### 3. Backend Service Layers

#### Jira Service
**File**: `productdevelopment/src/main/java/com/htc/productdevelopment/service/JiraService.java`

Handles all direct communication with Jira Cloud API:
- `getIssueByIdOrKey()` - Fetch issues
- `addAttachmentToIssue()` - Upload attachments
- `getIssueAttachments()` - Retrieve attachment metadata
- `createIssueJira()` - Create issues
- `updateIssueJira()` - Update issues
- And other pure Jira API methods

#### Contract Details Service
**File**: `productdevelopment/src/main/java/com/htc/productdevelopment/service/ContractDetailsService.java`

Handles business logic for contract management:
- `createContractIssue()` - Process contract creation
- `getContractsByTypeAsDTO()` - Retrieve contracts
- Contract data processing and validation

#### Contract Attachment Service
**File**: `productdevelopment/src/main/java/com/htc/productdevelopment/service/ContractAttachmentService.java`

Manages local attachment metadata storage:
- `saveAttachment()` - Store attachment metadata
- `getAttachmentsByIssueKey()` - Retrieve attachments
- `getAttachmentsByProposalId()` - Retrieve proposal attachments

## How Components Depend on Each Other

### Frontend to Backend Dependencies
The frontend `jiraService.ts` makes HTTP requests to various endpoints in `JiraController.java`:

1. **Issue Management**:
   - `getIssueByIdOrKey()` → `/api/jira/issues/{issueIdOrKey}`
   - `createIssue()` → `/api/jira/issues`
   - `updateIssue()` → `/api/jira/issues/{issueIdOrKey}`

2. **Attachment Handling**:
   - `addAttachmentToIssue()` → `/api/jira/issues/{issueIdOrKey}/attachments` (POST)
   - `getIssueAttachments()` → `/api/jira/issues/{issueIdOrKey}/attachments` (GET)

3. **Contract Operations**:
   - `createContractIssue()` → `/api/jira/contracts/create`
   - `getContractsByTypeAsDTO()` → `/api/jira/contracts/type/{contractType}/dto`

### Backend Internal Dependencies
Within the backend, services depend on each other:

1. **JiraController** depends on:
   - `JiraService` for Jira API calls
   - `ContractDetailsService` for contract logic
   - `ContractAttachmentService` for attachment management

2. **ContractDetailsService** depends on:
   - `JiraService` to create issues in Jira
   - Database repositories for contract data

3. **ContractAttachmentService** depends on:
   - Database repositories for attachment data

## Segregation Without Changes

To understand the segregation without making changes, think of the components as already separated into logical domains:

### Domain 1: Jira API Integration
**Scope**: Everything that directly communicates with Jira Cloud
**Components**:
- Methods in `JiraService.java` that make HTTP calls to Jira
- Corresponding endpoints in `JiraController.java`
- The `jiraService.ts` frontend methods that call these endpoints

**Key Characteristics**:
- No business logic, only API translation
- Stateless operations
- Direct mapping to Jira REST API
- Error handling focused on network/API issues

### Domain 2: Contract Business Logic
**Scope**: Application-specific contract management
**Components**:
- `ContractDetailsService.java`
- Contract-related endpoints in `JiraController.java`
- Database entities and repositories for contracts

**Key Characteristics**:
- Contains business rules and validation
- Manages contract lifecycle
- Coordinates with Jira API integration for external calls
- Handles data transformation and processing

### Domain 3: Attachment Management
**Scope**: Local attachment metadata handling
**Components**:
- `ContractAttachmentService.java`
- Attachment-related endpoints in `JiraController.java`
- `ContractAttachment` entity and repository
- Database storage of attachment metadata

**Key Characteristics**:
- Stores metadata locally while files are in Jira
- Links attachments to contracts and proposals
- Provides querying capabilities for attachments
- Handles content serving (redirects to Jira)

## Current Data Flow

### Creating a Contract with Attachment (Simplified)
1. **Frontend**: Calls `jiraService.createContractIssue()` and `jiraService.addAttachmentToIssue()`
2. **Backend Controller**: Receives requests at `/api/jira/contracts/create` and `/api/jira/issues/{key}/attachments`
3. **Contract Service**: Processes contract creation, calls JiraService to create issue in Jira
4. **Jira Service**: Makes HTTP call to Jira Cloud API
5. **Attachment Service**: Saves metadata to local database after successful Jira upload
6. **Response**: Returns results back through the chain to frontend

### Retrieving Attachments (Simplified)
1. **Frontend**: Calls `jiraService.getIssueAttachments()`
2. **Backend Controller**: Receives request at `/api/jira/issues/{key}/attachments`
3. **Jira Service**: Makes HTTP call to Jira Cloud API to get attachment metadata
4. **Response**: Returns attachment metadata to frontend

## Key Integration Points

### Between Jira API and Business Logic
- Contract creation requires creating a Jira issue
- Attachment uploads require calling Jira API
- Issue updates may trigger business logic

### Between Business Logic and Attachment Management
- After creating issues in Jira, metadata is stored locally
- Attachments are linked to contracts and proposals
- Local queries enhance Jira attachment data

## Benefits of Current Segregation

Even without explicit changes, the current structure already provides good separation:

1. **Clear Responsibilities**: Each component has a defined purpose
2. **Loose Coupling**: Services can be understood independently
3. **Reusability**: Jira API methods can be used by multiple business services
4. **Maintainability**: Changes to one domain have limited impact on others
5. **Testability**: Each domain can be tested separately

## Future Considerations

If you were to enhance the segregation, you could:

1. **Create Explicit Service Boundaries**: Define clear interfaces between domains
2. **Implement API Gateway Pattern**: Route requests through a central gateway
3. **Add Circuit Breakers**: Protect against Jira API failures
4. **Implement Caching**: Cache frequently accessed Jira data
5. **Add Monitoring**: Track performance and errors across domains

This analysis shows that the backend is already well-structured for segregation, with clear boundaries between Jira API integration, business logic, and attachment management.