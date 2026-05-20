/**
 * Middleware: Verify church domain access
 * Ensures user only accesses their own church data
 * 
 * Usage: app.use('/api/churches/:churchId', validateChurchDomain);
 */
const validateChurchDomain = (req, res, next) => {
  try {
    // Get user and requested church from context
    const userChurchId = req.user?.churchId;
    const requestChurchId = parseInt(req.params.churchId, 10);

    // If user has no churchId, they're not in church domain
    if (!userChurchId) {
      return res.status(403).json({
        success: false,
        error: 'Domain mismatch: User not in church domain',
      });
    }

    // Verify user's churchId matches requested churchId
    if (userChurchId !== requestChurchId) {
      console.warn(
        `Security: User ${req.user.id} attempted to access church ${requestChurchId} but only has access to church ${userChurchId}`
      );
      return res.status(403).json({
        success: false,
        error: 'Domain mismatch: Cannot access this church',
      });
    }

    // Pass through - domains match
    next();
  } catch (error) {
    console.error('validateChurchDomain error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = validateChurchDomain;
