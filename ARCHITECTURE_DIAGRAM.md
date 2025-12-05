# System Architecture Diagrams

## Current Architecture

```mermaid
graph TD
    A[Frontend - React App] --> B[Jira Service TS]
    B --> C[Jira Controller Java]
    C --> D[Jira Service Java]
    C --> E[Contract Details Service]
    C --> F[Contract Attachment Service]
    D --> G[Jira Cloud API]
    E --> H[Database]
    F --> H
    H --> I[Contract Details Entity]
    H --> J[Contract Attachment Entity]
    H --> K[Contract Proposal Entity]
```

## Proposed Segregated Architecture

```mermaid
graph TD
    A[Frontend - React App] --> B[Jira Service TS]
    B --> C[API Gateway]
    
    C --> D[Jira Integration Service]
    C --> E[Contract Management Service]
    C --> F[Attachment Management Service]
    
    D --> G[Jira Cloud API]
    E --> H[Database]
    F --> H
    
    H --> I[Contract Details Entity]
    H --> J[Contract Attachment Entity]
    H --> K[Contract Proposal Entity]
    
    D -.-> E
    D -.-> F
    E -.-> F
```

## Service Boundaries

### Jira Integration Service
- Responsible for all direct communication with Jira Cloud API
- No business logic, only API translation
- Methods:
  - `getIssueByKey()`
  - `createIssue()`
  - `updateIssue()`
  - `addAttachment()`
  - `getAttachments()`
  - `transitionIssue()`

### Contract Management Service
- Handles all contract business logic
- Coordinates with Jira Integration Service for external calls
- Manages contract lifecycle
- Methods:
  - `createContract()`
  - `updateContract()`
  - `getContracts()`
  - `validateContract()`

### Attachment Management Service
- Manages attachment metadata storage
- Coordinates with Jira Integration Service for uploads
- Links attachments to contracts/proposals
- Methods:
  - `saveAttachmentMetadata()`
  - `getAttachmentMetadata()`
  - `linkAttachmentToContract()`
  - `linkAttachmentToProposal()`

## Data Flow Examples

### Creating a Contract with Attachment

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GW as API Gateway
    participant JIS as Jira Integration
    participant CMS as Contract Management
    participant AMS as Attachment Management
    participant JIRA as Jira Cloud
    participant DB as Database

    FE->>GW: Create contract with attachment
    GW->>CMS: Process contract creation
    CMS->>JIS: Create issue in Jira
    JIS->>JIRA: POST /issue
    JIRA-->>JIS: Issue created
    JIS-->>CMS: Return issue details
    CMS->>AMS: Save contract details
    AMS->>DB: Store contract
    CMS-->>GW: Contract created
    GW->>JIS: Upload attachment
    JIS->>JIRA: POST /attachments
    JIRA-->>JIS: Attachment details
    JIS->>AMS: Save attachment metadata
    AMS->>DB: Store attachment metadata
    JIS-->>GW: Attachment uploaded
    GW-->>FE: Success response
```

### Retrieving Attachments

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GW as API Gateway
    participant AMS as Attachment Management
    participant JIS as Jira Integration
    participant JIRA as Jira Cloud
    participant DB as Database

    FE->>GW: Get attachments for issue
    GW->>AMS: Get attachment metadata
    AMS->>DB: Query attachments
    DB-->>AMS: Attachment metadata
    AMS-->>GW: Metadata list
    GW->>JIS: Get attachment content
    JIS->>JIRA: GET /attachment/{id}
    JIRA-->>JIS: Attachment content
    JIS-->>GW: Content
    GW-->>FE: Attachment content
```