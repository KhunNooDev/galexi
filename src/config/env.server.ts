import 'server-only';

import { z } from 'zod';

import { formatEnvironmentIssues, postgresConnectionStringSchema } from '@/config/env.validation';

const serverEnvironmentSchema = z.object({
  DATABASE_URL: postgresConnectionStringSchema,
});

const result = serverEnvironmentSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
});

if (!result.success) {
  throw new Error(
    `Invalid server environment configuration: ${formatEnvironmentIssues(result.error)}`,
  );
}

export const serverEnv = {
  databaseUrl: result.data.DATABASE_URL,
} as const;
