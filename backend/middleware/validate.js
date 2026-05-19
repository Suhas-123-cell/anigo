// ============================================================
// Request Validation Middleware
// ============================================================

/**
 * Validate required fields in request body
 */
const validateBody = (requiredFields) => {
    return (req, res, next) => {
        const missing = requiredFields.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missing.join(', ')}`,
            });
        }
        next();
    };
};

/**
 * Validate required params
 */
const validateParams = (requiredParams) => {
    return (req, res, next) => {
        const missing = requiredParams.filter(param => !req.params[param]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required params: ${missing.join(', ')}`,
            });
        }
        next();
    };
};

module.exports = { validateBody, validateParams };
