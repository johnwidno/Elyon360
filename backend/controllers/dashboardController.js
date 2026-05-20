/**
 * Dashboard Controller
 * Handles organization admin dashboards with consent-aware data aggregation
 *
 * Endpoints:
 * - GET /api/networks/:networkId/dashboard - Get network dashboard (aggregated data)
 * - GET /api/networks/:networkId/dashboard/member-metrics - Member metrics
 * - GET /api/networks/:networkId/dashboard/financial-metrics - Financial metrics
 * - GET /api/networks/:networkId/dashboard/content-adoption - Content adoption stats
 */

const { Church, ChurchDataConsent, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * getNetworkDashboard(req, res)
 * GET /api/networks/:networkId/dashboard
 *
 * Returns aggregated dashboard data for network
 * Respects data consent flags from all affiliated churches
 *
 * Response:
 * {
 *   networkId: 2,
 *   totalAffiliatedChurches: 8,
 *   churchesWithConsentedData: 6,
 *   metrics: {
 *     memberMetrics: { ... },
 *     financialMetrics: { ... },
 *     activityMetrics: { ... }
 *   }
 * }
 */
async function getNetworkDashboard(req, res) {
  try {
    const networkId = req.params.networkId;

    console.log(`[getNetworkDashboard] Generating dashboard for network ${networkId}`);

    // Get all churches affiliated with network
    const affiliatedChurches = await Church.findAll({
      where: { networkId },
      attributes: ['id', 'name', 'slug'],
      raw: true,
    });

    if (affiliatedChurches.length === 0) {
      console.log(`[getNetworkDashboard] No affiliated churches for network ${networkId}`);
      return res.status(200).json({
        networkId,
        totalAffiliatedChurches: 0,
        churchesWithConsentedData: 0,
        metrics: {
          memberMetrics: null,
          financialMetrics: null,
          activityMetrics: null,
        },
      });
    }

    console.log(
      `[getNetworkDashboard] Found ${affiliatedChurches.length} affiliated churches`,
    );

    // Get consent records for all churches
    const consents = await ChurchDataConsent.findAll({
      where: { networkId, churchId: { [Op.in]: affiliatedChurches.map((c) => c.id) } },
      raw: true,
    });

    // Create consent map
    const consentMap = {};
    consents.forEach((c) => {
      consentMap[c.churchId] = c;
    });

    // Separate churches with and without consented data
    const churchesWithConsent = affiliatedChurches.filter((c) => consentMap[c.id]);

    console.log(
      `[getNetworkDashboard] ${churchesWithConsent.length} churches have consent records`,
    );

    // Aggregate metrics based on consent
    const memberMetrics = aggregateMemberMetrics(churchesWithConsent, consentMap);
    const financialMetrics = aggregateFinancialMetrics(churchesWithConsent, consentMap);
    const activityMetrics = aggregateActivityMetrics(churchesWithConsent, consentMap);

    console.log(`[getNetworkDashboard] ✅ Dashboard generated for network ${networkId}`);

    return res.status(200).json({
      networkId,
      totalAffiliatedChurches: affiliatedChurches.length,
      churchesWithConsentedData: churchesWithConsent.length,
      metrics: {
        memberMetrics,
        financialMetrics,
        activityMetrics,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('[getNetworkDashboard] Error:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'DASHBOARD_ERROR',
    });
  }
}

/**
 * Helper: Aggregate member metrics respecting consent flags
 */
function aggregateMemberMetrics(churches, consentMap) {
  let totalMembers = 0;
  let totalActiveMembers = 0;
  let churchesContributing = 0;

  churches.forEach((church) => {
    const consent = consentMap[church.id];

    // Only include if church consented to share membership data
    if (consent && consent.shareMembershipData) {
      // In real implementation, would query database for actual member counts
      // For now, return placeholder structure
      churchesContributing++;
    }
  });

  return {
    totalMembers: null, // Placeholder - would query actual data if consented
    totalActiveMembers: null,
    churchesContributing,
    churchesTotal: churches.length,
    averageMembersPerChurch: null,
  };
}

/**
 * Helper: Aggregate financial metrics respecting consent flags
 */
function aggregateFinancialMetrics(churches, consentMap) {
  let totalDonations = 0;
  let totalExpenses = 0;
  let churchesContributing = 0;

  churches.forEach((church) => {
    const consent = consentMap[church.id];

    // Only include if church consented to share financial data
    if (consent && consent.shareFinancialData) {
      // In real implementation, would query database for actual financials
      // For now, return placeholder structure
      churchesContributing++;
    }
  });

  return {
    totalDonations: null, // Placeholder - would query actual data if consented
    totalExpenses: null,
    netRevenue: null,
    churchesContributing,
    churchesTotal: churches.length,
    averageDonationsPerChurch: null,
    shareDetailedBreakdown: false, // Most churches don't share detailed breakdown
  };
}

/**
 * Helper: Aggregate activity metrics respecting consent flags
 */
function aggregateActivityMetrics(churches, consentMap) {
  let totalEvents = 0;
  let totalAttendance = 0;
  let churchesContributing = 0;

  churches.forEach((church) => {
    const consent = consentMap[church.id];

    // Check both event and activity consent flags
    const shareActivity =
      (consent && consent.shareEventData) || (consent && consent.shareActivityData);

    if (shareActivity) {
      // In real implementation, would query database for actual activity data
      // For now, return placeholder structure
      churchesContributing++;
    }
  });

  return {
    totalEvents: null, // Placeholder
    totalAttendance: null,
    churchesWithEvents: churchesContributing,
    churchesTotal: churches.length,
    averageEventsPerChurch: null,
  };
}

/**
 * getMemberMetrics(req, res)
 * GET /api/networks/:networkId/dashboard/member-metrics
 *
 * Returns detailed member metrics (consent-filtered)
 */
async function getMemberMetrics(req, res) {
  try {
    const networkId = req.params.networkId;

    console.log(`[getMemberMetrics] Fetching member metrics for network ${networkId}`);

    // Placeholder implementation
    return res.status(200).json({
      networkId,
      metrics: {
        totalMembers: null,
        activeMembers: null,
        churchesWithConsentedData: null,
      },
    });
  } catch (error) {
    console.error('[getMemberMetrics] Error:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'METRICS_ERROR',
    });
  }
}

/**
 * getFinancialMetrics(req, res)
 * GET /api/networks/:networkId/dashboard/financial-metrics
 *
 * Returns detailed financial metrics (consent-filtered)
 */
async function getFinancialMetrics(req, res) {
  try {
    const networkId = req.params.networkId;

    console.log(`[getFinancialMetrics] Fetching financial metrics for network ${networkId}`);

    // Placeholder implementation
    return res.status(200).json({
      networkId,
      metrics: {
        totalDonations: null,
        totalExpenses: null,
        churchesWithConsentedData: null,
      },
    });
  } catch (error) {
    console.error('[getFinancialMetrics] Error:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'METRICS_ERROR',
    });
  }
}

/**
 * getContentAdoption(req, res)
 * GET /api/networks/:networkId/dashboard/content-adoption
 *
 * Returns content adoption statistics
 */
async function getContentAdoption(req, res) {
  try {
    const networkId = req.params.networkId;

    console.log(
      `[getContentAdoption] Fetching content adoption for network ${networkId}`,
    );

    // Placeholder implementation
    return res.status(200).json({
      networkId,
      totalContentPublished: null,
      adoptionStats: [],
    });
  } catch (error) {
    console.error('[getContentAdoption] Error:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'ADOPTION_ERROR',
    });
  }
}

module.exports = {
  getNetworkDashboard,
  getMemberMetrics,
  getFinancialMetrics,
  getContentAdoption,
};
