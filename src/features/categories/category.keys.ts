export const categoryKeys = {
  all: ['categories'] as const,
  admin: () => [...categoryKeys.all, 'admin'] as const,
};
