import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// EARLIEST REQUEST LOGGER - Before ANY middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║  [EARLIEST] ${req.method} ${req.path}`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`[EARLIEST] Content-Type: ${req.get('content-type')}`);
    console.log(`[EARLIEST] Method: ${req.method}`);
    console.log(`[EARLIEST] Path: ${req.path}`);
    console.log(`[EARLIEST] URL: ${req.url}`);
  }
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// JSON parser with error handling
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

// URL-encoded parser
app.use(express.urlencoded({ extended: false }));

// Catch JSON parsing errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║            GLOBAL ERROR HANDLER TRIGGERED                  ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('[Global Error Handler] Error caught:', err);
    console.error('[Global Error Handler] Error name:', err.name);
    console.error('[Global Error Handler] Error message:', err.message);
    console.error('[Global Error Handler] Request path:', req.path);
    console.error('[Global Error Handler] Request method:', req.method);
    console.error('[Global Error Handler] Request headers:', req.headers);
    console.error('[Global Error Handler] Error stack:', err.stack);
    console.error('╚════════════════════════════════════════════════════════════╝');
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ 
      error: message,
      message: message 
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
