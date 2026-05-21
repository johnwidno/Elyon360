/**
 * Content Controller
 * Handles organization (network) publishing of content to affiliated churches
 *
 * Endpoints:
 * - POST /api/networks/:networkId/content - Create new content (draft)
 * - GET /api/networks/:networkId/content - List org's published content
 * - GET /api/networks/:networkId/content/:contentId - Get specific content
 * - PATCH /api/networks/:networkId/content/:contentId - Update draft content
 * - PUT /api/networks/:networkId/content/:contentId/publish - Publish content
 * - DELETE /api/networks/:networkId/content/:contentId - Remove content
 */

const { NetworkContent, AuditLog, ChurchNetwork } = require('../models');

/**
 * createContent(req, res)
 * POST /api/networks/:networkId/content
 * Create new content (draft state initially)
 *
 * Body: {title, contentType, description, fileUrl OR richTextContent, targetScope, targetChurchIds}
 * Returns: Created content object
 */
exports.createContent = async (req, res) => {
  try {
    const { networkId } = req.params;
    const { title, contentType, description, fileUrl, richTextContent, targetScope, targetChurchIds } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !contentType) {
      return res.status(400).json({ error: 'Title and contentType required' });
    }

    if (!fileUrl && !richTextContent) {
      return res.status(400).json({ error: 'Either fileUrl or richTextContent required' });
    }

    // Verify network exists and user has permission
    const network = await ChurchNetwork.findByPk(networkId);
    if (!network) {
      return res.status(404).json({ error: 'Network not found' });
    }

    // Create content (draft)
    const content = await NetworkContent.create({
      networkId,
      title,
      contentType,
      description,
      fileUrl: fileUrl || null,
      richTextContent: richTextContent || null,
      isPublished: false,
      targetScope: targetScope || 'all_churches',
      targetChurchIds: targetChurchIds || [],
      createdBy: userId,
      updatedBy: userId,
    });

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_created',
      severity: 'info',
      status: 'success',
      userId,
      networkId,
      resourceType: 'network_content',
      resourceId: content.id,
      action: 'CREATE',
      description: `Created draft content: "${title}"`,
      metadata: { contentType, targetScope },
    });

    return res.status(201).json({
      success: true,
      content,
      message: 'Content created as draft',
    });
  } catch (error) {
    console.error('[createContent] Error:', error);

    await AuditLog.logEvent({
      eventType: 'content_created',
      severity: 'error',
      status: 'failed',
      userId: req.user.id,
      networkId: req.params.networkId,
      resourceType: 'network_content',
      action: 'CREATE',
      errorMessage: error.message,
      errorCode: 'CREATE_CONTENT_ERROR',
    });

    return res.status(500).json({ error: 'Failed to create content' });
  }
};

/**
 * listPublishedContent(req, res)
 * GET /api/networks/:networkId/content
 * List all published content from org (or all if admin)
 */
exports.listPublishedContent = async (req, res) => {
  try {
    const { networkId } = req.params;
    const { contentType, includeArchived } = req.query;

    const where = {
      networkId,
      isPublished: true,
    };

    if (!includeArchived || includeArchived === 'false') {
      where.isArchived = false;
    }

    if (contentType) {
      where.contentType = contentType;
    }

    const content = await NetworkContent.findAll({
      where,
      order: [['publishedAt', 'DESC']],
      attributes: {
        exclude: ['richTextContent'], // Don't send full text in list
      },
    });

    // Fetch adoption stats for each
    const contentWithStats = await Promise.all(
      content.map(async (c) => {
        const stats = await NetworkContent.getAdoptionStats(c.id);
        return {
          ...c.toJSON(),
          adoptionStats: stats,
        };
      })
    );

    return res.status(200).json({
      success: true,
      networkId,
      total: contentWithStats.length,
      content: contentWithStats,
    });
  } catch (error) {
    console.error('[listPublishedContent] Error:', error);
    return res.status(500).json({ error: 'Failed to list content' });
  }
};

/**
 * getContent(req, res)
 * GET /api/networks/:networkId/content/:contentId
 * Get specific content with full details
 */
