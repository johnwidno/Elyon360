/**
 * Content Utilities
 * Helper functions for content filtering, searching, and permissions
 *
 * Purpose: Encapsulate content-related logic to avoid boilerplate in controllers
 */

const { NetworkContent, ChurchContentAdoption, ChurchNetworkAffiliation, Church } = require('../models');
const { Op } = require('sequelize');

/**
 * getNetworkContent(networkId, options)
 * Get content published by a network with optional filtering
 *
 * Options: {
 *   published: boolean,
 *   contentType: string,
 *   limit: number,
 *   offset: number
 * }
 */
async function getNetworkContent(networkId, options = {}) {
  try {
    const { published, contentType, limit = 50, offset = 0 } = options;

    const where = { networkId };
    if (published !== undefined) {
      where.isPublished = published;
    }
    if (published !== false) {
      where.isArchived = false;
    }
    if (contentType) {
      where.contentType = contentType;
    }

    console.log(`[getNetworkContent] Fetching content for network ${networkId}`, { where });

    const content = await NetworkContent.findAll({
      where,
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
    });

    return content;
  } catch (error) {
    console.error('[getNetworkContent] Error:', error);
    throw error;
  }
}

/**
 * getChurchAvailableContent(churchId, options)
 * Get all content available to a church from affiliated networks
 *
 * Options: {
 *   contentType: string,
 *   adoptionStatus: string,
 *   shareMethod: string
 * }
 */
async function getChurchAvailableContent(churchId, options = {}) {
  try {
    const { contentType, adoptionStatus } = options;

    console.log(`[getChurchAvailableContent] Fetching content available to church ${churchId}`);

    // Get affiliated networks
    const affiliations = await ChurchNetworkAffiliation.findAll({
      where: { churchId },
      attributes: ['networkId'],
      raw: true,
    });

    const networkIds = affiliations.map((a) => a.networkId);

    if (networkIds.length === 0) {
      console.log(`[getChurchAvailableContent] Church ${churchId} not affiliated with any networks`);
      return [];
    }

    // Get published content
    const where = {
      networkId: { [Op.in]: networkIds },
      isPublished: true,
      isArchived: false,
    };

    if (contentType) {
      where.contentType = contentType;
    }

    const availableContent = await NetworkContent.findAll({
      where,
      attributes: ['id', 'networkId', 'title', 'contentType', 'description', 'publishedAt'],
      order: [['publishedAt', 'DESC']],
    });

    // Get church's adoption statuses
    const adoptionStatuses = await ChurchContentAdoption.findAll({
      where: {
        churchId,
        networkContentId: { [Op.in]: availableContent.map((c) => c.id) },
      },
      attributes: ['networkContentId', 'adoptionStatus', 'shareWithMembers'],
      raw: true,
    });

    const statusMap = {};
    adoptionStatuses.forEach((as) => {
      statusMap[as.networkContentId] = as;
    });

    // Enhance content with adoption status
    let result = availableContent.map((c) => {
      const adoption = statusMap[c.id] || { adoptionStatus: 'available', shareWithMembers: false };
      return {
        ...c.toJSON(),
        ...adoption,
      };
    });

    // Filter by adoption status if requested
    if (adoptionStatus) {
      result = result.filter((c) => c.adoptionStatus === adoptionStatus);
    }

    console.log(
      `[getChurchAvailableContent] Found ${result.length} available content pieces for church ${churchId}`
    );

    return result;
  } catch (error) {
    console.error('[getChurchAvailableContent] Error:', error);
    throw error;
  }
}

/**
 * getChurchAdoptedContent(churchId)
 * Get all content a church has adopted (for library/sharing)
 */
async function getChurchAdoptedContent(churchId) {
  try {
    console.log(`[getChurchAdoptedContent] Fetching adopted content for church ${churchId}`);

    const adoptions = await ChurchContentAdoption.findAll({
      where: {
        churchId,
        adoptionStatus: 'adopted',
      },
      include: [
        {
          model: NetworkContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType', 'description', 'fileUrl', 'publishedAt'],
        },
      ],
      order: [['adoptedAt', 'DESC']],
    });

    const content = adoptions.map((a) => ({
      ...a.content.toJSON(),
      adoptedAt: a.adoptedAt,
      shareWithMembers: a.shareWithMembers,
      shareMethod: a.shareMethod,
    }));

    console.log(`[getChurchAdoptedContent] Found ${content.length} adopted content pieces`);

    return content;
  } catch (error) {
    console.error('[getChurchAdoptedContent] Error:', error);
    throw error;
  }
}

/**
 * getContentByType(networkId, contentType)
 * Get content filtered by type
 */
