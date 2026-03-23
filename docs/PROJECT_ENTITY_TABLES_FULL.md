# DocHub - Full Entity and Attribute List (All Prisma Models)

Reference format: Table No, Table Name, Table Description, FIELD, DATATYPE, CONSTRAINT.

Table No: 1  
Table Name: User  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD                | DATATYPE       | CONSTRAINT                            |
| -------------------- | -------------- | ------------------------------------- |
| id                   | varchar        | Primary Key, Not Null, Default cuid() |
| username             | varchar        | Unique, Nullable                      |
| usernameChangedAt    | timestamp      | Nullable                              |
| name                 | varchar        | Nullable                              |
| email                | varchar        | Unique, Not Null                      |
| emailVerified        | timestamp      | Nullable                              |
| image                | varchar        | Nullable                              |
| password             | varchar        | Nullable                              |
| githubLinked         | boolean        | Not Null, Default false               |
| githubUserId         | integer        | Nullable                              |
| githubUsername       | varchar        | Nullable                              |
| githubAvatarUrl      | varchar        | Nullable                              |
| githubProfileUrl     | varchar        | Nullable                              |
| githubEmail          | varchar        | Nullable                              |
| githubTokenScopes    | varchar[]      | Not Null                              |
| githubTokenExpiresAt | timestamp      | Nullable                              |
| role                 | enum(UserRole) | Not Null, Default USER                |
| createdAt            | timestamp      | Not Null, Default now()               |
| updatedAt            | timestamp      | Not Null, Auto-updated                |

Table No: 2  
Table Name: Account  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD             | DATATYPE | CONSTRAINT                            |
| ----------------- | -------- | ------------------------------------- |
| id                | varchar  | Primary Key, Not Null, Default cuid() |
| userId            | varchar  | Foreign Key -> User(id), Not Null     |
| type              | varchar  | Not Null                              |
| provider          | varchar  | Not Null                              |
| providerAccountId | varchar  | Not Null                              |
| refresh_token     | text     | Nullable                              |
| access_token      | text     | Nullable                              |
| expires_at        | integer  | Nullable                              |
| token_type        | varchar  | Nullable                              |
| scope             | varchar  | Nullable                              |
| id_token          | text     | Nullable                              |
| session_state     | varchar  | Nullable                              |

Table No: 3  
Table Name: Session  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD        | DATATYPE  | CONSTRAINT                            |
| ------------ | --------- | ------------------------------------- |
| id           | varchar   | Primary Key, Not Null, Default cuid() |
| sessionToken | varchar   | Unique, Not Null                      |
| userId       | varchar   | Foreign Key -> User(id), Not Null     |
| expires      | timestamp | Not Null                              |

Table No: 3A  
Table Name: LoginEvent  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD     | DATATYPE  | CONSTRAINT                            |
| --------- | --------- | ------------------------------------- |
| id        | varchar   | Primary Key, Not Null, Default cuid() |
| userId    | varchar   | Foreign Key -> User(id), Not Null     |
| createdAt | timestamp | Not Null, Default now()               |

Table No: 4  
Table Name: VerificationToken  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT       |
| ---------- | --------- | ---------------- |
| identifier | varchar   | Not Null         |
| token      | varchar   | Unique, Not Null |
| expires    | timestamp | Not Null         |

Table No: 5  
Table Name: Workspace  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                            |
| ----------- | --------- | ------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid() |
| name        | varchar   | Not Null                              |
| description | varchar   | Nullable                              |
| memberLimit | integer   | Nullable                              |
| ownerId     | varchar   | Foreign Key -> User(id), Not Null     |
| createdAt   | timestamp | Not Null, Default now()               |
| updatedAt   | timestamp | Not Null, Auto-updated                |

Table No: 6  
Table Name: WorkspaceMember  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                             |
| ----------- | --------- | -------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid()  |
| workspaceId | varchar   | Foreign Key -> Workspace(id), Not Null |
| userId      | varchar   | Foreign Key -> User(id), Not Null      |
| permissions | varchar[] | Not Null                               |
| grantedById | varchar   | Nullable                               |
| grantRootId | varchar   | Nullable                               |
| grantDepth  | integer   | Not Null, Default 0                    |
| createdAt   | timestamp | Not Null, Default now()                |

