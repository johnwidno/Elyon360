/**
 * Consent Controller
 * Handles data consent API endpoints for church admins
 *
 * Endpoints:
 * - GET /api/churches/:churchId/data-consent - Get consent settings
 * - GET /api/churches/:churchId/data-consent/:networkId - Get specific network consent
 * - PATCH /api/churches/:churchId/data-consent/:networkId - Update consent for network
 * - GET /api/churches/:churchId/data-consent/networks/list - List all affiliated networks with consent
 */

const { Church, ChurchNetwork, ChurchDataConsent, AuditLog } = require('../models');

/**
 * getChurchConsent(req, res)
 * GET /api/churches/:churchId/data-consent
 *
 * Returns all data consent settings for a church (for all affiliated networks)
 *
 * Response:
 * {
 *   churchId: 1,
 *   affiliations: [
 *     {
 *       networkId: 2,
 *       networkName: "Diocese of Port-au-Prince",
 *       shareFinancialData: true,
 *       shareMembershipData: true,
 *       shareEventData: true,
 *       shareActivityData: true,
 *       shareAttendanceData: false,
 *       shareDetailedFinances: false,
 *       shareMemberNames: false,
 *       lastModifiedAt: "2024-05-20T10:30:00Z",
 *       lastModifiedBy: 42
 *     },
 *     ...
 *   ]
 * }
 */
async function getChurchConsent(req, res) {
  try {
    const churchId = req.params.churchId;

    console.log(
      `[getChurchConsent] Fetching consent settings for church ${churchId}`,
    );

    // Verify church exists
    const church = await Church.findByPk(churchId);
    if (!church) {
      console.warn(
        `[getChurchConsent] Church ${churchId} not found`,
      );
      return res.status(404).json({
        error: 'Church not found',
        code: 'CHURCH_NOT_FOUND',
      });
    }

    // Fetch all consent records for this church
    const consents = await ChurchDataConsent.findAll({
      where: { churchId },
      include: [
        {
          model: ChurchNetwork,
          attributes: ['id', 'name', 'slug'],
          required: true,
        },
      ],
      attributes: [
        'id',
        'networkId',
        'shareFinancialData',
        'shareMembershipData',
        'shareEventData',
        'shareActivityData',
        'shareAttendanceData',
        'shareDetailedFinances',
        'shareMemberNames',
        'lastModifiedAt',
        'lastModifiedBy',
      ],
      order: [['lastModifiedAt', 'DESC']],
    });

    // Format response
    const affiliations = consents.map((c) => ({
      networkId: c.networkId,
      networkName: c.ChurchNetwork.name,
      networkSlug: c.ChurchNetwork.slug,
      shareFinancialData: c.shareFinancialData,
      shareMembershipData: c.shareMembershipData,
      shareEventData: c.shareEventData,
      shareActivityData: c.shareActivityData,
      shareAttendanceData: c.shareAttendanceData,
      shareDetailedFinances: c.shareDetailedFinances,
      shareMemberNames: c.shareMemberNames,
      lastModifiedAt: c.lastModifiedAt,
      lastModifiedBy: c.lastModifiedBy,
    }));

    console.log(
      `[getChurchConsent] ✅ Retrieved ${affiliations.length} consent records for church ${churchId}`,
    );

    return res.status(200).json({
      churchId,
      churchName: church.name,
      affiliations,
    });
  } catch (error) {
    console.error('[getChurchConsent] Error:', error);

    // Log error
    AuditLog.logEvent({
      eventType: 'api_error',
      severity: 'error',
      status: 'failure',
      userId: req.user.userId,
      churchId: req.params.churchId,
      networkId: null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl,
      errorMessage: error.message,
      errorCode: 'CONSENT_FETCH_ERROR',
      description: 'Error fetching consent settings',
      request: req,
    }).catch((err) => {
      console.error('[getChurchConsent] Audit log failed:', err.message);
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'CONSENT_FETCH_ERROR',
    });
  }
}

