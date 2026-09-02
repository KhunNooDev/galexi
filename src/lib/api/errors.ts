const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  500: 'Internal server error',
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getErrorDetails(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {};
  }

  if (!('error' in value) || !value.error || typeof value.error !== 'object') {
    return {};
  }

  const code =
    'code' in value.error && typeof value.error.code === 'string' ? value.error.code : undefined;
  const message =
    'message' in value.error && typeof value.error.message === 'string'
      ? value.error.message
      : undefined;

  return { code, message };
}

export function throwApiError(error: { status: unknown; value: unknown }): never {
  const status = typeof error.status === 'number' ? error.status : 500;
  const details = getErrorDetails(error.value);
  const message = details.message ?? STATUS_MESSAGES[status] ?? 'Request failed';

  throw new ApiError(message, status, details.code);
}
