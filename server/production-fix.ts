/**
 * Production API Routing Fix
 * 
 * This module contains middleware to ensure API routes work correctly in production
 * by preventing static file serving from intercepting API requests.
 */

import type { Express, Request, Response, NextFunction } from "express";

export function applyProductionAPIFix(app: Express) {
  // Add middleware to handle unmatched API routes ONLY
  // This runs after all API routes have been registered
  app.use('/api/*', (req: Request, res: Response) => {
    console.log(`[PRODUCTION] Unmatched API route: ${req.method} ${req.originalUrl}`);
    
    // Provide helpful error messages for common issues
    if (req.path === '/api/auth/signin' && req.method === 'GET') {
      return res.status(405).json({ 
        error: 'Method not allowed', 
        message: 'This endpoint only accepts POST requests',
        path: req.path,
        method: req.method 
      });
    }
    
    return res.status(404).json({ 
      error: 'API endpoint not found', 
      path: req.path,
      method: req.method 
    });
  });
}