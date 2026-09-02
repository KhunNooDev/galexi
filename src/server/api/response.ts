import 'server-only';

import { status } from 'elysia';

import type { ApiErrorCode } from '@/server/api/error-codes';

export function ok<T>(data: T) {
  return { data };
}

export function created<T>(data: T) {
  return status(201, { data });
}

function errorBody(code: ApiErrorCode, message: string) {
  return { error: { code, message } };
}

export function badRequest(code: ApiErrorCode, message: string) {
  return status(400, errorBody(code, message));
}

export function unauthorized(code: ApiErrorCode, message: string) {
  return status(401, errorBody(code, message));
}

export function forbidden(code: ApiErrorCode, message: string) {
  return status(403, errorBody(code, message));
}

export function notFound(code: ApiErrorCode, message: string) {
  return status(404, errorBody(code, message));
}

export function conflict(code: ApiErrorCode, message: string) {
  return status(409, errorBody(code, message));
}

export function internalServerError(code: ApiErrorCode, message: string) {
  return status(500, errorBody(code, message));
}
