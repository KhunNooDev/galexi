import { z } from 'zod';

export const postgresConnectionStringSchema = z.url({
  protocol: /^postgres(?:ql)?$/,
  error: 'must be a valid PostgreSQL connection string',
});

export function formatEnvironmentIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const variable = issue.path.join('.') || 'environment';
      return `${variable} ${issue.message}`;
    })
    .join('; ');
}
