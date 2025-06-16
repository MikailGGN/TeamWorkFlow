/**
 * Production API Routing Fix
 * 
 * This module contains middleware to ensure API routes work correctly in production
 * by preventing static file serving from intercepting API requests.
 */

import type { Express, Request, Response, NextFunction } from "express";

export function applyProductionAPIFix(app: Express) {
  // Add middleware to log API requests in production
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    console.log(`[PRODUCTION] API Request: ${req.method} ${req.originalUrl}`);
    next();
  });

  // Ensure API routes take precedence over static files
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      // This middleware only runs if no API route matched
      console.log(`[PRODUCTION] Unmatched API route: ${req.method} ${req.path}`);
      return res.status(404).json({ 
        error: 'API endpoint not found', 
        path: req.path,
        method: req.method 
      });
    }
    next();
  });
}