exports.getContent = async (req, res) => {
  try {
    const { networkId, contentId } = req.params;

    const content = await NetworkContent.findOne({
      where: {
        id: contentId,
        networkId,
      },
      include: [
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get adoption stats
    const stats = await NetworkContent.getAdoptionStats(contentId);

    return res.status(200).json({
      success: true,
      content: {
        ...content.toJSON(),
        adoptionStats: stats,
      },
    });
  } catch (error) {
    console.error('[getContent] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
};

/**
 * updateContent(req, res)
 * PATCH /api/networks/:networkId/content/:contentId
 * Update draft content (only before publishing)
 */
exports.updateContent = async (req, res) => {
  try {
    const { networkId, contentId } = req.params;
    const { title, description, fileUrl, richTextContent, targetScope, targetChurchIds } = req.body;
    const userId = req.user.id;

    const content = await NetworkContent.findOne({
      where: {
        id: contentId,
        networkId,
      },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.isPublished) {
      return res.status(400).json({
        error: 'Cannot edit published content. Archive and create new version.',
      });
    }

    // Update allowed fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (fileUrl !== undefined) updates.fileUrl = fileUrl;
    if (richTextContent !== undefined) updates.richTextContent = richTextContent;
    if (targetScope !== undefined) updates.targetScope = targetScope;
    if (targetChurchIds !== undefined) updates.targetChurchIds = targetChurchIds;
    updates.updatedBy = userId;

    const updated = await content.update(updates);

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_updated',
      severity: 'info',
      status: 'success',
      userId,
      networkId,
      resourceType: 'network_content',
      resourceId: contentId,
      action: 'UPDATE',
      description: `Updated draft content: "${title || content.title}"`,
    });

    return res.status(200).json({
      success: true,
      content: updated,
    });
  } catch (error) {
    console.error('[updateContent] Error:', error);
    return res.status(500).json({ error: 'Failed to update content' });
  }
};

/**
 * publishContent(req, res)
 * PUT /api/networks/:networkId/content/:contentId/publish
 * Publish draft content (make visible to churches)
 */
exports.publishContent = async (req, res) => {
  try {
    const { networkId, contentId } = req.params;
    const userId = req.user.id;

    const content = await NetworkContent.findOne({
      where: {
        id: contentId,
        networkId,
      },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.isPublished) {
      return res.status(400).json({ error: 'Content already published' });
    }

    const updated = await content.update({
      isPublished: true,
      publishedAt: new Date(),
      updatedBy: userId,
    });

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_published',
      severity: 'info',
      status: 'success',
      userId,
      networkId,
      resourceType: 'network_content',
      resourceId: contentId,
      action: 'PUBLISH',
      description: `Published content: "${content.title}"`,
      metadata: { contentType: content.contentType, targetScope: content.targetScope },
    });

    // Send notifications to affiliated churches
    const { notifyChurchesOfNewContent } = require('../utils/notificationService');
    const notificationResult = await notifyChurchesOfNewContent(contentId);

    return res.status(200).json({
      success: true,
      content: updated,
      notifications: notificationResult,
      message: 'Content published and notifications sent to affiliated churches',
    });
  } catch (error) {
    console.error('[publishContent] Error:', error);
    return res.status(500).json({ error: 'Failed to publish content' });
  }
};

/**
 * archiveContent(req, res)
 * DELETE /api/networks/:networkId/content/:contentId
 * Archive content (soft delete - hide from churches)
 */
exports.archiveContent = async (req, res) => {
  try {
    const { networkId, contentId } = req.params;
    const userId = req.user.id;

    const content = await NetworkContent.findOne({
      where: {
        id: contentId,
        networkId,
      },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const updated = await content.update({
      isArchived: true,
      archivedAt: new Date(),
      updatedBy: userId,
    });

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_archived',
      severity: 'info',
      status: 'success',
      userId,
      networkId,
      resourceType: 'network_content',
      resourceId: contentId,
      action: 'DELETE',
      description: `Archived content: "${content.title}"`,
    });

    return res.status(200).json({
      success: true,
      content: updated,
      message: 'Content archived and hidden from churches',
    });
  } catch (error) {
    console.error('[archiveContent] Error:', error);
    return res.status(500).json({ error: 'Failed to archive content' });
  }
};

/**
 * getContentStats(req, res)
 * GET /api/networks/:networkId/content/:contentId/stats
 * Get detailed adoption statistics for content
 */
exports.getContentStats = async (req, res) => {
  try {
    const { networkId, contentId } = req.params;

    const content = await NetworkContent.findOne({
      where: {
        id: contentId,
        networkId,
      },
      attributes: ['id', 'title', 'contentType', 'publishedAt'],
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get adoption statistics
    const stats = await NetworkContent.getAdoptionStats(contentId);

    // Get adoption breakdown by church (if needed)
    const { ChurchContentAdoption } = require('../models');
    const adoptionsByStatus = await ChurchContentAdoption.findAll({
      where: { networkContentId: contentId },
      attributes: ['adoptionStatus', 'churchId', 'viewedAt', 'adoptedAt', 'sharedAt'],
      order: [['adoptedAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      content,
      stats,
      adoptionsByStatus,
    });
  } catch (error) {
    console.error('[getContentStats] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch content stats' });
  }
};
