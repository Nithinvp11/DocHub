# DocHub - Entity and Attribute List (Table Format)

Reference style followed: `Table No`, `Table Name`, `Table Description`, and `FIELD | DATATYPE | CONSTRAINT`.

Full all-model version (38 Prisma models): see [PROJECT_ENTITY_TABLES_FULL.md](PROJECT_ENTITY_TABLES_FULL.md).

Table No: 1  
Table Name: User  
Table Description: Stores platform user accounts, authentication profile, and role (`USER`/`ADMIN`).

| FIELD                | DATATYPE       | CONSTRAINT              |
| -------------------- | -------------- | ----------------------- |
| id                   | varchar        | Primary Key             |
| username             | varchar        | Unique, Nullable        |
| name                 | varchar        | Nullable                |
| email                | varchar        | Unique, Not Null        |
| emailVerified        | timestamp      | Nullable                |
| image                | varchar        | Nullable                |
| password             | varchar        | Nullable                |
| githubLinked         | boolean        | Not Null, Default false |
| githubUserId         | integer        | Nullable, Indexed       |
| githubUsername       | varchar        | Nullable, Indexed       |
| githubAvatarUrl      | varchar        | Nullable                |
| githubProfileUrl     | varchar        | Nullable                |
| githubEmail          | varchar        | Nullable                |
| githubTokenScopes    | varchar[]      | Not Null                |
| githubTokenExpiresAt | timestamp      | Nullable                |
| role                 | enum(UserRole) | Not Null, Default USER  |
| createdAt            | timestamp      | Not Null, Default now() |
| updatedAt            | timestamp      | Not Null                |

Table No: 2  
Table Name: Account  
Table Description: Stores OAuth/provider account mapping for user login providers.

| FIELD             | DATATYPE | CONSTRAINT                        |
| ----------------- | -------- | --------------------------------- |
| id                | varchar  | Primary Key                       |
| userId            | varchar  | Foreign Key -> User(id), Not Null |
| type              | varchar  | Not Null                          |
| provider          | varchar  | Not Null                          |
| providerAccountId | varchar  | Not Null                          |
| refresh_token     | text     | Nullable                          |
| access_token      | text     | Nullable                          |
| expires_at        | integer  | Nullable                          |
| token_type        | varchar  | Nullable                          |
| scope             | varchar  | Nullable                          |
| id_token          | text     | Nullable                          |
| session_state     | varchar  | Nullable                          |

Table No: 3  
Table Name: Session  
Table Description: Stores active authentication sessions.

| FIELD        | DATATYPE  | CONSTRAINT                        |
| ------------ | --------- | --------------------------------- |
| id           | varchar   | Primary Key                       |
| sessionToken | varchar   | Unique, Not Null                  |
| userId       | varchar   | Foreign Key -> User(id), Not Null |
| expires      | timestamp | Not Null                          |

Table No: 4  
Table Name: Workspace  
Table Description: Stores workspace-level containers for documents and collaboration.

| FIELD       | DATATYPE  | CONSTRAINT                        |
| ----------- | --------- | --------------------------------- |
| id          | varchar   | Primary Key                       |
| name        | varchar   | Not Null                          |
| description | varchar   | Nullable                          |
| ownerId     | varchar   | Foreign Key -> User(id), Not Null |
| createdAt   | timestamp | Not Null, Default now()           |
| updatedAt   | timestamp | Not Null                          |

Table No: 5  
Table Name: WorkspaceMember  
Table Description: Stores workspace membership and capability-based permissions.

| FIELD       | DATATYPE  | CONSTRAINT                             |
| ----------- | --------- | -------------------------------------- |
| id          | varchar   | Primary Key                            |
| workspaceId | varchar   | Foreign Key -> Workspace(id), Not Null |
| userId      | varchar   | Foreign Key -> User(id), Not Null      |
| permissions | varchar[] | Not Null                               |
| grantedById | varchar   | Nullable                               |
| grantRootId | varchar   | Nullable                               |
| grantDepth  | integer   | Not Null, Default 0                    |
| createdAt   | timestamp | Not Null, Default now()                |

Table No: 6  
Table Name: Document  
Table Description: Stores documents, metadata, hierarchy, and GitHub sync pointers.

| FIELD               | DATATYPE             | CONSTRAINT                             |
| ------------------- | -------------------- | -------------------------------------- |
| id                  | varchar              | Primary Key                            |
| title               | varchar              | Not Null                               |
| content             | text                 | Not Null                               |
| path                | varchar              | Not Null                               |
| phase               | enum(DocumentPhase)  | Not Null, Default PLANNING             |
| type                | enum(DocumentType)   | Not Null, Default GENERAL              |
| workspaceId         | varchar              | Foreign Key -> Workspace(id), Not Null |
| authorId            | varchar              | Foreign Key -> User(id), Not Null      |
| parentId            | varchar              | Foreign Key -> Document(id), Nullable  |
| emoji               | varchar              | Nullable                               |
| coverImage          | varchar              | Nullable                               |
| status              | enum(DocumentStatus) | Not Null, Default DRAFT                |
| properties          | json                 | Nullable                               |
| diagrams            | json                 | Nullable                               |
| wordCount           | integer              | Not Null, Default 0                    |
| readingTime         | integer              | Not Null, Default 0                    |
| githubPath          | varchar              | Nullable                               |
| githubSha           | varchar              | Nullable                               |
| githubAutoGenerated | boolean              | Not Null, Default false                |
| createdAt           | timestamp            | Not Null, Default now()                |
| updatedAt           | timestamp            | Not Null                               |
| lastViewedAt        | timestamp            | Nullable                               |