Table No: 7  
Table Name: WorkspaceGitHubIntegration  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD            | DATATYPE  | CONSTRAINT                                     |
| ---------------- | --------- | ---------------------------------------------- |
| id               | varchar   | Primary Key, Not Null, Default cuid()          |
| workspaceId      | varchar   | Foreign Key -> Workspace(id), Unique, Not Null |
| repository       | varchar   | Not Null                                       |
| branch           | varchar   | Not Null, Default "main"                       |
| basePath         | varchar   | Not Null, Default "docs"                       |
| webhookSecret    | varchar   | Nullable                                       |
| webhookId        | varchar   | Nullable                                       |
| webhookUrl       | varchar   | Nullable                                       |
| webhookActive    | boolean   | Not Null, Default true                         |
| webhookCreatedAt | timestamp | Nullable                                       |
| webhookUpdatedAt | timestamp | Nullable                                       |
| connectedAt      | timestamp | Not Null, Default now()                        |
| updatedAt        | timestamp | Not Null, Auto-updated                         |

Table No: 8  
Table Name: Document  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD               | DATATYPE             | CONSTRAINT                             |
| ------------------- | -------------------- | -------------------------------------- |
| id                  | varchar              | Primary Key, Not Null, Default cuid()  |
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
| updatedAt           | timestamp            | Not Null, Auto-updated                 |
| lastViewedAt        | timestamp            | Nullable                               |

Table No: 9  
Table Name: Version  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid() |
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

Table No: 10  
Table Name: VersionTag  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                            |
| ----------- | --------- | ------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid() |
| versionId   | varchar   | Foreign Key -> Version(id), Not Null  |
| name        | varchar   | Not Null                              |
| color       | varchar   | Not Null, Default "#3B82F6"           |
| description | varchar   | Nullable                              |
| createdAt   | timestamp | Not Null, Default now()               |

Table No: 11  
Table Name: Comment  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid() |
| documentId | varchar   | Foreign Key -> Document(id), Not Null |
| authorId   | varchar   | Foreign Key -> User(id), Not Null     |
| content    | text      | Not Null                              |
| resolved   | boolean   | Not Null, Default false               |
| createdAt  | timestamp | Not Null, Default now()               |
| updatedAt  | timestamp | Not Null, Auto-updated                |

Table No: 12  
Table Name: GitHubRepo  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD                | DATATYPE  | CONSTRAINT                                     |
| -------------------- | --------- | ---------------------------------------------- |
| id                   | varchar   | Primary Key, Not Null, Default cuid()          |
| workspaceId          | varchar   | Foreign Key -> Workspace(id), Not Null         |
| repoOwner            | varchar   | Not Null                                       |
| repoName             | varchar   | Not Null                                       |
| installationId       | integer   | Nullable                                       |
| accessToken          | text      | Nullable                                       |
| lastSyncedAt         | timestamp | Nullable                                       |
| syncMode             | varchar   | Not Null, Default "direct"                     |
| autoSyncOnSave       | boolean   | Not Null, Default false                        |
| syncDebounceMs       | integer   | Not Null, Default 5000                         |
| defaultCommitMessage | varchar   | Not Null, Default "docs: update documentation" |
| autoCreatePR         | boolean   | Not Null, Default false                        |
| prTemplate           | text      | Nullable                                       |
| webhookId            | varchar   | Nullable                                       |
| webhookSecret        | varchar   | Nullable                                       |
| hasWriteAccess       | boolean   | Not Null, Default false                        |
| createdAt            | timestamp | Not Null, Default now()                        |
| updatedAt            | timestamp | Not Null, Auto-updated                         |

