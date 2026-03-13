# GitHub Integration Security & Auditing Improvements

## Overview

This document describes the security enhancements and auditing features implemented for GitHub integration in DocHub.

## 🔒 Security Improvements

### 1. AES-256 Token Encryption

**Implementation**: `src/lib/encryption.ts`

All GitHub access tokens are now encrypted before storage using AES-256-CBC encryption with the following features:

- **Algorithm**: AES-256-CBC (Advanced Encryption Standard, 256-bit key)
- **Key Management**: Secure key stored in environment variable `ENCRYPTION_KEY`
- **Initialization Vector**: Random 16-byte IV generated per encryption
- **Format**: Encrypted tokens stored as `iv:encryptedData` (both hex-encoded)

#### Functions

```typescript
// Encrypt plain text token
encrypt(text: string): string

// Decrypt encrypted token
decrypt(encrypted: string): string

// Check if a string is encrypted
isEncrypted(value: string): boolean

// Safe encrypt (checks if already encrypted)
encryptToken(token: string): string

// Safe decrypt (handles plain text gracefully)
decryptToken(token: string): string
```

#### Usage Example

```typescript
import { encryptToken, decryptToken } from '@/lib/encryption';

// When storing
const encryptedToken = encryptToken(accessToken);
await prisma.gitHubAuth.create({
  data: {
    accessToken: encryptedToken,
    // ...other fields
  },
});

// When using
const githubAuth = await prisma.gitHubAuth.findUnique({...});
const plainToken = decryptToken(githubAuth.accessToken);
const syncService = new GitHubSyncService(plainToken);
```

### 2. Environment Configuration

**File Updated**: `.env.example`

New environment variable:

```env
# Encryption Key for sensitive data (GitHub tokens, etc.)
# CRITICAL: Generate a secure 32-byte (64 hex characters) key for production
# Generate with: openssl rand -hex 32
# Or: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="your-64-character-hex-string-here-32-bytes"
```

#### Key Generation

