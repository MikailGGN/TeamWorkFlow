/**
 * Custom static file serving that doesn't interfere with API routes
 */

import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

export function serveStaticWithAPIProtection(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files normally
  app.use(express.static(distPath));

  // Custom fallback that excludes API routes
  app.use((req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        error: 'API endpoint not found', 
        path: req.path,
        method: req.method 
      });
    }
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}