async function getContentByType(networkId, contentType) {
  try {
    console.log(`[getContentByType] Fetching ${contentType} content for network ${networkId}`);

    const content = await NetworkContent.findAll({
      where: {
        networkId,
        contentType,
        isPublished: true,
        isArchived: false,
      },
      order: [['publishedAt', 'DESC']],
    });

    return content;
  } catch (error) {
    console.error('[getContentByType] Error:', error);
    throw error;
  }
}

/**
 * searchContent(networkId, query)
 * Search content by title and description
 */
async function searchContent(networkId, query) {
  try {
    console.log(`[searchContent] Searching content in network ${networkId} for: ${query}`);

    const content = await NetworkContent.findAll({
      where: {
        networkId,
        isPublished: true,
        isArchived: false,
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
        ],
      },
      order: [['publishedAt', 'DESC']],
    });

    return content;
  } catch (error) {
    console.error('[searchContent] Error:', error);
    throw error;
  }
}

/**
 * canChurchViewContent(churchId, contentId)
 * Check if a church has permission to view specific content
 * (i.e., affiliated network published it)
 */
async function canChurchViewContent(churchId, contentId) {
  try {
    const content = await NetworkContent.findByPk(contentId, {
      attributes: ['id', 'networkId', 'isPublished', 'isArchived'],
    });

    if (!content || !content.isPublished || content.isArchived) {
      return false;
    }

    const affiliation = await ChurchNetworkAffiliation.findOne({
      where: {
        churchId,
        networkId: content.networkId,
      },
    });

    return !!affiliation;
  } catch (error) {
    console.error('[canChurchViewContent] Error:', error);
    throw error;
  }
}

/**
 * getAdoptionStats(contentId)
 * Get adoption statistics for a content piece
 */
async function getAdoptionStats(contentId) {
  try {
    console.log(`[getAdoptionStats] Fetching stats for content ${contentId}`);

    const stats = await ChurchContentAdoption.findAll({
      where: { networkContentId: contentId },
      attributes: ['adoptionStatus', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      group: ['adoptionStatus'],
      raw: true,
    });

    const result = {
      total: 0,
      viewed: 0,
      adopted: 0,
      ignored: 0,
      archived: 0,
      shared: 0,
    };

    stats.forEach((stat) => {
      result[stat.adoptionStatus] = parseInt(stat.count, 10);
      result.total += parseInt(stat.count, 10);
    });

    // Count shared
    const sharedCount = await ChurchContentAdoption.count({
      where: {
        networkContentId: contentId,
        shareWithMembers: true,
      },
    });

    result.shared = sharedCount;

    return result;
  } catch (error) {
    console.error('[getAdoptionStats] Error:', error);
    throw error;
  }
}

/**
 * getContentSharedBefore(networkId, daysAgo)
 * Get content published more than X days ago
 * Useful for finding content that should have been adopted by now
 */
async function getContentSharedBefore(networkId, daysAgo = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    console.log(
      `[getContentSharedBefore] Fetching content for network ${networkId} published before ${cutoffDate}`
    );

    const content = await NetworkContent.findAll({
      where: {
        networkId,
        isPublished: true,
        isArchived: false,
        publishedAt: { [Op.lt]: cutoffDate },
      },
      order: [['publishedAt', 'DESC']],
    });

    return content;
  } catch (error) {
    console.error('[getContentSharedBefore] Error:', error);
    throw error;
  }
}

/**
 * getUnadoptedContent(networkId, daysAgo)
 * Get content that hasn't been adopted yet
 * Useful for network admins to track engagement
 */
async function getUnadoptedContent(networkId, daysAgo = 30) {
  try {
    console.log(`[getUnadoptedContent] Fetching unadopted content for network ${networkId}`);

    // Get recent content
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const recentContent = await NetworkContent.findAll({
      where: {
        networkId,
        isPublished: true,
        isArchived: false,
        publishedAt: { [Op.gte]: cutoffDate },
      },
    });

    // For each content, count adoptions
    const unadopted = [];

    for (const content of recentContent) {
      const adoptedCount = await ChurchContentAdoption.count({
        where: {
          networkContentId: content.id,
          adoptionStatus: 'adopted',
        },
      });

      if (adoptedCount === 0) {
        unadopted.push(content);
      }
    }

    return unadopted;
  } catch (error) {
    console.error('[getUnadoptedContent] Error:', error);
    throw error;
  }
}

module.exports = {
  getNetworkContent,
  getChurchAvailableContent,
  getChurchAdoptedContent,
  getContentByType,
  searchContent,
  canChurchViewContent,
  getAdoptionStats,
  getContentSharedBefore,
  getUnadoptedContent,
};