/**
 * getNetworkConsent(req, res)
 * GET /api/churches/:churchId/data-consent/:networkId
 *
 * Returns consent settings for specific network
 *
 * Response:
 * {
 *   churchId: 1,
 *   networkId: 2,
 *   networkName: "Diocese of Port-au-Prince",
 *   shareFinancialData: true,
 *   shareMembershipData: true,
 *   shareEventData: true,
 *   shareActivityData: true,
 *   shareAttendanceData: false,
 *   shareDetailedFinances: false,
 *   shareMemberNames: false,
 *   lastModifiedAt: "2024-05-20T10:30:00Z",
 *   lastModifiedBy: 42
 * }
 */
async function getNetworkConsent(req, res) {
  try {
    const { churchId, networkId } = req.params;

    console.log(
      `[getNetworkConsent] Fetching consent for church ${churchId}, network ${networkId}`,
    );

    // Verify church exists
    const church = await Church.findByPk(churchId);
    if (!church) {
      console.warn(`[getNetworkConsent] Church ${churchId} not found`);
      return res.status(404).json({
        error: 'Church not found',
        code: 'CHURCH_NOT_FOUND',
      });
    }

    // Verify network exists
    const network = await ChurchNetwork.findByPk(networkId);
    if (!network) {
      console.warn(`[getNetworkConsent] Network ${networkId} not found`);
      return res.status(404).json({
        error: 'Network not found',
        code: 'NETWORK_NOT_FOUND',
      });
    }

    // Fetch consent record
    const consent = await ChurchDataConsent.findOne({
      where: { churchId, networkId },
    });

    if (!consent) {
      console.warn(
        `[getNetworkConsent] No consent record for church ${churchId}, network ${networkId}`,
      );
      return res.status(404).json({
        error: 'No consent settings found for this network',
        code: 'CONSENT_NOT_FOUND',
      });
    }

    console.log(
      `[getNetworkConsent] ✅ Retrieved consent for church ${churchId}, network ${networkId}`,
    );

    return res.status(200).json({
      churchId,
      networkId,
      networkName: network.name,
      shareFinancialData: consent.shareFinancialData,
      shareMembershipData: consent.shareMembershipData,
      shareEventData: consent.shareEventData,
      shareActivityData: consent.shareActivityData,
      shareAttendanceData: consent.shareAttendanceData,
      shareDetailedFinances: consent.shareDetailedFinances,
      shareMemberNames: consent.shareMemberNames,
      lastModifiedAt: consent.lastModifiedAt,
      lastModifiedBy: consent.lastModifiedBy,
    });
  } catch (error) {
    console.error('[getNetworkConsent] Error:', error);

    // Log error
    AuditLog.logEvent({
      eventType: 'api_error',
      severity: 'error',
      status: 'failure',
      userId: req.user.userId,
      churchId: req.params.churchId,
      networkId: req.params.networkId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl,
      errorMessage: error.message,
      errorCode: 'CONSENT_FETCH_ERROR',
      description: 'Error fetching specific network consent',
      request: req,
    }).catch((err) => {
      console.error('[getNetworkConsent] Audit log failed:', err.message);
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'CONSENT_FETCH_ERROR',
    });
  }
}

/**
 * updateNetworkConsent(req, res)
 * PATCH /api/churches/:churchId/data-consent/:networkId
 *
 * Updates consent settings for network
 *
 * Body:
 * {
 *   shareFinancialData: true/false,
 *   shareMembershipData: true/false,
 *   shareEventData: true/false,
 *   shareActivityData: true/false,
 *   shareAttendanceData: true/false,
 *   shareDetailedFinances: true/false,
 *   shareMemberNames: true/false
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Consent settings updated successfully",
 *   consent: { ...updated fields... }
 * }
 */
