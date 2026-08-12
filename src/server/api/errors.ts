import 'server-only';

export function isUniqueConstraintViolation(error: unknown, constraint: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint_name' in error &&
    error.constraint_name === constraint
  );
}
