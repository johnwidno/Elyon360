'use strict';

/**
 * Controller: portalAdminController
 * Purpose: Handle admin (authenticated) endpoints for church portal content management
 * Endpoints: 7 total (create, read, update, delete, config, analytics)
 * Access: Church admins only (requires authentication + admin role)
 * Phase: 5a - Church Portal System
 */

const db = require('../models');
const { validationResult, body } = require('express-validator');
const AuditLog = require('../models/AuditLog');

// =============================================================================
// ENDPOINT 1: Create Content
// POST /api/churches/:churchId/portal/content
// Creates new content for church portal (draft or published)
// =============================================================================

exports.createContent = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { churchId } = req.params;
    const {
      title,
      contentType,
      richTextContent,
      visibility,
      featuredImageUrl,
      attachmentUrl,
      requiredRoles,
      tags,
      category,
      metaTitle,
      metaDescription,
      publish,
    } = req.body;

    // Verify church exists
    const church = await db.Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Verify content type config exists
    const typeConfig = await db.ChurchContentTypeConfig.getType(
      churchId,
      contentType
    );
    if (!typeConfig) {
      return res.status(400).json({
        error: `Content type "${contentType}" not configured for this church`,
      });
    }

    // Generate slug from title
    const slug = db.ChurchContent.createSlug(title);

    // Check slug uniqueness
    const existing = await db.ChurchContent.findOne({
      where: { churchId, slug },
    });
    if (existing) {
      return res.status(400).json({
        error: 'A content item with this title already exists',
      });
    }

    // Create content
    const content = await db.ChurchContent.create({
      churchId,
      title,
      slug,
      contentType,
      richTextContent,
      visibility: visibility || typeConfig.defaultVisibility,
      featuredImageUrl,
      attachmentUrl,
      requiredRoles: requiredRoles || [],
      tags: tags || [],
      category,
      metaTitle,
      metaDescription,
      publishedAt: publish ? new Date() : null,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    // Log audit event
    await AuditLog.create({
      churchId,
      userId: req.user.id,
      action: 'portal_content_created',
      entityType: 'ChurchContent',
      entityId: content.id,
      changes: { created: true },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      content: content.toJSON(),
    });
  } catch (error) {
    console.error('createContent error:', error);
    res.status(500).json({
      error: 'Error creating content',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 2: List Content
// GET /api/churches/:churchId/portal/content?contentType=X&page=1&limit=20
// Retrieves paginated list of content with optional filters
// =============================================================================

exports.listContent = async (req, res) => {
  try {
    const { churchId } = req.params;
    const {
      contentType,
      visibility,
      archived,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    // Verify church exists
    const church = await db.Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Build where clause
    const where = { churchId };
    if (contentType) where.contentType = contentType;
    if (visibility) where.visibility = visibility;
    if (archived !== undefined)
      where.isArchived = archived === 'true' ? true : false;

    // Add search filter if provided
    if (search) {
      where[db.Sequelize.Op.or] = [
        { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { richTextContent: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    // Fetch content with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await db.ChurchContent.findAndCountAll({
      where,
      order: [['publishedAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('listContent error:', error);
    res.status(500).json({
      error: 'Error fetching content',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 3: Update Content
// PATCH /api/churches/:churchId/portal/content/:contentId
// Updates existing content (draft or published)
// =============================================================================

exports.updateContent = async (req, res) => {
  try {
    const { churchId, contentId } = req.params;
    const {
      title,
      richTextContent,
      visibility,
      featuredImageUrl,
      attachmentUrl,
      requiredRoles,
      tags,
      category,
      metaTitle,
      metaDescription,
      publish,
    } = req.body;

    // Fetch content
    const content = await db.ChurchContent.findOne({
      where: { id: contentId, churchId },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Track changes for audit log
    const changes = {};

    // Update fields
    if (title && title !== content.title) {
      changes.title = { from: content.title, to: title };
      content.title = title;

      // Regenerate slug if title changed
      const newSlug = db.ChurchContent.createSlug(title);
      const slugExists = await db.ChurchContent.findOne({
        where: {
          churchId,
          slug: newSlug,
          id: { [db.Sequelize.Op.ne]: contentId },
        },
      });
      if (!slugExists) {
        content.slug = newSlug;
      }
    }

    if (richTextContent !== undefined) {
      changes.richTextContent = { modified: true };
      content.richTextContent = richTextContent;
    }

    if (visibility) {
      changes.visibility = { from: content.visibility, to: visibility };
      content.visibility = visibility;
    }

    if (featuredImageUrl !== undefined) {
      content.featuredImageUrl = featuredImageUrl;
    }

    if (attachmentUrl !== undefined) {
      content.attachmentUrl = attachmentUrl;
    }

    if (requiredRoles !== undefined) {
      content.requiredRoles = requiredRoles;
    }

    if (tags !== undefined) {
      content.tags = tags;
    }

    if (category !== undefined) {
      content.category = category;
    }

    if (metaTitle !== undefined) {
      content.metaTitle = metaTitle;
    }

    if (metaDescription !== undefined) {
      content.metaDescription = metaDescription;
    }

    // Handle publish action
    if (publish === true && !content.publishedAt) {
      content.publishedAt = new Date();
      changes.publishedAt = { from: null, to: 'published' };
    }

    content.updatedBy = req.user.id;
    await content.save();

    // Log audit event
    await AuditLog.create({
      churchId,
      userId: req.user.id,
      action: 'portal_content_updated',
      entityType: 'ChurchContent',
      entityId: content.id,
      changes,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Content updated successfully',
      content: content.toJSON(),
    });
  } catch (error) {
    console.error('updateContent error:', error);
    res.status(500).json({
      error: 'Error updating content',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 4: Archive Content
// DELETE /api/churches/:churchId/portal/content/:contentId
// Soft-deletes (archives) content
// =============================================================================

exports.deleteContent = async (req, res) => {
  try {
    const { churchId, contentId } = req.params;

    // Fetch content
    const content = await db.ChurchContent.findOne({
      where: { id: contentId, churchId },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.isArchived) {
      return res.status(400).json({
        error: 'Content is already archived',
      });
    }

    // Archive content
    content.isArchived = true;
    await content.save();

    // Log audit event
    await AuditLog.create({
      churchId,
      userId: req.user.id,
      action: 'portal_content_archived',
      entityType: 'ChurchContent',
      entityId: content.id,
      changes: { isArchived: { from: false, to: true } },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Content archived successfully',
      content: content.toJSON(),
    });
  } catch (error) {
    console.error('deleteContent error:', error);
    res.status(500).json({
      error: 'Error archiving content',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 5: Get Content Type Configuration
// GET /api/churches/:churchId/portal/config
// Retrieves all configured content types for the church
// =============================================================================

exports.getConfig = async (req, res) => {
  try {
    const { churchId } = req.params;

    // Verify church exists
    const church = await db.Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Fetch all content type configs
    const configs = await db.ChurchContentTypeConfig.getAllTypes(churchId);

    // Get portal settings
    const portalSettings = await db.ChurchPortalSettings.getByChurchId(churchId);

    res.json({
      success: true,
      data: {
        contentTypes: configs,
        portalSettings: portalSettings
          ? portalSettings.toJSON()
          : null,
      },
    });
  } catch (error) {
    console.error('getConfig error:', error);
    res.status(500).json({
      error: 'Error fetching configuration',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 6: Update Content Type Configuration
// PATCH /api/churches/:churchId/portal/config
// Updates content type configs and portal settings
// =============================================================================

exports.updateConfig = async (req, res) => {
  try {
    const { churchId } = req.params;
    const { contentTypes, portalSettings } = req.body;

    // Verify church exists
    const church = await db.Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    const changes = {};

    // Update content type configs if provided
    if (contentTypes && Array.isArray(contentTypes)) {
      for (const typeUpdate of contentTypes) {
        const {
          contentTypeName,
          displayName,
          description,
          isEnabled,
          sortOrder,
          showInPublicPortal,
          showInMemberPortal,
          defaultVisibility,
          requiresFeaturedImage,
        } = typeUpdate;

        const { config } = await db.ChurchContentTypeConfig.upsertType(
          churchId,
          {
            contentTypeName,
            displayName,
            description,
            isEnabled,
            sortOrder,
            showInPublicPortal,
            showInMemberPortal,
            defaultVisibility,
            requiresFeaturedImage,
          }
        );

        changes[`contentType_${contentTypeName}`] = 'updated';
      }
    }

    // Update portal settings if provided
    if (portalSettings) {
      const settings =
        await db.ChurchPortalSettings.getOrCreate(churchId);

      if (portalSettings.portalTitle)
        settings.portalTitle = portalSettings.portalTitle;
      if (portalSettings.portalDescription)
        settings.portalDescription = portalSettings.portalDescription;
      if (portalSettings.portalLogoUrl)
        settings.portalLogoUrl = portalSettings.portalLogoUrl;
      if (portalSettings.heroImageUrl)
        settings.heroImageUrl = portalSettings.heroImageUrl;
      if (portalSettings.itemsPerPage)
        settings.itemsPerPage = portalSettings.itemsPerPage;
      if (portalSettings.enableComments !== undefined)
        settings.enableComments = portalSettings.enableComments;
      if (portalSettings.enableSearch !== undefined)
        settings.enableSearch = portalSettings.enableSearch;
      if (portalSettings.socialMediaLinks)
        settings.socialMediaLinks = portalSettings.socialMediaLinks;
      if (portalSettings.googleAnalyticsId)
        settings.googleAnalyticsId = portalSettings.googleAnalyticsId;
      if (portalSettings.footerText) settings.footerText = portalSettings.footerText;
      if (portalSettings.privacyPolicyUrl)
        settings.privacyPolicyUrl = portalSettings.privacyPolicyUrl;
      if (portalSettings.contactEmail)
        settings.contactEmail = portalSettings.contactEmail;

      await settings.save();
      changes.portalSettings = 'updated';
    }

    // Log audit event
    await AuditLog.create({
      churchId,
      userId: req.user.id,
      action: 'portal_config_updated',
      entityType: 'ChurchPortal',
      entityId: churchId,
      changes,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      changes,
    });
  } catch (error) {
    console.error('updateConfig error:', error);
    res.status(500).json({
      error: 'Error updating configuration',
      message: error.message,
    });
  }
};

// =============================================================================
// ENDPOINT 7: Get Portal Analytics
// GET /api/churches/:churchId/portal/analytics?days=30
// Retrieves content statistics, view analytics, and engagement metrics
// =============================================================================

exports.getAnalytics = async (req, res) => {
  try {
    const { churchId } = req.params;
    const { days = 30 } = req.query;

    // Verify church exists
    const church = await db.Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Content analytics
    const contentAnalytics = await db.ChurchContent.getContentAnalytics(
      churchId
    );

    // View analytics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const viewAnalytics = await db.ChurchContentView.getChurchStatistics(
      churchId,
      { startDate }
    );

    // Content type breakdown
    const contentByType = await db.ChurchContent.findAll({
      attributes: [
        'contentType',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
      ],
      where: { churchId, isArchived: false },
      group: ['contentType'],
      raw: true,
    });

    // Most viewed content
    const topContent = await db.ChurchContentView.findAll({
      attributes: [
        'churchContentId',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'viewCount'],
      ],
      where: { churchId },
      group: ['churchContentId'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
      include: [
        {
          model: db.ChurchContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType'],
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      data: {
        period: {
          days: parseInt(days),
          startDate,
          endDate: new Date(),
        },
        content: contentAnalytics,
        views: viewAnalytics,
        contentByType,
        topContent,
      },
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({
      error: 'Error fetching analytics',
      message: error.message,
    });
  }
};

module.exports = exports;
