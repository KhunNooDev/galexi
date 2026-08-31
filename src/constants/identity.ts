export const IDENTITY_KIND = {
  ADMIN: 'admin',
  GUEST: 'guest',
  MEMBER: 'member',
  PUBLIC: 'public',
} as const;

export type IdentityKind = (typeof IDENTITY_KIND)[keyof typeof IDENTITY_KIND];

type PublicIdentity = {
  email: null;
  kind: typeof IDENTITY_KIND.PUBLIC;
  userId: null;
};

type AuthenticatedIdentity = {
  email: string | null;
  userId: string;
};

export type GuestIdentity = AuthenticatedIdentity & {
  kind: typeof IDENTITY_KIND.GUEST;
};

type MemberIdentity = AuthenticatedIdentity & {
  kind: typeof IDENTITY_KIND.MEMBER;
};

type AdminIdentity = AuthenticatedIdentity & {
  kind: typeof IDENTITY_KIND.ADMIN;
};

export type PermanentIdentity = MemberIdentity | AdminIdentity;
export type AuthenticatedAppIdentity = GuestIdentity | PermanentIdentity;
export type AppIdentity = PublicIdentity | GuestIdentity | PermanentIdentity;
