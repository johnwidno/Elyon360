/**
 * Content Adoption Controller
 * Handles church decisions on adopting, ignoring, or sharing organization content
 *
 * Endpoints:
 * - GET /api/churches/:churchId/available-content - List available content from affiliated networks
 * - GET /api/churches/:churchId/content-decisions - List church's adoption decisions
 * - POST /api/churches/:churchId/content/:contentId/adopt - Adopt content
 * - POST /api/churches/:churchId/content/:contentId/ignore - Ignore content
 * - PATCH /api/churches/:churchId/content/:contentId/share - Update sharing settings
 * - GET /api/churches/:churchId/content/:contentId/view - Record view event
 */

const { ChurchContentAdoption, NetworkContent, ChurchNetworkAffiliation, Church, AuditLog } =
  require('../models');

/**
 * getAvailableContent(req, res)
 * GET /api/churches/:churchId/available-content
 * List all content available to a church from affiliated networks
 */
exports.getAvailableContent = async (req, res) => {
  try {
    const { churchId } = req.params;
    const { contentType, adoptionStatus } = req.query;
    const userId = req.user.id;

    // Verify church exists
    const church = await Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Get affiliated networks
    const affiliations = await ChurchNetworkAffiliation.findAll({
      where: { churchId },
      attributes: ['networkId'],
    });

    const networkIds = affiliations.map((a) => a.networkId);

    if (networkIds.length === 0) {
      return res.status(200).json({
        success: true,
        churchId,
        affiliatedNetworks: 0,
        availableContent: [],
      });
    }

    // Get published content from those networks
    const where = {
      networkId: { [require('sequelize').Op.in]: networkIds },
      isPublished: true,
      isArchived: false,
    };

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

    // Get church's adoption status for each content
    const contentIds = content.map((c) => c.id);
    let adoptionRecords = [];
    if (contentIds.length > 0) {
      adoptionRecords = await ChurchContentAdoption.findAll({
        where: {
          churchId,
          networkContentId: { [require('sequelize').Op.in]: contentIds },
        },
        attributes: ['networkContentId', 'adoptionStatus', 'shareWithMembers', 'adoptedAt'],
        raw: true,
      });
    }

    const adoptionMap = {};
    adoptionRecords.forEach((ar) => {
      adoptionMap[ar.networkContentId] = ar;
    });

    // Enhance content with adoption status
    let result = content.map((c) => {
      const adoption = adoptionMap[c.id] || { adoptionStatus: 'available', shareWithMembers: false };
      return {
        ...c.toJSON(),
        adoptionStatus: adoption.adoptionStatus,
        shareWithMembers: adoption.shareWithMembers,
        adoptedAt: adoption.adoptedAt,
      };
    });

    // Filter by adoptionStatus if requested
    if (adoptionStatus) {
      result = result.filter((c) => c.adoptionStatus === adoptionStatus);
    }

    return res.status(200).json({
      success: true,
      churchId,
      affiliatedNetworks: networkIds.length,
      availableContent: result,
      total: result.length,
    });
  } catch (error) {
    console.error('[getAvailableContent] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch available content' });
  }
};

/**
 * getContentDecisions(req, res)
 * GET /api/churches/:churchId/content-decisions
 * List church's adoption decisions (adopted, ignored, etc)
 */
