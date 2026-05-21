'use strict';

/**
 * Controller: publicPortalController
 * Purpose: Handle public (unauthenticated) endpoints for church portal content viewing
 * Endpoints: 4 total (homepage, list by type, view content, search)
 * Access: Public (no authentication required) - respects visibility settings
 * Phase: 5a - Church Portal System
 */

const db = require('../models');
const crypto = require('crypto');

/**
 * Generate visitor fingerprint from request
 * Params: req (Express request)
 * Returns: fingerprint hash
 */
function generateVisitorFingerprint(req) {
  const userAgent = req.get('user-agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const combined = `${ip}:${userAgent}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// =============================================================================
// ENDPOINT 1: Get Portal Homepage
// GET /:churchDomain/api/portal
// Returns: Portal branding, featured content, content types
// =============================================================================

exports.getHomepage = async (req, res) => {
  try {
    const { churchId, portalSettings } = req;

    if (!churchId || !portalSettings) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Get portal configuration
    const branding = portalSettings.getBrandingData(req.church.name);

    // Get enabled content types
    const contentTypes = await db.ChurchContentTypeConfig.getEnabledTypes(
      churchId,
      'public'
    );

    // Get recent content (published, non-archived, public)
    const recentContent = await db.ChurchContent.findAll({
      where: {
        churchId,
        isArchived: false,
        publishedAt: { [db.Sequelize.Op.not]: null },
        visibility: 'public',
      },
      order: [['publishedAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'slug', 'contentType', 'featuredImageUrl', 'publishedAt'],
    });

    // Get featured image if set
    const featured = portalSettings.heroImageUrl || null;

    res.json({
      success: true,
      data: {
        branding,
        featured,
        contentTypes: contentTypes.map((ct) => ({
          id: ct.id,
          name: ct.contentTypeName,
          displayName: ct.displayName,
          description: ct.description,
        })),
        recentContent: recentContent.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          type: c.contentType,
          featuredImage: c.featuredImageUrl,
          published: c.publishedAt,
        })),
      },
    });
  } catch (error) {
    console.error('getHomepage error:', error);
    res.status(500).json({
      error: 'Error loading portal homepage',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 2: List Content by Type
// GET /:churchDomain/api/portal/content?contentType=sermon&page=1&limit=10
// Returns: Paginated list of published content, filtered by type
// =============================================================================

exports.listContentByType = async (req, res) => {
  try {
    const { churchId } = req;
    const { contentType, page = 1, limit = 10 } = req.query;

    if (!churchId) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Build where clause for public content
    const where = {
      churchId,
      isArchived: false,
      publishedAt: { [db.Sequelize.Op.not]: null },
      visibility: 'public',
    };

    if (contentType) {
      // Verify content type is enabled for public portal
      const typeConfig = await db.ChurchContentTypeConfig.getType(
        churchId,
        contentType
      );

      if (!typeConfig || !typeConfig.isEnabled || !typeConfig.showInPublicPortal) {
        return res.status(400).json({
          error: 'Content type not available in public portal',
        });
      }

      where.contentType = contentType;
    }

    // Fetch content with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await db.ChurchContent.findAndCountAll({
      where,
      order: [['publishedAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: [
        'id',
        'title',
        'slug',
        'contentType',
        'category',
        'tags',
        'featuredImageUrl',
        'publishedAt',
        'metaDescription',
      ],
    });

    res.json({
      success: true,
      data: rows.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        type: c.contentType,
        category: c.category,
        tags: c.tags,
        featuredImage: c.featuredImageUrl,
        description: c.metaDescription,
        published: c.publishedAt,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('listContentByType error:', error);
    res.status(500).json({
      error: 'Error fetching content',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 3: View Content
// GET /:churchDomain/api/portal/content/:contentSlug
// Returns: Full content with metadata, records view
// =============================================================================

exports.viewContent = async (req, res) => {
  try {
    const { churchId } = req;
    const { contentSlug } = req.params;

    if (!churchId) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Fetch content
    const content = await db.ChurchContent.findOne({
      where: {
        churchId,
        slug: contentSlug,
        isArchived: false,
        publishedAt: { [db.Sequelize.Op.not]: null },
      },
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Check visibility
    if (content.visibility !== 'public') {
      return res.status(403).json({
        error: 'This content is not publicly available',
      });
    }

    // Record view
    const fingerprint = generateVisitorFingerprint(req);
    await db.ChurchContentView.recordView({
      churchId,
      churchContentId: content.id,
      userId: req.user?.id || null, // null for anonymous
      visitorFingerprint: fingerprint,
      referrerUrl: req.get('referer') || null,
    });

    // Get view count
    const viewCount = await db.ChurchContentView.getViewCount(content.id);

    res.json({
      success: true,
      data: {
        id: content.id,
        title: content.title,
        slug: content.slug,
        type: content.contentType,
        category: content.category,
        tags: content.tags || [],
        richTextContent: content.richTextContent,
        featuredImage: content.featuredImageUrl,
        attachment: content.attachmentUrl,
        published: content.publishedAt,
        updated: content.updatedAt,
        seo: {
          title: content.getSeoTitle(),
          description: content.getSeoDescription(),
        },
        creator: content.creator,
        stats: {
          views: viewCount,
        },
      },
    });
  } catch (error) {
    console.error('viewContent error:', error);
    res.status(500).json({
      error: 'Error loading content',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 4: Search Content
// GET /:churchDomain/api/portal/search?q=sermon&page=1&limit=10
// Returns: Paginated search results from published content
// =============================================================================

exports.searchContent = async (req, res) => {
  try {
    const { churchId } = req;
    const { q, page = 1, limit = 10 } = req.query;

    if (!churchId) {
      return res.status(404).json({ error: 'Church not found' });
    }

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query cannot be empty',
      });
    }

    // Search content
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await db.ChurchContent.findAndCountAll({
      where: {
        churchId,
        isArchived: false,
        publishedAt: { [db.Sequelize.Op.not]: null },
        visibility: 'public',
        [db.Sequelize.Op.or]: [
          { title: { [db.Sequelize.Op.iLike]: `%${q}%` } },
          { richTextContent: { [db.Sequelize.Op.iLike]: `%${q}%` } },
          { tags: { [db.Sequelize.Op.overlap]: [q.toLowerCase()] } },
        ],
      },
      order: [['publishedAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: [
        'id',
        'title',
        'slug',
        'contentType',
        'featuredImageUrl',
        'publishedAt',
        'metaDescription',
      ],
    });

    res.json({
      success: true,
      data: rows.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        type: c.contentType,
        featuredImage: c.featuredImageUrl,
        description: c.metaDescription,
        published: c.publishedAt,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
        query: q,
      },
    });
  } catch (error) {
    console.error('searchContent error:', error);
    res.status(500).json({
      error: 'Error searching content',
      message: error.message,
    });
  }
};

// =============================================================================
// BONUS: Get Portal Configuration (for frontend initialization)
// GET /:churchDomain/api/portal/config
// Returns: Portal settings, features, and branding
// =============================================================================

exports.getPortalConfig = async (req, res) => {
  try {
    const { churchId, portalSettings } = req;

    if (!churchId || !portalSettings) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Get all enabled content types
    const contentTypes = await db.ChurchContentTypeConfig.findAll({
      where: {
        churchId,
        isEnabled: true,
        showInPublicPortal: true,
      },
      order: [['sortOrder', 'ASC']],
      attributes: [
        'id',
        'contentTypeName',
        'displayName',
        'description',
        'sortOrder',
      ],
    });

    // Get portal configuration
    const config = portalSettings.getConfiguration(req.church.name);

    res.json({
      success: true,
      data: {
        ...config,
        contentTypes: contentTypes.map((ct) => ({
          name: ct.contentTypeName,
          display: ct.displayName,
          description: ct.description,
          order: ct.sortOrder,
        })),
      },
    });
  } catch (error) {
    console.error('getPortalConfig error:', error);
    res.status(500).json({
      error: 'Error loading portal configuration',
      message: error.message,
    });
  }
};

module.exports = exports;
