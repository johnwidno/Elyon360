/**
 * Consent-Aware Query Utilities
 * Helper functions for building queries that respect data consent flags
 *
 * Purpose: Encapsulate the logic of filtering aggregated data by consent settings
 * so that organization dashboards never accidentally expose data churches didn't share
 */

const { ChurchDataConsent, Church } = require('../models');
const { Op } = require('sequelize');

/**
 * getChurchesWithConsent(networkId, consentCategories)
 *
 * Returns list of churches in network that have consented to share specific data categories
 *
 * Example:
 * const churchesWithFinancial = await getChurchesWithConsent(
 *   networkId = 2,
 *   consentCategories = ['shareFinancialData', 'shareDetailedFinances']
 * );
 *
 * @param {number} networkId - Network ID
 * @param {array} consentCategories - Array of consent flag names to check
 * @returns {array} Churches with consent for those categories
 */
async function getChurchesWithConsent(networkId, consentCategories) {
  if (!Array.isArray(consentCategories) || consentCategories.length === 0) {
    console.warn('[getChurchesWithConsent] No consent categories specified');
    return [];
  }

  console.log(
    `[getChurchesWithConsent] Fetching churches in network ${networkId} with consent for: ${consentCategories.join(', ')}`,
  );

  try {
    // Build WHERE clause: ANY of the consent flags must be true
    const whereClause = {};
    consentCategories.forEach((category) => {
      whereClause[category] = true;
    });

    const consents = await ChurchDataConsent.findAll({
      where: {
        networkId,
        [Op.or]: whereClause, // Church must have at least ONE of the consent flags true
      },
      attributes: ['churchId'],
      raw: true,
    });

    const churchIds = consents.map((c) => c.churchId);
    console.log(
      `[getChurchesWithConsent] Found ${churchIds.length} churches with consent`,
    );

    return churchIds;
  } catch (error) {
    console.error('[getChurchesWithConsent] Error:', error);
    throw error;
  }
}

/**
 * checkChurchConsent(churchId, networkId, consentCategory)
 *
 * Check if specific church has consented to share specific data category
 *
 * Example:
 * const hasConsent = await checkChurchConsent(
 *   churchId = 1,
 *   networkId = 2,
 *   consentCategory = 'shareFinancialData'
 * );
 *
 * @param {number} churchId - Church ID
 * @param {number} networkId - Network ID
 * @param {string} consentCategory - Consent flag name (e.g., 'shareFinancialData')
 * @returns {boolean} Whether church consented
 */
async function checkChurchConsent(churchId, networkId, consentCategory) {
  try {
    const consent = await ChurchDataConsent.findOne({
      where: { churchId, networkId },
      attributes: [consentCategory],
      raw: true,
    });

    if (!consent) {
      console.warn(
        `[checkChurchConsent] No consent record for church ${churchId}, network ${networkId}`,
      );
      return false;
    }

    const hasConsent = consent[consentCategory] === true;
    console.log(
      `[checkChurchConsent] Church ${churchId} consent for ${consentCategory}: ${hasConsent}`,
    );

    return hasConsent;
  } catch (error) {
    console.error('[checkChurchConsent] Error:', error);
    throw error;
  }
}

/**
 * filterDataByConsent(churchDataArray, churchConsents)
 *
 * Filter array of church data to only include churches that consented
 *
 * Example:
 * const financialData = [
 *   { churchId: 1, totalDonations: 5000 },
 *   { churchId: 2, totalDonations: 3000 },
 *   { churchId: 3, totalDonations: 7000 }
 * ];
 *
 * const consentedChurches = [1, 3]; // Only churches 1 and 3 consented
 *
 * const filtered = filterDataByConsent(financialData, consentedChurches);
 * // Returns: [{churchId: 1, ...}, {churchId: 3, ...}]
 *
 * @param {array} churchDataArray - Array of data objects with churchId property
 * @param {array} consentedChurches - Array of churchIds that consented
 * @returns {array} Filtered data array
 */
