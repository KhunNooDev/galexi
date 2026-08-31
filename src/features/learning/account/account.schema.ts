import { z } from 'zod';

import { AUTH_PASSWORD_MIN_LENGTH } from '@/constants/auth';

export function createAccountEmailSchema(message: string) {
  return z.object({ email: z.string().trim().pipe(z.email(message)) });
}

export function createAccountPasswordSchema(messages: {
  confirmPassword: string;
  passwordsMismatch: string;
  passwordTooShort: string;
}) {
  return z
    .object({
      confirmPassword: z.string().min(1, messages.confirmPassword),
      password: z.string().min(AUTH_PASSWORD_MIN_LENGTH, messages.passwordTooShort),
    })
    .refine(({ confirmPassword, password }) => confirmPassword === password, {
      message: messages.passwordsMismatch,
      path: ['confirmPassword'],
    });
}
