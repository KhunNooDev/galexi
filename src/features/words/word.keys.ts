export const wordKeys = {
  all: ['words'] as const,
  admin: () => [...wordKeys.all, 'admin'] as const,
  detail: (id: number) => [...wordKeys.all, 'detail', id] as const,
};
