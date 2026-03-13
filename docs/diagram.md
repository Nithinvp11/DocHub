erDiagram

    USER {
        varchar user_id PK
        varchar username "Unique, Nullable"
        varchar name "Nullable"
        varchar email "Unique, Not Null"
        timestamp emailVerified
        varchar password
        boolean githubLinked
        integer githubUserId
        varchar githubUsername
        varchar githubProfileUrl
        varchar githubEmail
        enum role
        timestamp createdAt
        timestamp updatedAt
    }

    WORKSPACE {
        varchar workspace_id PK
        varchar name
        varchar description
        varchar ownerId FK
        datetime createdAt
        datetime updatedAt
    }

    WORKSPACEMEMBER {
        varchar id PK
        varchar workspaceId FK
        varchar userId FK
        varchar[] permissions
        varchar grantedById
        datetime createdAt
    }

    DOCUMENT {
        varchar id PK
        varchar title
        text content
        varchar path
        enum phase
        enum type
        varchar workspaceId FK
        varchar authorId FK
        varchar githubPath
        datetime createdAt
    }

    VERSION {
        varchar id PK
        varchar documentId FK
        text content
        varchar message
        varchar label
        varchar authorId FK
        integer version
        datetime createdAt
    }

    COMMENT {
        varchar id PK
        varchar documentId FK
        varchar authorId FK
        text content
        boolean resolved
        datetime createdAt
        datetime updatedAt
    }

    GITHUBREPO {
        varchar id PK
        varchar workspaceId FK
        varchar repoOwner
        varchar repoName
        text accessToken
        datetime lastSyncedAt
        varchar defaultCommitMessage
        varchar webhookId
        varchar webhookSecret
        datetime createdAt
        datetime updatedAt
    }

    FEEDBACK {
        varchar id PK
        varchar userId FK
        enum type
        varchar category
        varchar title
        text description
        integer rating
        enum priority
        datetime createdAt
        datetime resolvedAt
    }

    %% ================= RELATIONSHIPS =================

    USER ||--o{ WORKSPACE : owns
    USER ||--o{ WORKSPACEMEMBER : joins
    WORKSPACE ||--o{ WORKSPACEMEMBER : has

    WORKSPACE ||--o{ DOCUMENT : contains
    USER ||--o{ DOCUMENT : authors

    DOCUMENT ||--o{ VERSION : has
    USER ||--o{ VERSION : creates

    DOCUMENT ||--o{ COMMENT : has
    USER ||--o{ COMMENT : writes

    WORKSPACE ||--|| GITHUBREPO : integrates

    USER ||--o{ FEEDBACK : submits
