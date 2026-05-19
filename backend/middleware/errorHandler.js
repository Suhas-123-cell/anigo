// ============================================================
// Global Error Handler Middleware
// ============================================================

/**
 * Async error wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
    console.error('[Error Handler]', {
        message: err.message,
        code: err.code,
        status: err.status,
        stack: err.stack,
    });

    // Ensure response headers haven't been sent
    if (res.headersSent) {
        return next(err);
    }

    // Set JSON content type to prevent HTML fallback
    res.setHeader('Content-Type', 'application/json');

    // Supabase/Database errors
    if (err.code === 'PGRST116' || err.code === '42P01') {
        return res.status(400).json({
            success: false,
            error: 'Invalid request or table not found',
            details: err.message,
        });
    }

    // Supabase duplicate entry
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            error: 'Resource already exists',
        });
    }

    // Database connection errors
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connection')) {
        return res.status(503).json({
            success: false,
            error: 'Database connection failed',
        });
    }

    // JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON in request body',
            details: err.message,
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
};

/**
 * JSON parsing error handler
 */
const jsonErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('[JSON Parse Error]', {
            message: err.message,
            body: req.body,
        });
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON in request body',
            details: err.message,
        });
    }
    next(err);
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
    });
};

module.exports = { errorHandler, notFoundHandler, jsonErrorHandler, asyncHandler };
