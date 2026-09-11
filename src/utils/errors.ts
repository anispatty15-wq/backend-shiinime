export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const providerError = (message: string, statusCode = 502) =>
  new AppError('PROVIDER_ERROR', message, statusCode);
