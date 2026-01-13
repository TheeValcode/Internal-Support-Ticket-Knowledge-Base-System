import crypto from 'crypto';

export const generateTicketNumber = (): string => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${year}-${randomNum}`;
};

export const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalFilename.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

export const formatResponse = (success: boolean, data?: any, message?: string, error?: any) => {
  return {
    success,
    data: data || null,
    message: message || (success ? 'Operation completed successfully' : 'Operation failed'),
    error: error || null,
    timestamp: new Date().toISOString()
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeUser = (user: any) => {
  const { password_hash, ...sanitizedUser } = user;
  return sanitizedUser;
};