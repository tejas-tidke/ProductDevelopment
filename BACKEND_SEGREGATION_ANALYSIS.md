# Backend Segregation Analysis for Jira Service

This document provides a comprehensive analysis of how to segregate the backend Jira service functionality, identifying dependencies and explaining the current architecture.

## Current Architecture Overview

The current system consists of:
1. **Frontend** - React application with jiraService.ts
2. **Backend** - Spring Boot application with JiraController and related services
3. **Database** - MySQL with contract-related entities
4. **External Integration** - Jira Cloud API

## Jira Service Components Analysis

### 1. Core Jira API Integration Layer
Located in: `productdevelopment/src/main/java/com/htc/productdevelopment/service/JiraService.java`

#### Key Methods:
- `makeJiraApiCall()` - Generic API call handler
- `getIssueByIdOrKey()` - Fetch issues from Jira
- `addAttachmentToIssue()` - Upload attachments to Jira
- `getIssueAttachments()` - Retrieve attachments from Jira
- `getAttachmentContent()` - Get attachment content from Jira
- `createIssueJira()` - Create issues in Jira
- `updateIssueJira()` - Update issues in Jira
- `transitionIssueJira()` - Change issue status in Jira

#### Dependencies:
- Jira configuration (email, API token, base URL)
- Jackson ObjectMapper for JSON processing
- Spring RestTemplate for HTTP requests
- Java Base64 encoder for authentication
- Spring logging framework

### 2. Contract Management Layer
Located in: `productdevelopment/src/main/java/com/htc/productdevelopment/service/ContractDetailsService.java`

#### Key Methods:
- `getContractsByTypeAsDTO()` - Get contracts by type
- `createContractIssue()` - Process contract creation requests
- Various contract data manipulation methods

#### Dependencies:
- ContractDetails entity
- ContractDetailsRepository
- ContractDTO
- JiraService for external API calls

### 3. Attachment Management Layer
Located in: `productdevelopment/src/main/java/com/htc/productdevelopment/service/ContractAttachmentService.java`

#### Key Methods:
- `saveAttachment()` - Save attachment metadata to database
- `getAttachmentsByIssueKey()` - Retrieve attachments by Jira issue key
- `getAttachmentsByProposalId()` - Retrieve attachments by proposal ID
- `getAttachmentsByStage()` - Retrieve attachments by contract stage

#### Dependencies:
- ContractAttachment entity
- ContractAttachmentRepository
- ContractDetailsRepository
- ContractProposalRepository

## Controller Layer Analysis
Located in: `productdevelopment/src/main/java/com/htc/productdevelopment/controller/JiraController.java`

### Key Endpoints:

#### Jira Integration Endpoints:
- `POST /api/jira/issues/{issueIdOrKey}/attachments` - Upload attachment to Jira
- `GET /api/jira/issues/{issueIdOrKey}/attachments` - Get attachments from Jira
- `GET /api/jira/attachment/content/{attachmentId}` - Get attachment content from Jira
- `POST /api/jira/issues` - Create issue in Jira
- `PUT /api/jira/issues/{issueIdOrKey}` - Update issue in Jira
- `GET /api/jira/issues/{issueIdOrKey}` - Get issue from Jira

#### Contract Management Endpoints:
- `POST /api/jira/contracts/create` - Create contract issue
- `GET /api/jira/contracts` - Get all contracts
- `GET /api/jira/contracts/type/{contractType}/dto` - Get contracts by type as DTO

#### Attachment Management Endpoints:
- `GET /api/jira/contracts/attachments/issue/{issueKey}` - Get attachments by issue key
- `GET /api/jira/contracts/attachments/{attachmentId}/content` - Serve attachment content
- `POST /api/jira/contracts/save-attachment` - Save attachment metadata

## Frontend Dependencies Analysis
Located in: `free-react-tailwind-admin-dashboard-main/src/services/jiraService.ts`

### Key Methods:
- `jiraApiCall()` - Generic API call wrapper
- `addAttachmentToIssue()` - Upload attachments to backend
- `createContractIssue()` - Create contract issues
- `getContractsByTypeAsDTO()` - Get contracts by type
- `getIssueAttachments()` - Get attachments for issues
- Various other Jira integration methods

### Frontend Components Using jiraService:
1. `CreateIssueModal.tsx` - Uses `createContractIssue()` and `addAttachmentToIssue()`
2. `EditIssueModal.tsx` - Uses `addAttachmentToIssue()`
3. `RequestSplitView.tsx` - Extensive usage of various jiraService methods
4. `AllOpen.tsx` - Uses various issue management methods
5. `VendorList.tsx` - Uses vendor-related methods
6. Many other components throughout the application