Table No: 13  
Table Name: GitHubPullRequest  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD             | DATATYPE  | CONSTRAINT                              |
| ----------------- | --------- | --------------------------------------- |
| id                | varchar   | Primary Key, Not Null, Default cuid()   |
| repoId            | varchar   | Foreign Key -> GitHubRepo(id), Not Null |
| number            | integer   | Not Null                                |
| title             | varchar   | Not Null                                |
| body              | text      | Nullable                                |
| state             | varchar   | Not Null                                |
| author            | varchar   | Not Null                                |
| authorAvatar      | varchar   | Nullable                                |
| htmlUrl           | varchar   | Not Null                                |
| linkedDocumentIds | varchar[] | Not Null                                |
| affectedFiles     | varchar[] | Not Null                                |
| autoCreated       | boolean   | Not Null, Default false                 |
| createdAt         | timestamp | Not Null                                |
| updatedAt         | timestamp | Not Null                                |
| closedAt          | timestamp | Nullable                                |
| mergedAt          | timestamp | Nullable                                |
| syncedAt          | timestamp | Not Null, Default now()                 |

Table No: 14  
Table Name: GitHubIssue  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD        | DATATYPE  | CONSTRAINT                              |
| ------------ | --------- | --------------------------------------- |
| id           | varchar   | Primary Key, Not Null, Default cuid()   |
| repoId       | varchar   | Foreign Key -> GitHubRepo(id), Not Null |
| number       | integer   | Not Null                                |
| title        | varchar   | Not Null                                |
| body         | text      | Nullable                                |
| state        | varchar   | Not Null                                |
| author       | varchar   | Not Null                                |
| authorAvatar | varchar   | Nullable                                |
| htmlUrl      | varchar   | Not Null                                |
| labels       | varchar[] | Not Null                                |
| createdAt    | timestamp | Not Null                                |
| updatedAt    | timestamp | Not Null                                |
| closedAt     | timestamp | Nullable                                |
| syncedAt     | timestamp | Not Null, Default now()                 |

Table No: 15  
Table Name: Activity  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD         | DATATYPE           | CONSTRAINT                             |
| ------------- | ------------------ | -------------------------------------- |
| id            | varchar            | Primary Key, Not Null, Default cuid()  |
| type          | enum(ActivityType) | Not Null                               |
| actorId       | varchar            | Foreign Key -> User(id), Nullable      |
| workspaceId   | varchar            | Foreign Key -> Workspace(id), Nullable |
| entityType    | varchar            | Not Null                               |
| entityId      | varchar            | Not Null                               |
| actorName     | varchar            | Nullable                               |
| actorEmail    | varchar            | Nullable                               |
| actorImage    | varchar            | Nullable                               |
| workspaceName | varchar            | Nullable                               |
| metadata      | json               | Nullable                               |
| createdAt     | timestamp          | Not Null, Default now()                |

Table No: 16  
Table Name: Notification  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD     | DATATYPE               | CONSTRAINT                            |
| --------- | ---------------------- | ------------------------------------- |
| id        | varchar                | Primary Key, Not Null, Default cuid() |
| userId    | varchar                | Foreign Key -> User(id), Not Null     |
| type      | enum(NotificationType) | Not Null                              |
| title     | varchar                | Not Null                              |
| message   | varchar                | Not Null                              |
| link      | varchar                | Nullable                              |
| read      | boolean                | Not Null, Default false               |
| createdAt | timestamp              | Not Null, Default now()               |

Table No: 17  
Table Name: GitHubAuth  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD          | DATATYPE  | CONSTRAINT                            |
| -------------- | --------- | ------------------------------------- |
| id             | varchar   | Primary Key, Not Null, Default cuid() |
| userId         | varchar   | Foreign Key -> User(id), Not Null     |
| workspaceId    | varchar   | Not Null                              |
| accessToken    | text      | Not Null                              |
| refreshToken   | text      | Nullable                              |
| scope          | varchar   | Nullable                              |
| tokenType      | varchar   | Not Null, Default "Bearer"            |
| expiresAt      | timestamp | Nullable                              |
| installationId | integer   | Nullable                              |
| createdAt      | timestamp | Not Null, Default now()               |
| updatedAt      | timestamp | Not Null, Auto-updated                |

