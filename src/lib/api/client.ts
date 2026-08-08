import 'client-only';

import { hc } from 'hono/client';

import type { ApiType } from '@/server/api';

export const apiClient = hc<ApiType>('/');