## Segregation Strategy

### Option 1: Module-Based Segregation

#### Module 1: Core Jira Integration
- **Purpose**: Pure Jira API integration without business logic
- **Components**:
  - JiraService.java (core methods only)
  - JiraController.java (Jira-specific endpoints)
- **Dependencies**: 
  - Jira configuration
  - Basic Spring Boot components
  - Logging framework

#### Module 2: Contract Management
- **Purpose**: Business logic for contract handling
- **Components**:
  - ContractDetailsService.java
  - ContractAttachmentService.java
  - Contract-related controllers in JiraController.java
  - Contract entities and repositories
- **Dependencies**:
  - Core Jira Integration module (for external calls)
  - Database entities and repositories
  - DTOs for data transfer

#### Module 3: Attachment Management
- **Purpose**: Handle attachment storage and metadata
- **Components**:
  - ContractAttachmentService.java
  - Attachment-related controllers in JiraController.java
  - ContractAttachment entity and repository
- **Dependencies**:
  - Core Jira Integration module (for uploading to Jira)
  - Database entities and repositories

### Option 2: Service-Based Segregation

#### Service 1: JiraApiClientService
- **Purpose**: Low-level Jira API client
- **Methods**:
  - `makeJiraApiCall()`
  - `getIssueByIdOrKey()`
  - `addAttachmentToIssue()`
  - `getIssueAttachments()`
  - `getAttachmentContent()`
  - `createIssueJira()`
  - `updateIssueJira()`
  - `transitionIssueJira()`

#### Service 2: ContractBusinessService
- **Purpose**: High-level contract business logic
- **Methods**:
  - `processContractCreation()`
  - `getContractsByType()`
  - Contract validation and processing methods

#### Service 3: AttachmentManagementService
- **Purpose**: Handle attachment lifecycle
- **Methods**:
  - `storeAttachmentMetadata()`
  - `retrieveAttachmentMetadata()`
  - `linkAttachmentToContract()`
  - `linkAttachmentToProposal()`

## Dependency Mapping

### Inter-Service Dependencies:
```
Frontend Components
    ↓
jiraService.ts (Frontend)
    ↓
JiraController.java (Backend)
    ↓
JiraService.java ←→ ContractDetailsService.java
    ↓                    ↓
ContractAttachmentService.java
    ↓
Database Entities & Repositories
```

### Database Dependencies:
1. **ContractDetails** - Main contract entity
2. **ContractAttachment** - Attachment metadata
3. **ContractProposal** - Proposal information
4. **Related entities** - VendorDetails, Organization, etc.

## Recommendations for Segregation

### 1. Immediate Actions:
1. **Identify pure Jira API methods** in JiraService.java
2. **Separate business logic methods** from pure API methods
3. **Create clear interfaces** between modules
4. **Document API contracts** between frontend and backend

### 2. Medium-term Actions:
1. **Refactor JiraController** to separate concerns:
   - Pure Jira API endpoints
   - Business logic endpoints
   - Attachment management endpoints
2. **Create dedicated services** for each concern
3. **Implement proper error handling** at service boundaries
4. **Add comprehensive logging** for tracing requests

### 3. Long-term Actions:
1. **Consider microservices architecture** if scaling becomes necessary
2. **Implement caching** for frequently accessed Jira data
3. **Add monitoring and metrics** for API performance
4. **Enhance security** with proper authentication and authorization

## Current Attachment Handling Flow

### Upload Process:
1. Frontend calls `jiraService.addAttachmentToIssue()`
2. Backend `JiraController.uploadAttachment()` receives the request
3. `JiraService.addAttachmentToIssue()` uploads to Jira
4. Metadata is saved to `ContractAttachment` entity
5. Response is returned to frontend

### Retrieval Process:
1. Frontend calls `jiraService.getIssueAttachments()`
2. Backend `JiraController.getIssueAttachments()` fetches from Jira
3. Response is returned to frontend

### Local Storage (Current Implementation):
- Metadata is stored in database
- Actual file content is stored in Jira
- Local endpoints redirect to Jira for content

## Conclusion

The current implementation tightly couples Jira API integration with business logic. Segregation should focus on:
1. Separating pure Jira API calls from business logic
2. Creating clear service boundaries
3. Maintaining backward compatibility during refactoring
4. Ensuring proper error handling and logging at service boundaries

This segregation will improve maintainability, testability, and scalability of the Jira integration components.