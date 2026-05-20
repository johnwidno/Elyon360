/**
 * Middleware: Verify network domain access
 * Ensures user only accesses their own network data
 * 
 * Usage: app.use('/api/networks/:networkId', validateNetworkDomain);
 */
const validateNetworkDomain = (req, res, next) => {
  try {
    // Get user and requested network from context
    const userNetworkId = req.user?.networkId;
    const requestNetworkId = parseInt(req.params.networkId, 10);

    // If user has no networkId, they're not in network domain
    if (!userNetworkId) {
      return res.status(403).json({
        success: false,
        error: 'Domain mismatch: User not in network domain',
      });
    }

    // Verify user's networkId matches requested networkId
    if (userNetworkId !== requestNetworkId) {
      console.warn(
        `Security: User ${req.user.id} attempted to access network ${requestNetworkId} but only has access to network ${userNetworkId}`
      );
      return res.status(403).json({
        success: false,
        error: 'Domain mismatch: Cannot access this network',
      });
    }

    // Pass through - domains match
    next();
  } catch (error) {
    console.error('validateNetworkDomain error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = validateNetworkDomain;