Table No: 18  
Table Name: DocSyncInfo  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD              | DATATYPE               | CONSTRAINT                                    |
| ------------------ | ---------------------- | --------------------------------------------- |
| id                 | varchar                | Primary Key, Not Null, Default cuid()         |
| documentId         | varchar                | Foreign Key -> Document(id), Unique, Not Null |
| workspaceId        | varchar                | Not Null                                      |
| githubRepository   | varchar                | Not Null                                      |
| githubBranch       | varchar                | Not Null, Default "main"                      |
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
| updatedAt          | timestamp              | Not Null, Auto-updated                        |

Table No: 19  
Table Name: SyncEvent  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                                     |
| ---------- | --------- | ---------------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid()          |
| syncInfoId | varchar   | Foreign Key -> DocSyncInfo(id), Not Null       |
| eventType  | varchar   | Not Null                                       |
| direction  | varchar   | Not Null                                       |
| status     | varchar   | Not Null                                       |
| message    | text      | Nullable                                       |
| metadata   | json      | Nullable                                       |
| documentId | varchar   | Foreign Key -> Document(id), Nullable          |
| commitSha  | varchar   | Nullable                                       |
| prNumber   | integer   | Nullable                                       |
| prId       | varchar   | Foreign Key -> GitHubPullRequest(id), Nullable |
| createdAt  | timestamp | Not Null, Default now()                        |

Table No: 20  
Table Name: Tag  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                             |
| ----------- | --------- | -------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid()  |
| name        | varchar   | Not Null                               |
| color       | varchar   | Not Null, Default "#3B82F6"            |
| workspaceId | varchar   | Foreign Key -> Workspace(id), Not Null |
| createdAt   | timestamp | Not Null, Default now()                |

Table No: 21  
Table Name: DocumentTag  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid() |
| documentId | varchar   | Foreign Key -> Document(id), Not Null |
| tagId      | varchar   | Foreign Key -> Tag(id), Not Null      |
| createdAt  | timestamp | Not Null, Default now()               |

Table No: 22  
Table Name: DocumentTemplate  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                             |
| ----------- | --------- | -------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid()  |
| title       | varchar   | Not Null                               |
| description | varchar   | Nullable                               |
| content     | text      | Not Null                               |
| emoji       | varchar   | Nullable                               |
| coverImage  | varchar   | Nullable                               |
| category    | varchar   | Not Null, Default "General"            |
| isPublic    | boolean   | Not Null, Default false                |
| workspaceId | varchar   | Foreign Key -> Workspace(id), Nullable |
| authorId    | varchar   | Foreign Key -> User(id), Not Null      |
| usageCount  | integer   | Not Null, Default 0                    |
| createdAt   | timestamp | Not Null, Default now()                |
| updatedAt   | timestamp | Not Null, Auto-updated                 |

Table No: 23  
Table Name: DocumentLink  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD            | DATATYPE  | CONSTRAINT                            |
| ---------------- | --------- | ------------------------------------- |
| id               | varchar   | Primary Key, Not Null, Default cuid() |
| sourceDocumentId | varchar   | Foreign Key -> Document(id), Not Null |
| linkedDocumentId | varchar   | Foreign Key -> Document(id), Not Null |
| createdAt        | timestamp | Not Null, Default now()               |

Table No: 24  
Table Name: Mention  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid() |
| documentId | varchar   | Foreign Key -> Document(id), Not Null |
| userId     | varchar   | Foreign Key -> User(id), Not Null     |
| position   | integer   | Not Null                              |
| createdAt  | timestamp | Not Null, Default now()               |

