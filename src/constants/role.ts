export const USER_ROLE = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