Table No: 7  
Table Name: Version  
Table Description: Stores document version snapshots and version metadata.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key                           |
| documentId | varchar   | Foreign Key -> Document(id), Not Null |
| content    | text      | Not Null                              |
| diff       | text      | Nullable                              |
| message    | varchar   | Not Null                              |
| sha        | varchar   | Nullable                              |
| label      | varchar   | Nullable                              |
| authorId   | varchar   | Foreign Key -> User(id), Not Null     |
| version    | integer   | Not Null                              |
| isAutoSave | boolean   | Not Null, Default false               |
| isDraft    | boolean   | Not Null, Default false               |
| createdAt  | timestamp | Not Null, Default now()               |

Table No: 8  
Table Name: Comment  
Table Description: Stores document comments for collaboration.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key                           |
| documentId | varchar   | Foreign Key -> Document(id), Not Null |
| authorId   | varchar   | Foreign Key -> User(id), Not Null     |
| content    | text      | Not Null                              |
| resolved   | boolean   | Not Null, Default false               |
| createdAt  | timestamp | Not Null, Default now()               |
| updatedAt  | timestamp | Not Null                              |

Table No: 9  
Table Name: GitHubRepo  
Table Description: Stores workspace repository integration and sync settings.

| FIELD                | DATATYPE  | CONSTRAINT                                   |
| -------------------- | --------- | -------------------------------------------- |
| id                   | varchar   | Primary Key                                  |
| workspaceId          | varchar   | Foreign Key -> Workspace(id), Not Null       |
| repoOwner            | varchar   | Not Null                                     |
| repoName             | varchar   | Not Null                                     |
| installationId       | integer   | Nullable                                     |
| accessToken          | text      | Nullable                                     |
| lastSyncedAt         | timestamp | Nullable                                     |
| syncMode             | varchar   | Not Null, Default direct                     |
| autoSyncOnSave       | boolean   | Not Null, Default false                      |
| syncDebounceMs       | integer   | Not Null, Default 5000                       |
| defaultCommitMessage | varchar   | Not Null, Default docs: update documentation |
| autoCreatePR         | boolean   | Not Null, Default false                      |
| prTemplate           | text      | Nullable                                     |
| webhookId            | varchar   | Nullable                                     |
| webhookSecret        | varchar   | Nullable                                     |
| hasWriteAccess       | boolean   | Not Null, Default false                      |
| createdAt            | timestamp | Not Null, Default now()                      |
| updatedAt            | timestamp | Not Null                                     |

Table No: 10  
Table Name: Notification  
Table Description: Stores in-app notifications for users.

| FIELD     | DATATYPE               | CONSTRAINT                        |
| --------- | ---------------------- | --------------------------------- |
| id        | varchar                | Primary Key                       |
| userId    | varchar                | Foreign Key -> User(id), Not Null |
| type      | enum(NotificationType) | Not Null                          |
| title     | varchar                | Not Null                          |
| message   | varchar                | Not Null                          |
| link      | varchar                | Nullable                          |
| read      | boolean                | Not Null, Default false           |
| createdAt | timestamp              | Not Null, Default now()           |

Table No: 11  
Table Name: Feedback  
Table Description: Stores product feedback submitted by users and managed by admins. Enables users to submit suggestions, bug reports, and reviews, while admins triage, assign, track progress, and document resolutions. Supports categorization, priority-based routing, screenshot attachments, and comprehensive status tracking.

| FIELD       | DATATYPE               | CONSTRAINT                             |
| ----------- | ---------------------- | -------------------------------------- |
| id          | varchar                | Primary Key                            |
| workspaceId | varchar                | Foreign Key -> Workspace(id), Nullable |
| documentId  | varchar                | Foreign Key -> Document(id), Nullable  |
| userId      | varchar                | Foreign Key -> User(id), Nullable      |
| type        | enum(FeedbackType)     | Not Null, Default GENERAL              |
| category    | varchar                | Nullable                               |
| title       | varchar                | Not Null                               |
| description | text                   | Not Null                               |
| rating      | integer                | Nullable (range 1-5)                   |
| status      | enum(FeedbackStatus)   | Not Null, Default NEW                  |
| priority    | enum(FeedbackPriority) | Not Null, Default MEDIUM               |
| url         | varchar                | Nullable                               |
| userAgent   | varchar                | Nullable                               |
| screenshot  | varchar                | Nullable (image URL/path)              |
| adminNotes  | text                   | Nullable                               |
| assignedTo  | varchar                | Foreign Key -> User(id), Nullable      |
| resolution  | text                   | Nullable (resolution details)          |
| tags        | varchar[]              | Nullable (searchable tags array)       |
| createdAt   | timestamp              | Not Null, Default now()                |
| updatedAt   | timestamp              | Not Null                               |
| resolvedAt  | timestamp              | Nullable                               |

