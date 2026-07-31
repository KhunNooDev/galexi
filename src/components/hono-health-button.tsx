'use client';

import { useState } from 'react';
import { hc } from 'hono/client';

import type { ApiType } from '@/server/api';

const client = hc<ApiType>('/');

type RequestState = 'idle' | 'loading' | 'success' | 'error';

type HonoHealthButtonProps = {
  labels: Record<RequestState, string>;
};

export function HonoHealthButton({ labels }: HonoHealthButtonProps) {
  const [state, setState] = useState<RequestState>('idle');

  async function checkHealth() {
    setState('loading');

    try {
      const response = await client.api.health.$get();

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      const data = await response.json();
      setState(data.status === 'ok' ? 'success' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <button
      type='button'
      className='flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-border px-5 transition-colors hover:bg-secondary-hover disabled:cursor-wait disabled:opacity-60 md:w-39.5'
      disabled={state === 'loading'}
      onClick={checkHealth}
    >
      <span aria-live='polite'>{labels[state]}</span>
    </button>
  );
}
