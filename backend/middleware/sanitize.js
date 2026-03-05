/**
 * Middleware to sanitize incoming request bodies.
 * Specifically converts empty strings ("") to null to prevent database errors 
 * when inserting into numeric or date columns that accept null but not empty strings.
 */
module.exports = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitize = (obj) => {
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'string' && obj[key].trim() === '') {
                    obj[key] = null;
                } else if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    sanitize(obj[key]);
                }
            });
        };
        sanitize(req.body);
    }
    next();
};