function filterDataByConsent(churchDataArray, consentedChurches) {
  if (!Array.isArray(churchDataArray) || !Array.isArray(consentedChurches)) {
    console.warn('[filterDataByConsent] Invalid input arrays');
    return [];
  }

  const filtered = churchDataArray.filter((item) =>
    consentedChurches.includes(item.churchId),
  );

  console.log(
    `[filterDataByConsent] Filtered from ${churchDataArray.length} to ${filtered.length} items`,
  );

  return filtered;
}

/**
 * aggregateConsentedData(churchDataArray, consentedChurches, aggregationFn)
 *
 * Aggregate data from churches that consented
 *
 * Example:
 * const churchData = [
 *   { churchId: 1, totalDonations: 5000 },
 *   { churchId: 2, totalDonations: 3000 },
 *   { churchId: 3, totalDonations: 7000 }
 * ];
 *
 * const sum = aggregateConsentedData(
 *   churchData,
 *   [1, 3],
 *   (values) => values.reduce((a, b) => a + b, 0)
 * );
 * // Returns: 12000 (5000 + 7000, excluding church 2 that didn't consent)
 *
 * @param {array} churchDataArray - Array of data objects
 * @param {array} consentedChurches - Array of churchIds that consented
 * @param {function} aggregationFn - Function to aggregate values
 * @returns {any} Aggregated result
 */
function aggregateConsentedData(churchDataArray, consentedChurches, aggregationFn) {
  try {
    const filtered = filterDataByConsent(churchDataArray, consentedChurches);

    if (filtered.length === 0) {
      console.warn('[aggregateConsentedData] No consented data to aggregate');
      return null;
    }

    // Extract values and pass to aggregation function
    const values = filtered.map((item) => item.value || item.amount || 0);
    const result = aggregationFn(values);

    console.log(`[aggregateConsentedData] Aggregated ${filtered.length} items: ${result}`);

    return result;
  } catch (error) {
    console.error('[aggregateConsentedData] Error:', error);
    throw error;
  }
}

/**
 * getConsentSummary(networkId)
 *
 * Get overview of consent settings across all affiliated churches
 *
 * Returns: {
 *   totalChurches: 8,
 *   shareFinancialData: 6,
 *   shareMembershipData: 7,
 *   shareEventData: 8,
 *   shareActivityData: 7,
 *   shareAttendanceData: 5,
 *   shareDetailedFinances: 1,
 *   shareMemberNames: 0
 * }
 *
 * @param {number} networkId - Network ID
 * @returns {object} Consent summary statistics
 */
async function getConsentSummary(networkId) {
  try {
    console.log(`[getConsentSummary] Generating consent summary for network ${networkId}`);

    // Get all churches in network
    const churches = await Church.findAll({
      where: { networkId },
      attributes: ['id'],
      raw: true,
    });

    const totalChurches = churches.length;

    // Get all consent records
    const consents = await ChurchDataConsent.findAll({
      where: { networkId },
      attributes: [
        'shareFinancialData',
        'shareMembershipData',
        'shareEventData',
        'shareActivityData',
        'shareAttendanceData',
        'shareDetailedFinances',
        'shareMemberNames',
      ],
      raw: true,
    });

    // Count consent by category
    const summary = {
      totalChurches,
      shareFinancialData: consents.filter((c) => c.shareFinancialData).length,
      shareMembershipData: consents.filter((c) => c.shareMembershipData).length,
      shareEventData: consents.filter((c) => c.shareEventData).length,
      shareActivityData: consents.filter((c) => c.shareActivityData).length,
      shareAttendanceData: consents.filter((c) => c.shareAttendanceData).length,
      shareDetailedFinances: consents.filter((c) => c.shareDetailedFinances).length,
      shareMemberNames: consents.filter((c) => c.shareMemberNames).length,
    };

    console.log(
      `[getConsentSummary] ✅ Generated consent summary:`,
      summary,
    );

    return summary;
  } catch (error) {
    console.error('[getConsentSummary] Error:', error);
    throw error;
  }
}

module.exports = {
  getChurchesWithConsent,
  checkChurchConsent,
  filterDataByConsent,
  aggregateConsentedData,
  getConsentSummary,
};
