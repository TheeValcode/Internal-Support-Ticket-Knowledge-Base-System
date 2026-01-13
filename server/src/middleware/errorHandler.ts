import { Request, Response, NextFunction } from 'express';
import { formatResponse } from '../utils/helpers';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (error.message.includes('required') || error.message.includes('Invalid')) {
    statusCode = 400;
    message = error.message;
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    message = error.message;
  } else if (error.message.includes('already exists')) {
    statusCode = 409;
    message = error.message;
  }

  res.status(statusCode).json(formatResponse(false, null, message, {
    code: statusCode,
    message: message
  }));
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json(formatResponse(false, null, `Route ${req.originalUrl} not found`));
};