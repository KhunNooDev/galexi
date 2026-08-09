export const wordKeys = {
  all: ['words'] as const,
  admin: () => [...wordKeys.all, 'admin'] as const,
};
