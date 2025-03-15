import { Request, Response, NextFunction } from 'express';

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    code: error.code
  });

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  });
}
