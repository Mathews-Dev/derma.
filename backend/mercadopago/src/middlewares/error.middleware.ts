import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[Error global]', err.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
}
