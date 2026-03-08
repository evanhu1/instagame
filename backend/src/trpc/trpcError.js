import { TRPCError } from '@trpc/server';
import { HttpError } from '../utils/httpError.js';

const statusCodeToTrpcCode = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_CONTENT',
  429: 'TOO_MANY_REQUESTS',
};

export const asTrpcError = (error) => {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof HttpError) {
    return new TRPCError({
      code: statusCodeToTrpcCode[error.statusCode] || 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    });
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error?.message || 'Internal server error',
    cause: error,
  });
};
