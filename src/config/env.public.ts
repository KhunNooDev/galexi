import { z } from 'zod';

import { formatEnvironmentIssues } from '@/config/env.validation';

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    protocol: /^https?$/,
    error: 'must be a valid HTTP or HTTPS URL',
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: 'is required' })
    .trim()
    .min(1, 'is required'),
});

const result = publicEnvironmentSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

if (!result.success) {
  throw new Error(
    `Invalid public environment configuration: ${formatEnvironmentIssues(result.error)}`,
  );
}

export const publicEnv = {
  supabaseUrl: result.data.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} as const;