Table No: 12  
Table Name: SyncQueue  
Table Description: Stores asynchronous GitHub sync jobs for documents/workspaces.

| FIELD        | DATATYPE  | CONSTRAINT                              |
| ------------ | --------- | --------------------------------------- |
| id           | varchar   | Primary Key                             |
| documentId   | varchar   | Foreign Key -> Document(id), Not Null   |
| workspaceId  | varchar   | Foreign Key -> Workspace(id), Not Null  |
| operation    | varchar   | Not Null                                |
| priority     | integer   | Not Null, Default 0                     |
| status       | varchar   | Not Null, Default pending               |
| attemptCount | integer   | Not Null, Default 0                     |
| maxAttempts  | integer   | Not Null, Default 3                     |
| error        | text      | Nullable                                |
| metadata     | json      | Nullable                                |
| scheduledAt  | timestamp | Not Null, Default now()                 |
| startedAt    | timestamp | Nullable                                |
| completedAt  | timestamp | Nullable                                |
| createdAt    | timestamp | Not Null, Default now()                 |
| updatedAt    | timestamp | Not Null                                |
| repoId       | varchar   | Foreign Key -> GitHubRepo(id), Nullable |

Table No: 13  
Table Name: DocSyncInfo  
Table Description: Stores one-to-one sync metadata between a document and GitHub path/branch.

| FIELD              | DATATYPE               | CONSTRAINT                                    |
| ------------------ | ---------------------- | --------------------------------------------- |
| id                 | varchar                | Primary Key                                   |
| documentId         | varchar                | Foreign Key -> Document(id), Unique, Not Null |
| workspaceId        | varchar                | Not Null                                      |
| githubRepository   | varchar                | Not Null                                      |
| githubBranch       | varchar                | Not Null, Default main                        |
| githubPath         | varchar                | Not Null                                      |
| lastSyncedAt       | timestamp              | Nullable                                      |
| externalVersion    | integer                | Not Null, Default 0                           |
| derivedVersion     | integer                | Not Null, Default 0                           |
| lastExternalHash   | varchar                | Nullable                                      |
| lastDerivedHash    | varchar                | Nullable                                      |
| lastCommitSha      | varchar                | Nullable                                      |
| lastCommitUrl      | varchar                | Nullable                                      |
| autoSync           | boolean                | Not Null, Default false                       |
| syncDirection      | enum(SyncDirection)    | Not Null, Default BIDIRECTIONAL               |
| conflictResolution | enum(ConflictStrategy) | Not Null, Default MANUAL                      |
| syncStatus         | enum(SyncStatus)       | Not Null, Default SYNCED                      |
| lastError          | text                   | Nullable                                      |
| errorCount         | integer                | Not Null, Default 0                           |
| needSyncToGitHub   | boolean                | Not Null, Default false                       |
| needSyncFromGitHub | boolean                | Not Null, Default false                       |
| createdAt          | timestamp              | Not Null, Default now()                       |
| updatedAt          | timestamp              | Not Null                                      |

Table No: 14  
Table Name: GitHubWebhook  
Table Description: Stores GitHub webhook registration and delivery health per workspace/repo.

| FIELD           | DATATYPE  | CONSTRAINT                              |
| --------------- | --------- | --------------------------------------- |
| id              | varchar   | Primary Key                             |
| workspaceId     | varchar   | Foreign Key -> Workspace(id), Not Null  |
| repoId          | varchar   | Foreign Key -> GitHubRepo(id), Not Null |
| githubWebhookId | varchar   | Unique, Not Null                        |
| secret          | varchar   | Not Null                                |
| events          | varchar[] | Not Null                                |
| active          | boolean   | Not Null, Default true                  |
| lastDeliveryAt  | timestamp | Nullable                                |
| lastStatus      | varchar   | Nullable                                |
| createdAt       | timestamp | Not Null, Default now()                 |
| updatedAt       | timestamp | Not Null                                |

---

## Notes

- Prisma schema contains additional models (38 total). This document focuses on the primary operational entities used in authentication, collaboration, feedback, and GitHub sync workflows.
- Enums used above: `UserRole`, `DocumentPhase`, `DocumentType`, `DocumentStatus`, `NotificationType`, `FeedbackType`, `FeedbackStatus`, `FeedbackPriority`, `SyncDirection`, `ConflictStrategy`, `SyncStatus`.
