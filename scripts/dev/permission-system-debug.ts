import { prisma } from '@/lib/prisma';
import {
  WORKSPACE_PERMISSION,
  normalizePermissions,
  PERMISSION_PACK,
  expandPermissionPacks,
  getSelectedPacks,
} from '@/lib/workspace-permission-definitions';
import {
  assertDelegatablePermissions,
  canManageDelegatedTarget,
  getWorkspaceAccess,
  resolveGrantRootForDelegation,
  WorkspacePermissionError,
} from '@/lib/workspace-permissions';

const run = async () => {
  const stamp = Date.now();
  const ownerEmail = `perm-owner-${stamp}@example.com`;
  const userAEmail = `perm-user-a-${stamp}@example.com`;
  const userBEmail = `perm-user-b-${stamp}@example.com`;

  console.log('🧪 Testing Permission Pack System...\n');

  // Test 1: Pack expansion
  console.log('✅ Test 1: Permission pack expansion');
  const viewPackExpanded = expandPermissionPacks([PERMISSION_PACK.VIEW]);
  console.log(`   View Pack → ${viewPackExpanded.length} permissions`);
  if (viewPackExpanded.length !== 6) {
    throw new Error('View pack should expand to 6 permissions');
  }

  // Test 2: Pack detection
  console.log('✅ Test 2: Pack detection from permissions');
  const detectedPacks = getSelectedPacks(viewPackExpanded);
  console.log(`   Detected packs: ${detectedPacks.join(', ')}`);
  if (!detectedPacks.includes(PERMISSION_PACK.VIEW)) {
    throw new Error('View pack should be detected');
  }

  // Test 3: Normalization with packs
  console.log('✅ Test 3: Normalization with pack input');
  const normalizedFromPack = normalizePermissions([PERMISSION_PACK.EDITOR]);
  console.log(`   Normalized to ${normalizedFromPack.length} permissions`);
  if (!normalizedFromPack.includes(WORKSPACE_PERMISSION.WORKSPACE_VIEW)) {
    throw new Error('Normalization should include workspace:view dependency');
  }
  if (!normalizedFromPack.includes(WORKSPACE_PERMISSION.ACTIVITY_VIEW)) {
    throw new Error(
      'Selecting non-view pack should auto-add full View Pack (missing activity:view)'
    );
  }

  console.log('\n🧪 Testing Permission Delegation with Packs...\n');

  const owner = await prisma.user.create({
    data: {
      email: ownerEmail,
      name: 'Permission Owner',
      password: 'debug-password',
    },
  });

  const userA = await prisma.user.create({
    data: {
      email: userAEmail,
      name: 'Permission User A',
      password: 'debug-password',
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: userBEmail,
      name: 'Permission User B',
      password: 'debug-password',
    },
  });

  const userCEmail = `perm-user-c-${stamp}@example.com`;
  const userC = await prisma.user.create({
    data: {
      email: userCEmail,
      name: 'Permission User C',
      password: 'debug-password',
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: `Permission Audit Workspace ${stamp}`,
      description: 'Temporary debug workspace for permission audit',
      ownerId: owner.id,
    },
  });

  // Give User A only View Pack for testing
  const userAPermissions = normalizePermissions([
    PERMISSION_PACK.VIEW,
    WORKSPACE_PERMISSION.MEMBERS_INVITE,
  ]);

  console.log(`✅ Test 4: User A with View Pack + invite capability`);
  console.log(`   Permissions: ${userAPermissions.length} total`);

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userA.id,
      permissions: userAPermissions,
    },
  });

  const userAAccess = await getWorkspaceAccess(userA.id, workspace.id);

  console.log(`✅ Test 5: Delegation limit enforcement`);
  let higherPermissionRejected = false;
  try {
    assertDelegatablePermissions(userAAccess, [WORKSPACE_PERMISSION.DOCUMENTS_DELETE]);
  } catch (error) {
    if (error instanceof WorkspacePermissionError && error.status === 403) {
      higherPermissionRejected = true;
      console.log(`   ✓ Correctly rejected documents:delete (not in User A permissions)`);
    } else {
      throw error;
    }
  }

  if (!higherPermissionRejected) {
    throw new Error('Expected higher permission delegation to fail with 403');
  }

  console.log(`✅ Test 6: Allowed delegation within User A's permissions`);
  const allowedDelegation = assertDelegatablePermissions(userAAccess, [
    WORKSPACE_PERMISSION.DOCUMENTS_VIEW,
  ]);
  console.log(`   ✓ Allowed delegation: ${allowedDelegation.length} permissions`);

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId: workspace.id,
      invitedById: userA.id,
      invitedUserId: userB.id,
      invitedEmail: userB.email,
      permissions: allowedDelegation,
      status: 'PENDING',
    },
  });

  if (invite.status !== 'PENDING') {
    throw new Error('Invite should be created as PENDING');
  }

  console.log(`✅ Test 7: Invite acceptance simulation`);

  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      invitedUserId: userB.id,
    },
  });

  const memberB = await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userB.id,
      permissions: normalizePermissions(invite.permissions),
    },
  });

  const memberBRecord = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: userB.id,
      },
    },
  });

  if (!memberBRecord) {
    throw new Error('User B was not created as a member after invite acceptance simulation');
  }

  const expectedPermissions = normalizePermissions([WORKSPACE_PERMISSION.DOCUMENTS_VIEW]);
  const actualPermissions = normalizePermissions(memberBRecord.permissions);
  const mismatch =
    expectedPermissions.length !== actualPermissions.length ||
    expectedPermissions.some((permission) => !actualPermissions.includes(permission));

  if (mismatch) {
    throw new Error('User B permissions do not match expected normalized permissions');
  }

  console.log(`   ✓ User B member created with correct permissions\n`);

  console.log(`✅ Test 8: Delegation tree manage checks (A → B → C)`);

  const grantRootId = resolveGrantRootForDelegation(userAAccess, userA.id);

  await prisma.workspaceMember.update({
    where: { id: memberB.id },
    data: {
      grantedById: userA.id,
      grantRootId,
      grantDepth: 1,
    },
  });

  const memberC = await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userC.id,
      permissions: normalizePermissions([WORKSPACE_PERMISSION.DOCUMENTS_VIEW]),
      grantedById: userB.id,
      grantRootId,
      grantDepth: 2,
    },
  });

  const userBAccess = await getWorkspaceAccess(userB.id, workspace.id);
  const userCAccess = await getWorkspaceAccess(userC.id, workspace.id);

  const userAManagesC = canManageDelegatedTarget(userA.id, userAAccess, {
    userId: userC.id,
    grantedById: userB.id,
    grantRootId,
  });

  const userBManagesC = canManageDelegatedTarget(userB.id, userBAccess, {
    userId: userC.id,
    grantedById: userB.id,
    grantRootId,
  });

  const userCManagesB = canManageDelegatedTarget(userC.id, userCAccess, {
    userId: userB.id,
    grantedById: userA.id,
    grantRootId,
  });

  if (!userAManagesC) {
    throw new Error(
      'Delegation root manager should be able to manage subtree member (A should manage C)'
    );
  }

  if (!userBManagesC) {
    throw new Error(
      'Direct delegator should be able to manage delegated member (B should manage C)'
    );
  }

  if (userCManagesB) {
    throw new Error('Delegated member should not manage ancestor delegator (C must not manage B)');
  }

  console.log('   ✓ A can manage C via root delegation');
  console.log('   ✓ B can manage C via direct delegation');
  console.log('   ✓ C cannot manage B (ancestor protection)\n');

  console.log('🎉 All permission pack tests passed!\n');
  console.log(`Workspace: ${workspace.id}`);
  console.log(`Owner: ${owner.email}`);
  console.log(`User A (limited): ${userA.email}`);
  console.log(`User B (invited): ${userB.email}`);
  console.log(`User C (delegated): ${userC.email}`);
  console.log(`Member created: ${memberB.id}\n`);
  console.log(`Delegated member created: ${memberC.id}\n`);

  const shouldCleanup = process.env.PERMISSION_DEBUG_CLEANUP !== 'false';
  if (shouldCleanup) {
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [owner.id, userA.id, userB.id, userC.id] } },
    });
    console.log('Cleanup completed');
  } else {
    console.log('Cleanup skipped (PERMISSION_DEBUG_CLEANUP=false)');
  }
};

run()
  .catch(async (error) => {
    console.error('Permission debug simulation failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
