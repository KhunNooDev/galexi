import 'client-only';

import { treaty } from '@elysiajs/eden';

import type { Api } from '@/server/api';

export const apiClient = treaty<Api>('', { keepDomain: true });