Table No: 25  
Table Name: InlineComment  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD           | DATATYPE  | CONSTRAINT                            |
| --------------- | --------- | ------------------------------------- |
| id              | varchar   | Primary Key, Not Null, Default cuid() |
| documentId      | varchar   | Foreign Key -> Document(id), Not Null |
| authorId        | varchar   | Foreign Key -> User(id), Not Null     |
| content         | text      | Not Null                              |
| startOffset     | integer   | Not Null                              |
| endOffset       | integer   | Not Null                              |
| highlightedText | text      | Not Null                              |
| resolved        | boolean   | Not Null, Default false               |
| resolvedById    | varchar   | Foreign Key -> User(id), Nullable     |
| resolvedAt      | timestamp | Nullable                              |
| createdAt       | timestamp | Not Null, Default now()               |
| updatedAt       | timestamp | Not Null, Auto-updated                |

Table No: 26  
Table Name: InlineCommentReply  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD     | DATATYPE  | CONSTRAINT                                 |
| --------- | --------- | ------------------------------------------ |
| id        | varchar   | Primary Key, Not Null, Default cuid()      |
| commentId | varchar   | Foreign Key -> InlineComment(id), Not Null |
| authorId  | varchar   | Foreign Key -> User(id), Not Null          |
| content   | text      | Not Null                                   |
| createdAt | timestamp | Not Null, Default now()                    |
| updatedAt | timestamp | Not Null, Auto-updated                     |

Table No: 27  
Table Name: UserFavorite  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid() |
| userId     | varchar   | Foreign Key -> User(id), Not Null     |
| documentId | varchar   | Foreign Key -> Document(id), Not Null |
| createdAt  | timestamp | Not Null, Default now()               |

Table No: 28  
Table Name: RecentDocument  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                            |
| ---------- | --------- | ------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid() |
| userId     | varchar   | Foreign Key -> User(id), Not Null     |
| documentId | varchar   | Foreign Key -> Document(id), Not Null |
| accessedAt | timestamp | Not Null, Default now()               |

Table No: 29  
Table Name: Presence  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                            |
| ----------- | --------- | ------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid() |
| userId      | varchar   | Foreign Key -> User(id), Not Null     |
| documentId  | varchar   | Nullable                              |
| workspaceId | varchar   | Nullable                              |
| socketId    | varchar   | Not Null                              |
| cursor      | json      | Nullable                              |
| lastSeen    | timestamp | Not Null, Default now()               |
| createdAt   | timestamp | Not Null, Default now()               |
| updatedAt   | timestamp | Not Null, Auto-updated                |

Table No: 30  
Table Name: SyncSchedule  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD          | DATATYPE  | CONSTRAINT                            |
| -------------- | --------- | ------------------------------------- |
| id             | varchar   | Primary Key, Not Null, Default cuid() |
| workspaceId    | varchar   | Not Null                              |
| name           | varchar   | Not Null                              |
| schedule       | varchar   | Not Null                              |
| direction      | varchar   | Not Null                              |
| enabled        | boolean   | Not Null, Default true                |
| lastRunAt      | timestamp | Nullable                              |
| lastRunStatus  | varchar   | Nullable                              |
| lastRunSummary | json      | Nullable                              |
| createdBy      | varchar   | Not Null                              |
| createdAt      | timestamp | Not Null, Default now()               |
| updatedAt      | timestamp | Not Null, Auto-updated                |

Table No: 31  
Table Name: DocumentLock  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD      | DATATYPE  | CONSTRAINT                                    |
| ---------- | --------- | --------------------------------------------- |
| id         | varchar   | Primary Key, Not Null, Default cuid()         |
| documentId | varchar   | Foreign Key -> Document(id), Unique, Not Null |
| userId     | varchar   | Foreign Key -> User(id), Not Null             |
| acquiredAt | timestamp | Not Null, Default now()                       |
| expiresAt  | timestamp | Not Null                                      |
| lastPingAt | timestamp | Not Null, Default now()                       |

