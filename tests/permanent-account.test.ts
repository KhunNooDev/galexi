import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

const selectResults: unknown[][] = [];

const databaseMocks = {
  insert: mock(),
  onConflictDoNothing: mock(async () => undefined),
  select: mock(),
  values: mock(),
};

databaseMocks.insert.mockImplementation(() => ({ values: databaseMocks.values }));
databaseMocks.values.mockImplementation(() => ({
  onConflictDoNothing: databaseMocks.onConflictDoNothing,
}));
databaseMocks.select.mockImplementation(() => ({
  from: () => ({
    where: () => ({
      limit: async () => selectResults.shift() ?? [],
    }),
  }),
}));

mock.module('server-only', () => ({}));
mock.module('@/db', () => ({ getDatabase: () => databaseMocks }));

const { IDENTITY_KIND } = await import('@/constants/identity');
const { USER_ROLE } = await import('@/constants/role');
const { profiles, userRoles } = await import('@/db/schema');
const { establishPermanentAccount } =
  await import('@/features/learning/account/server/account-membership.service');
const { resolveAppIdentity } = await import('@/lib/supabase/resolve-identity');
const { getProfile } = await import('@/server/profiles');
const { getUserRole } = await import('@/server/roles');

function permanentUser(overrides: Partial<User> = {}): User {
  return {
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-09-03T00:00:00.000Z',
    email: 'member@example.com',
    id: 'permanent-user-id',
    is_anonymous: false,
    user_metadata: {},
    ...overrides,
  } as User;
}

const memberIdentity = {
  email: 'member@example.com',
  kind: IDENTITY_KIND.MEMBER,
  userId: 'permanent-user-id',
} as const;

describe('permanent-account role and profile lifecycle', () => {
  beforeEach(() => {
    selectResults.length = 0;
    Object.values(databaseMocks).forEach((mockFunction) => mockFunction.mockClear());
  });

  it('resolves an existing member through a read-only role lookup', async () => {
    selectResults.push([{ role: USER_ROLE.MEMBER }]);

    await expect(resolveAppIdentity(permanentUser(), getUserRole)).resolves.toEqual(memberIdentity);
    expect(databaseMocks.select).toHaveBeenCalledTimes(1);
    expect(databaseMocks.insert).not.toHaveBeenCalled();
  });

  it('fails closed when a permanent user has no provisioned role', async () => {
    selectResults.push([]);

    await expect(getUserRole('permanent-user-id')).rejects.toThrow('Unable to load user role');
    expect(databaseMocks.insert).not.toHaveBeenCalled();
  });

  it('preserves an existing administrator role during identity resolution', async () => {
    const getRole = mock(async () => USER_ROLE.ADMIN);

    await expect(
      resolveAppIdentity(permanentUser({ email: 'admin@example.com' }), getRole),
    ).resolves.toEqual({
      email: 'admin@example.com',
      kind: IDENTITY_KIND.ADMIN,
      userId: 'permanent-user-id',
    });
    expect(getRole).toHaveBeenCalledWith('permanent-user-id');
  });

  it('does not query permanent-account tables for public or guest identities', async () => {
    const getRole = mock(async () => USER_ROLE.MEMBER);

    await expect(resolveAppIdentity(null, getRole)).resolves.toEqual({
      email: null,
      kind: IDENTITY_KIND.PUBLIC,
      userId: null,
    });

    await expect(
      resolveAppIdentity(
        permanentUser({ email: undefined, id: 'guest-id', is_anonymous: true }),
        getRole,
      ),
    ).resolves.toEqual({ email: null, kind: IDENTITY_KIND.GUEST, userId: 'guest-id' });
    expect(getRole).not.toHaveBeenCalled();
  });

  it('reads an existing profile without inserting', async () => {
    const profile = { avatarUrl: '', displayName: 'Ada', userId: 'permanent-user-id' };
    selectResults.push([profile]);

    await expect(getProfile(memberIdentity)).resolves.toEqual(profile);
    expect(databaseMocks.select).toHaveBeenCalledTimes(1);
    expect(databaseMocks.insert).not.toHaveBeenCalled();
  });

  it('provisions missing role and profile rows with conflict-safe inserts', async () => {
    selectResults.push(
      [{ role: USER_ROLE.MEMBER }],
      [{ avatarUrl: '', displayName: '', userId: 'permanent-user-id' }],
    );

    await expect(establishPermanentAccount(permanentUser())).resolves.toEqual(memberIdentity);
    expect(databaseMocks.insert).toHaveBeenNthCalledWith(1, userRoles);
    expect(databaseMocks.insert).toHaveBeenNthCalledWith(2, profiles);
    expect(databaseMocks.values).toHaveBeenNthCalledWith(1, {
      role: USER_ROLE.MEMBER,
      userId: 'permanent-user-id',
    });
    expect(databaseMocks.values).toHaveBeenNthCalledWith(2, { userId: 'permanent-user-id' });
    expect(databaseMocks.onConflictDoNothing).toHaveBeenCalledTimes(2);
  });

  it('keeps provisioning idempotent and preserves an administrator role', async () => {
    const profile = { avatarUrl: '', displayName: '', userId: 'permanent-user-id' };
    selectResults.push(
      [{ role: USER_ROLE.ADMIN }],
      [profile],
      [{ role: USER_ROLE.ADMIN }],
      [profile],
    );

    const user = permanentUser({ email: 'admin@example.com' });
    await expect(establishPermanentAccount(user)).resolves.toMatchObject({
      kind: IDENTITY_KIND.ADMIN,
    });
    await expect(establishPermanentAccount(user)).resolves.toMatchObject({
      kind: IDENTITY_KIND.ADMIN,
    });

    expect(databaseMocks.insert).toHaveBeenCalledTimes(4);
    expect(databaseMocks.onConflictDoNothing).toHaveBeenCalledTimes(4);
  });
});