**Production Setup**:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using PowerShell
[System.Convert]::ToHex((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**⚠️ Security Warning**:

- Never commit encryption keys to version control
- Use different keys for development and production
- Rotate keys periodically
- Store production keys in secure secret management (e.g., AWS Secrets Manager, Azure Key Vault)

### 3. Updated API Routes

All GitHub API routes now use encrypted tokens:

#### Files Modified

1. **OAuth Callback** - `src/app/api/github/callback/route.ts`
   - Encrypts tokens immediately upon receipt from GitHub
   - Stores encrypted tokens in database

2. **Profile API** - `src/app/api/github/profile/route.ts`
   - Decrypts token before fetching GitHub user info

3. **Document Sync** - `src/app/api/github/sync-document/route.ts`
   - Decrypts token before syncing to GitHub

4. **Workspace Sync** - `src/app/api/github/sync-workspace/route.ts`
   - Decrypts token before bulk workspace sync

5. **Webhook Handler** - `src/app/api/github/webhook/route.ts`
   - Decrypts token before processing push events

6. **Setup Wizard** - `src/app/api/github/setup/route.ts`
   - Decrypts token before testing repository access

7. **Sync Actions** - `src/app/api/github/sync/action/route.ts`
   - Decrypts token before manual sync operations

8. **Background Worker** - `src/lib/github-sync-worker.ts`
   - Decrypts token before background sync jobs

## 📊 Auditing Improvements

### 1. New Activity Types

**File Updated**: `prisma/schema.prisma`

Added four new `ActivityType` enum values for comprehensive sync auditing:

```prisma
enum ActivityType {
  // ... existing types
  GITHUB_SYNC_STARTED       // Logged when sync job begins
  GITHUB_SYNC_SUCCESS       // Logged when sync succeeds
  GITHUB_SYNC_FAILED        // Logged when sync fails
  GITHUB_CONFLICT_DETECTED  // Logged when conflict detected
  // ... existing types
}
```

### 2. Commit Metadata Storage

**File Updated**: `prisma/schema.prisma`

Added fields to `DocSyncInfo` model for commit tracking:

```prisma
model DocSyncInfo {
  // ... existing fields
  lastCommitSha       String?  // GitHub commit SHA from last sync
  lastCommitUrl       String?  // GitHub commit URL from last sync
  // ... existing fields
}
```

### 3. Worker Audit Logging

**File Updated**: `src/lib/github-sync-worker.ts`

Background worker now logs all sync activities:

#### Logged Events

**1. GITHUB_SYNC_STARTED**

Logged when job processing begins:

```typescript
await prisma.activity.create({
  data: {
    type: 'GITHUB_SYNC_STARTED',
    actorId: userId,
    workspaceId: workspaceId,
    entityType: 'Document',
    entityId: documentId,
    metadata: {
      operation, // 'sync' or 'pull'
      jobId: job.id,
    },
  },
});
```

**2. GITHUB_SYNC_SUCCESS**

Logged when sync completes successfully:

```typescript
await prisma.activity.create({
  data: {
    type: 'GITHUB_SYNC_SUCCESS',
    actorId: userId,
    workspaceId: workspaceId,
    entityType: 'Document',
    entityId: documentId,
    metadata: {
      operation,
      jobId: job.id,
      commitSha: result.sha,
      commitUrl: `https://github.com/${repository}/commit/${result.sha}`,
    },
  },
});
```

**3. GITHUB_SYNC_FAILED**

Logged when sync fails (includes retry attempt number):

```typescript
await prisma.activity.create({
  data: {
    type: 'GITHUB_SYNC_FAILED',
    actorId: userId,
    workspaceId: workspaceId,
    entityType: 'Document',
    entityId: documentId,
    metadata: {
      operation,
      jobId: job.id,
      error: error.message,
      attempt: job.attemptsMade,
    },
  },
});
```

**4. GITHUB_CONFLICT_DETECTED**

Logged when merge conflict detected:

```typescript
await prisma.activity.create({
  data: {
    type: 'GITHUB_CONFLICT_DETECTED',
    actorId: userId,
    workspaceId: workspaceId,
    entityType: 'Document',
    entityId: documentId,
    metadata: {
      operation,
      jobId: job.id,
      message: result.message,
      conflictDetails: result.conflictDetails,
    },
  },
});
```

### 4. Enhanced DocSyncInfo Updates

Worker now stores commit metadata after successful sync:

```typescript
await prisma.docSyncInfo.update({
  where: { id: syncInfo.id },
  data: {
    syncStatus: 'SYNCED',
    lastSyncedAt: new Date(),
    lastCommitSha: result.sha,
    lastCommitUrl: `https://github.com/${repository}/commit/${result.sha}`,
    lastError: null,
    errorCount: 0,
  },
});
```

## 📈 Audit Query Examples

### Get All Sync Activities for a Document

```typescript
const syncActivities = await prisma.activity.findMany({
  where: {
    entityType: 'Document',
    entityId: documentId,
    type: {
      in: [
        'GITHUB_SYNC_STARTED',
        'GITHUB_SYNC_SUCCESS',
        'GITHUB_SYNC_FAILED',
        'GITHUB_CONFLICT_DETECTED',
      ],
    },
  },
  orderBy: { createdAt: 'desc' },
  include: {
    actor: {
      select: { name: true, email: true },
    },
  },
});
```

### Get Failed Syncs in Last 24 Hours

```typescript
const failedSyncs = await prisma.activity.findMany({
  where: {
    type: 'GITHUB_SYNC_FAILED',
    workspaceId: workspaceId,
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

### Get Sync Success Rate

```typescript
const stats = await prisma.activity.groupBy({
  by: ['type'],
  where: {
    workspaceId: workspaceId,
    type: {
      in: ['GITHUB_SYNC_SUCCESS', 'GITHUB_SYNC_FAILED'],
    },
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    },
  },
  _count: { type: true },
});

const success = stats.find((s) => s.type === 'GITHUB_SYNC_SUCCESS')?._count.type || 0;
const failed = stats.find((s) => s.type === 'GITHUB_SYNC_FAILED')?._count.type || 0;
const total = success + failed;
const successRate = total > 0 ? (success / total) * 100 : 0;

console.log(`Success rate: ${successRate.toFixed(2)}%`);
```

### Get Documents with Most Conflicts

```typescript
const conflictStats = await prisma.activity.groupBy({
  by: ['entityId'],
  where: {
    type: 'GITHUB_CONFLICT_DETECTED',
    workspaceId: workspaceId,
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    },
  },
  _count: { entityId: true },
  orderBy: { _count: { entityId: 'desc' } },
  take: 10,
});
```

### Get Commit History for Document

```typescript
const document = await prisma.document.findUnique({
  where: { id: documentId },
  include: {
    syncInfo: true,
  },
});

const commitUrl = document.syncInfo?.lastCommitUrl;
const commitSha = document.syncInfo?.lastCommitSha;
const lastSynced = document.syncInfo?.lastSyncedAt;
```

## 🔍 Monitoring & Alerting

### Recommended Alerts

1. **High Failure Rate**
   - Alert when failure rate exceeds 10% in 1 hour
   - Query: Count GITHUB_SYNC_FAILED vs GITHUB_SYNC_SUCCESS

2. **Repeated Conflicts**
   - Alert when same document has 3+ conflicts in 24 hours
   - Query: Count GITHUB_CONFLICT_DETECTED per document

3. **Stale Syncs**
   - Alert when lastSyncedAt > 7 days for autoSync enabled docs
   - Query: DocSyncInfo where autoSync=true and lastSyncedAt is old

4. **Token Decryption Failures**
   - Monitor logs for decryption errors
   - Alert on any decryption failures

### Monitoring Queries

**Daily Sync Summary**:

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const summary = await prisma.activity.groupBy({
  by: ['type'],
  where: {
    workspaceId: workspaceId,
    type: {
      in: [
        'GITHUB_SYNC_STARTED',
        'GITHUB_SYNC_SUCCESS',
        'GITHUB_SYNC_FAILED',
        'GITHUB_CONFLICT_DETECTED',
      ],
    },
    createdAt: { gte: today },
  },
  _count: { type: true },
});
```

## 🛡️ Security Best Practices

### Token Management

1. **Key Rotation**
   - Rotate encryption keys quarterly
   - Use script to re-encrypt all tokens with new key
   - Keep old key temporarily for transition

2. **Access Control**
   - Limit who can access ENCRYPTION_KEY
   - Use IAM roles in production
   - Never log encryption keys

3. **Audit Encryption**
   - Monitor encryption/decryption operations
   - Alert on failed decryptions
   - Track token access patterns

### Database Security

1. **Column Encryption**
   - Tokens encrypted at application layer
   - Consider database-level encryption for defense in depth
   - Enable PostgreSQL SSL connections

2. **Access Restrictions**
   - Limit database user permissions
   - Use separate credentials for read-only operations
   - Implement connection pooling with authentication

3. **Backup Security**
   - Encrypt database backups
   - Secure backup storage
   - Test restoration procedures

### Compliance

1. **Data Retention**
   - Activity logs retained per policy
   - Automatic cleanup of old logs
   - Export capabilities for compliance

2. **Audit Trail**
   - Immutable activity records
   - Timestamp verification
   - User attribution

## 📋 Migration Checklist

### For Existing Deployments

- [ ] Generate secure encryption key
- [ ] Add ENCRYPTION_KEY to environment
- [ ] Run database migration: `npx prisma db push`
- [ ] Restart application services
- [ ] **Re-link GitHub accounts** (old tokens won't decrypt)
- [ ] Verify sync operations work
- [ ] Test audit log queries
- [ ] Monitor for errors

### For New Deployments

- [ ] Generate encryption key during setup
- [ ] Add to environment configuration
- [ ] Run initial migration
- [ ] Configure monitoring alerts
- [ ] Test full sync workflow

## 🔧 Troubleshooting

### Decryption Errors

**Symptoms**: Errors like "Decryption failed" or "Invalid encrypted format"

**Causes**:

- ENCRYPTION_KEY changed or missing
- Token was stored before encryption implemented
- Token manually modified in database

**Solutions**:

1. Check ENCRYPTION_KEY is set correctly
2. Re-link GitHub account for user
3. Verify token format matches `iv:data`

### Missing Audit Logs

**Symptoms**: No activity records for sync operations

**Causes**:

- Database connection issues
- Activity creation wrapped in try-catch
- Worker not running

**Solutions**:

1. Check database connectivity
2. Review worker logs for warnings
3. Verify worker is processing jobs

### Performance Impact

**Symptoms**: Slow sync operations

**Causes**:

- Encryption/decryption overhead (minimal)
- Additional database writes for auditing

**Solutions**:

- Encryption is fast (~1ms per operation)
- Audit logging is async and won't slow syncs
- Monitor database query performance

## 📚 Related Documentation

- [Background Sync Documentation](./BACKGROUND_SYNC.md)
- [GitHub Integration Guide](./GITHUB_WEBHOOKS.md)
- [Database Schema](../prisma/schema.prisma)

## 🔄 Future Enhancements

1. **Key Rotation Tool**
   - Automated re-encryption script
   - Zero-downtime rotation
   - Key versioning

2. **Audit Dashboard**
   - Visual sync analytics
   - Real-time monitoring
   - Alerting UI

3. **Enhanced Compliance**
   - GDPR data export
   - SOC 2 audit reports
   - Activity log exports

4. **Token Expiration**
   - Track token expiry
   - Automatic refresh
   - Proactive re-authentication

---

**Last Updated**: February 13, 2026  
**Version**: 1.0.0