async function updateNetworkConsent(req, res) {
  try {
    const { churchId, networkId } = req.params;
    const updatedBy = req.user.userId;

    console.log(
      `[updateNetworkConsent] User ${updatedBy} updating consent for church ${churchId}, network ${networkId}`,
    );

    // Verify church exists
    const church = await Church.findByPk(churchId);
    if (!church) {
      console.warn(`[updateNetworkConsent] Church ${churchId} not found`);
      return res.status(404).json({
        error: 'Church not found',
        code: 'CHURCH_NOT_FOUND',
      });
    }

    // Verify network exists
    const network = await ChurchNetwork.findByPk(networkId);
    if (!network) {
      console.warn(`[updateNetworkConsent] Network ${networkId} not found`);
      return res.status(404).json({
        error: 'Network not found',
        code: 'NETWORK_NOT_FOUND',
      });
    }

    // Find or create consent record
    let consent = await ChurchDataConsent.findOne({
      where: { churchId, networkId },
    });

    // Extract updated values from request
    const updateData = {};
    const validFields = [
      'shareFinancialData',
      'shareMembershipData',
      'shareEventData',
      'shareActivityData',
      'shareAttendanceData',
      'shareDetailedFinances',
      'shareMemberNames',
    ];

    validFields.forEach((field) => {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
      }
    });

    // Store old values for audit
    const oldValues = consent
      ? {
          shareFinancialData: consent.shareFinancialData,
          shareMembershipData: consent.shareMembershipData,
          shareEventData: consent.shareEventData,
          shareActivityData: consent.shareActivityData,
          shareAttendanceData: consent.shareAttendanceData,
          shareDetailedFinances: consent.shareDetailedFinances,
          shareMemberNames: consent.shareMemberNames,
        }
      : null;

    if (consent) {
      // Update existing
      await consent.update({
        ...updateData,
        lastModifiedBy: updatedBy,
        lastModifiedAt: new Date(),
      });
    } else {
      // Create new with defaults
      consent = await ChurchDataConsent.create({
        churchId,
        networkId,
        ...updateData,
        lastModifiedBy: updatedBy,
        lastModifiedAt: new Date(),
      });
    }

    console.log(
      `[updateNetworkConsent] ✅ Updated consent for church ${churchId}, network ${networkId}`,
    );

    // Log consent update event
    AuditLog.logEvent({
      eventType: 'data_consent_updated',
      severity: 'info',
      status: 'success',
      userId: updatedBy,
      churchId,
      networkId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl,
      resourceType: 'DataConsent',
      resourceId: consent.id,
      action: 'update',
      description: `Church admin ${updatedBy} updated data consent settings with network ${networkId}`,
      metadata: {
        oldValues,
        newValues: updateData,
        fieldsChanged: Object.keys(updateData),
      },
      request: req,
    }).catch((err) => {
      console.error('[updateNetworkConsent] Audit log failed:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Consent settings updated successfully',
      consent: {
        churchId: consent.churchId,
        networkId: consent.networkId,
        networkName: network.name,
        shareFinancialData: consent.shareFinancialData,
        shareMembershipData: consent.shareMembershipData,
        shareEventData: consent.shareEventData,
        shareActivityData: consent.shareActivityData,
        shareAttendanceData: consent.shareAttendanceData,
        shareDetailedFinances: consent.shareDetailedFinances,
        shareMemberNames: consent.shareMemberNames,
        lastModifiedAt: consent.lastModifiedAt,
        lastModifiedBy: consent.lastModifiedBy,
      },
    });
  } catch (error) {
    console.error('[updateNetworkConsent] Error:', error);

    // Log error
    AuditLog.logEvent({
      eventType: 'api_error',
      severity: 'error',
      status: 'failure',
      userId: req.user.userId,
      churchId: req.params.churchId,
      networkId: req.params.networkId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl,
      errorMessage: error.message,
      errorCode: 'CONSENT_UPDATE_ERROR',
      description: 'Error updating consent settings',
      request: req,
    }).catch((err) => {
      console.error('[updateNetworkConsent] Audit log failed:', err.message);
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'CONSENT_UPDATE_ERROR',
    });
  }
}

module.exports = {
  getChurchConsent,
  getNetworkConsent,
  updateNetworkConsent,
};