Table No: 32  
Table Name: NotificationPreferences  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD                    | DATATYPE  | CONSTRAINT                                |
| ------------------------ | --------- | ----------------------------------------- |
| id                       | varchar   | Primary Key, Not Null, Default cuid()     |
| userId                   | varchar   | Foreign Key -> User(id), Unique, Not Null |
| commentMention           | boolean   | Not Null, Default true                    |
| documentShared           | boolean   | Not Null, Default true                    |
| githubPrReview           | boolean   | Not Null, Default true                    |
| githubIssueAssigned      | boolean   | Not Null, Default true                    |
| versionConflict          | boolean   | Not Null, Default true                    |
| workspaceInvite          | boolean   | Not Null, Default true                    |
| emailCommentMention      | boolean   | Not Null, Default false                   |
| emailDocumentShared      | boolean   | Not Null, Default false                   |
| emailGithubPrReview      | boolean   | Not Null, Default false                   |
| emailGithubIssueAssigned | boolean   | Not Null, Default false                   |
| emailVersionConflict     | boolean   | Not Null, Default true                    |
| emailWorkspaceInvite     | boolean   | Not Null, Default true                    |
| createdAt                | timestamp | Not Null, Default now()                   |
| updatedAt                | timestamp | Not Null, Auto-updated                    |

Table No: 33  
Table Name: Feedback  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE               | CONSTRAINT                            |
| ----------- | ---------------------- | ------------------------------------- |
| id          | varchar                | Primary Key, Not Null, Default cuid() |
| userId      | varchar                | Foreign Key -> User(id), Nullable     |
| type        | enum(FeedbackType)     | Not Null, Default GENERAL             |
| category    | varchar                | Nullable                              |
| title       | varchar                | Not Null                              |
| description | text                   | Not Null                              |
| rating      | integer                | Nullable                              |
| status      | enum(FeedbackStatus)   | Not Null, Default NEW                 |
| priority    | enum(FeedbackPriority) | Not Null, Default MEDIUM              |
| url         | varchar                | Nullable                              |
| userAgent   | varchar                | Nullable                              |
| screenshot  | varchar                | Nullable                              |
| adminReply  | text                   | Nullable                              |
| repliedAt   | timestamp              | Nullable                              |
| assignedTo  | varchar                | Foreign Key -> User(id), Nullable     |
| createdAt   | timestamp              | Not Null, Default now()               |
| updatedAt   | timestamp              | Not Null, Auto-updated                |
| resolvedAt  | timestamp              | Nullable                              |

Table No: 34  
Table Name: SyncQueue  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD        | DATATYPE  | CONSTRAINT                              |
| ------------ | --------- | --------------------------------------- |
| id           | varchar   | Primary Key, Not Null, Default cuid()   |
| documentId   | varchar   | Foreign Key -> Document(id), Not Null   |
| workspaceId  | varchar   | Foreign Key -> Workspace(id), Not Null  |
| operation    | varchar   | Not Null                                |
| priority     | integer   | Not Null, Default 0                     |
| status       | varchar   | Not Null, Default "pending"             |
| attemptCount | integer   | Not Null, Default 0                     |
| maxAttempts  | integer   | Not Null, Default 3                     |
| error        | text      | Nullable                                |
| metadata     | json      | Nullable                                |
| scheduledAt  | timestamp | Not Null, Default now()                 |
| startedAt    | timestamp | Nullable                                |
| completedAt  | timestamp | Nullable                                |
| createdAt    | timestamp | Not Null, Default now()                 |
| updatedAt    | timestamp | Not Null, Auto-updated                  |
| repoId       | varchar   | Foreign Key -> GitHubRepo(id), Nullable |

Table No: 35  
Table Name: GitHubWebhook  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD           | DATATYPE  | CONSTRAINT                              |
| --------------- | --------- | --------------------------------------- |
| id              | varchar   | Primary Key, Not Null, Default cuid()   |
| workspaceId     | varchar   | Foreign Key -> Workspace(id), Not Null  |
| repoId          | varchar   | Foreign Key -> GitHubRepo(id), Not Null |
| githubWebhookId | varchar   | Unique, Not Null                        |
| secret          | varchar   | Not Null                                |
| events          | varchar[] | Not Null                                |
| active          | boolean   | Not Null, Default true                  |
| lastDeliveryAt  | timestamp | Nullable                                |
| lastStatus      | varchar   | Nullable                                |
| createdAt       | timestamp | Not Null, Default now()                 |
| updatedAt       | timestamp | Not Null, Auto-updated                  |