exports.getContentDecisions = async (req, res) => {
  try {
    const { churchId } = req.params;
    const { adoptionStatus } = req.query;

    const where = { churchId };
    if (adoptionStatus) {
      where.adoptionStatus = adoptionStatus;
    }

    const decisions = await ChurchContentAdoption.findAll({
      where,
      include: [
        {
          model: NetworkContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType', 'description', 'publishedAt', 'networkId'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Get stats
    const stats = await ChurchContentAdoption.getAdoptionStatsForChurch(churchId);

    return res.status(200).json({
      success: true,
      churchId,
      stats,
      decisions,
    });
  } catch (error) {
    console.error('[getContentDecisions] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch content decisions' });
  }
};

/**
 * recordView(req, res)
 * GET /api/churches/:churchId/content/:contentId/view
 * Record when church admin views content
 */
exports.recordView = async (req, res) => {
  try {
    const { churchId, contentId } = req.params;
    const userId = req.user.id;

    // Verify content exists
    const content = await NetworkContent.findByPk(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Record view
    const adoption = await ChurchContentAdoption.recordView(churchId, contentId, userId);

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_viewed',
      severity: 'info',
      status: 'success',
      userId,
      churchId,
      resourceType: 'church_content_adoption',
      resourceId: adoption.id,
      action: 'VIEW',
      description: `Viewed content: "${content.title}"`,
    });

    return res.status(200).json({
      success: true,
      adoption,
    });
  } catch (error) {
    console.error('[recordView] Error:', error);
    return res.status(500).json({ error: 'Failed to record view' });
  }
};

/**
 * adoptContent(req, res)
 * POST /api/churches/:churchId/content/:contentId/adopt
 * Church decides to adopt content
 */
exports.adoptContent = async (req, res) => {
  try {
    const { churchId, contentId } = req.params;
    const { churchNotes } = req.body;
    const userId = req.user.id;

    // Verify content exists and is published
    const content = await NetworkContent.findByPk(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (!content.isPublished) {
      return res.status(400).json({ error: 'Content not published' });
    }

    // Record adoption
    const adoption = await ChurchContentAdoption.recordAdoption(churchId, contentId, userId);

    // Update notes if provided
    if (churchNotes) {
      await adoption.update({ churchNotes });
    }

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_adopted',
      severity: 'info',
      status: 'success',
      userId,
      churchId,
      resourceType: 'church_content_adoption',
      resourceId: adoption.id,
      action: 'ADOPT',
      description: `Adopted content: "${content.title}"`,
      metadata: { contentType: content.contentType },
    });

    return res.status(200).json({
      success: true,
      adoption,
      message: 'Content adopted successfully',
    });
  } catch (error) {
    console.error('[adoptContent] Error:', error);
    return res.status(500).json({ error: 'Failed to adopt content' });
  }
};

/**
 * ignoreContent(req, res)
 * POST /api/churches/:churchId/content/:contentId/ignore
 * Church decides to ignore content
 */
exports.ignoreContent = async (req, res) => {
  try {
    const { churchId, contentId } = req.params;
    const { churchNotes } = req.body;
    const userId = req.user.id;

    // Verify content exists
    const content = await NetworkContent.findByPk(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Record ignore
    const adoption = await ChurchContentAdoption.recordIgnore(churchId, contentId, userId);

    // Update notes if provided
    if (churchNotes) {
      await adoption.update({ churchNotes });
    }

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_ignored',
      severity: 'info',
      status: 'success',
      userId,
      churchId,
      resourceType: 'church_content_adoption',
      resourceId: adoption.id,
      action: 'IGNORE',
      description: `Ignored content: "${content.title}"`,
    });

    return res.status(200).json({
      success: true,
      adoption,
      message: 'Content marked as ignored',
    });
  } catch (error) {
    console.error('[ignoreContent] Error:', error);
    return res.status(500).json({ error: 'Failed to ignore content' });
  }
};

/**
 * updateSharingSettings(req, res)
 * PATCH /api/churches/:churchId/content/:contentId/share
 * Update how church shares content with members
 */
exports.updateSharingSettings = async (req, res) => {
  try {
    const { churchId, contentId } = req.params;
    const { shareWithMembers, shareMethod, churchNotes } = req.body;
    const userId = req.user.id;

    // Verify adoption exists
    let adoption = await ChurchContentAdoption.findOne({
      where: {
        churchId,
        networkContentId: contentId,
      },
    });

    if (!adoption) {
      return res.status(404).json({ error: 'Adoption record not found' });
    }

    // Can only update sharing if adopted
    if (adoption.adoptionStatus !== 'adopted') {
      return res.status(400).json({
        error: 'Can only update sharing for adopted content',
      });
    }

    // Update sharing settings
    const updates = {};
    if (shareWithMembers !== undefined) {
      updates.shareWithMembers = shareWithMembers;
      updates.shareMethod = shareWithMembers ? shareMethod || 'not_shared' : 'not_shared';
      if (shareWithMembers) {
        updates.sharedAt = new Date();
      }
    }
    if (churchNotes !== undefined) {
      updates.churchNotes = churchNotes;
    }

    adoption = await adoption.update(updates);

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_sharing_updated',
      severity: 'info',
      status: 'success',
      userId,
      churchId,
      resourceType: 'church_content_adoption',
      resourceId: adoption.id,
      action: 'UPDATE',
      description: `Updated content sharing: ${shareWithMembers ? 'ON' : 'OFF'}`,
      metadata: { shareMethod, shareWithMembers },
    });

    return res.status(200).json({
      success: true,
      adoption,
      message: 'Sharing settings updated',
    });
  } catch (error) {
    console.error('[updateSharingSettings] Error:', error);
    return res.status(500).json({ error: 'Failed to update sharing settings' });
  }
};

/**
 * archiveContentAdoption(req, res)
 * DELETE /api/churches/:churchId/content/:contentId
 * Archive content adoption (soft delete from church's list)
 */
exports.archiveContentAdoption = async (req, res) => {
  try {
    const { churchId, contentId } = req.params;
    const userId = req.user.id;

    const adoption = await ChurchContentAdoption.findOne({
      where: {
        churchId,
        networkContentId: contentId,
      },
    });

    if (!adoption) {
      return res.status(404).json({ error: 'Adoption record not found' });
    }

    const updated = await adoption.update({
      adoptionStatus: 'archived',
      archivedAt: new Date(),
    });

    // Log event
    await AuditLog.logEvent({
      eventType: 'content_adoption_archived',
      severity: 'info',
      status: 'success',
      userId,
      churchId,
      resourceType: 'church_content_adoption',
      resourceId: adoption.id,
      action: 'ARCHIVE',
      description: 'Archived content adoption',
    });

    return res.status(200).json({
      success: true,
      adoption: updated,
      message: 'Content adoption archived',
    });
  } catch (error) {
    console.error('[archiveContentAdoption] Error:', error);
    return res.status(500).json({ error: 'Failed to archive adoption' });
  }
};