Table No: 36  
Table Name: ConflictResolution  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD         | DATATYPE  | CONSTRAINT                               |
| ------------- | --------- | ---------------------------------------- |
| id            | varchar   | Primary Key, Not Null, Default cuid()    |
| documentId    | varchar   | Foreign Key -> Document(id), Not Null    |
| syncInfoId    | varchar   | Foreign Key -> DocSyncInfo(id), Not Null |
| localContent  | text      | Not Null                                 |
| remoteContent | text      | Not Null                                 |
| localSha      | varchar   | Not Null                                 |
| remoteSha     | varchar   | Not Null                                 |
| status        | varchar   | Not Null, Default "pending"              |
| resolution    | text      | Nullable                                 |
| resolvedBy    | varchar   | Foreign Key -> User(id), Nullable        |
| resolvedAt    | timestamp | Nullable                                 |
| createdAt     | timestamp | Not Null, Default now()                  |
| updatedAt     | timestamp | Not Null, Auto-updated                   |

Table No: 37  
Table Name: UploadedImage  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                             |
| ----------- | --------- | -------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid()  |
| filename    | varchar   | Not Null                               |
| url         | varchar   | Not Null                               |
| size        | integer   | Not Null                               |
| contentType | varchar   | Not Null                               |
| hash        | varchar   | Not Null                               |
| uploadedBy  | varchar   | Foreign Key -> User(id), Not Null      |
| workspaceId | varchar   | Foreign Key -> Workspace(id), Not Null |
| createdAt   | timestamp | Not Null, Default now()                |

Table No: 38  
Table Name: WorkspaceInvite  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD         | DATATYPE                    | CONSTRAINT                             |
| ------------- | --------------------------- | -------------------------------------- |
| id            | varchar                     | Primary Key, Not Null, Default cuid()  |
| workspaceId   | varchar                     | Foreign Key -> Workspace(id), Not Null |
| invitedEmail  | varchar                     | Nullable                               |
| invitedUserId | varchar                     | Foreign Key -> User(id), Nullable      |
| invitedById   | varchar                     | Foreign Key -> User(id), Not Null      |
| grantRootId   | varchar                     | Nullable                               |
| status        | enum(WorkspaceInviteStatus) | Not Null, Default PENDING              |
| message       | varchar                     | Nullable                               |
| permissions   | varchar[]                   | Not Null                               |
| resendCount   | integer                     | Not Null, Default 0                    |
| lastResentAt  | timestamp                   | Nullable                               |
| cancelledAt   | timestamp                   | Nullable                               |
| createdAt     | timestamp                   | Not Null, Default now()                |
| updatedAt     | timestamp                   | Not Null, Auto-updated                 |
| expiresAt     | timestamp                   | Nullable                               |
| acceptedAt    | timestamp                   | Nullable                               |
| rejectedAt    | timestamp                   | Nullable                               |

Table No: 39  
Table Name: WorkspaceFavorite  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                             |
| ----------- | --------- | -------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid()  |
| userId      | varchar   | Foreign Key -> User(id), Not Null      |
| workspaceId | varchar   | Foreign Key -> Workspace(id), Not Null |
| createdAt   | timestamp | Not Null, Default now()                |

Table No: 40  
Table Name: GitHubDeleteTombstone  
Table Description: Generated from prisma/schema.prisma model definition.

| FIELD       | DATATYPE  | CONSTRAINT                             |
| ----------- | --------- | -------------------------------------- |
| id          | varchar   | Primary Key, Not Null, Default cuid()  |
| workspaceId | varchar   | Foreign Key -> Workspace(id), Not Null |
| githubPath  | varchar   | Not Null                               |
| deletedAt   | timestamp | Not Null, Default now()                |
| processedAt | timestamp | Nullable                               |
