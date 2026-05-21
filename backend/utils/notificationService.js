/**
 * Content Notification System
 * Handles notifications when org publishes content to churches
 *
 * Purpose: Notify churches when new content is available from their affiliated networks
 * Methods: Database notifications (in-app), email, push notifications (extensible)
 */

const {
  ChurchNetworkAffiliation,
  ChurchContentAdoption,
  Church,
  ChurchNetwork,
  NetworkContent,
  User,
  AuditLog,
} = require('../models');

/**
 * notifyChurchesOfNewContent(contentId)
 * Send notifications to all churches affiliated with the content's network
 *
 * For each affiliated church:
 * 1. Create notification record (in-app)
 * 2. Log audit event
 * 3. Create adoption record (optional - set to 'available' status)
 */
async function notifyChurchesOfNewContent(contentId) {
  try {
    console.log(`[notifyChurchesOfNewContent] Processing notifications for content ${contentId}`);

    // Get content details
    const content = await NetworkContent.findByPk(contentId, {
      include: [
        {
          model: ChurchNetwork,
          as: 'network',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!content) {
      console.error(`[notifyChurchesOfNewContent] Content ${contentId} not found`);
      return null;
    }

    if (!content.isPublished) {
      console.log(`[notifyChurchesOfNewContent] Content not published, skipping notifications`);
      return null;
    }

    console.log(`[notifyChurchesOfNewContent] Content: "${content.title}" from network: ${content.network.name}`);

    // Get all churches affiliated with this network
    let affiliatedChurches;
    if (content.targetScope === 'all_churches') {
      affiliatedChurches = await ChurchNetworkAffiliation.findAll({
        where: { networkId: content.networkId },
        attributes: ['churchId'],
        raw: true,
      });
    } else if (content.targetScope === 'selected_churches') {
      affiliatedChurches = content.targetChurchIds.map((cId) => ({ churchId: cId }));
    }

    const churchIds = affiliatedChurches.map((a) => a.churchId);
    console.log(
      `[notifyChurchesOfNewContent] Sending to ${churchIds.length} affiliated churches: ${churchIds.join(', ')}`
    );

    // Create adoption records for each church (if not exists)
    const notifications = [];
    for (const churchId of churchIds) {
      try {
        // Check if adoption record already exists
        let adoption = await ChurchContentAdoption.findOne({
          where: {
            churchId,
            networkContentId: contentId,
          },
        });

        if (!adoption) {
          // Create adoption record (church hasn't seen this yet)
          adoption = await ChurchContentAdoption.create({
            churchId,
            networkContentId: contentId,
            adoptionStatus: 'available', // Not 'viewed' yet
            adoptedBy: null,
          });

          console.log(
            `[notifyChurchesOfNewContent] Created adoption record for church ${churchId}, content ${contentId}`
          );
        }

        notifications.push({
          churchId,
          contentId,
          adoptionId: adoption.id,
          status: 'notified',
        });

        // TODO: Send email notification to church admin
        // TODO: Send push notification if enabled
      } catch (error) {
        console.error(
          `[notifyChurchesOfNewContent] Error creating adoption for church ${churchId}:`,
          error
        );
        notifications.push({
          churchId,
          contentId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Log aggregate notification event
    await AuditLog.logEvent({
      eventType: 'content_published_notified',
      severity: 'info',
      status: 'success',
      networkId: content.networkId,
      resourceType: 'network_content',
      resourceId: contentId,
      action: 'NOTIFY',
      description: `Published content to ${churchIds.length} churches`,
      metadata: {
        contentTitle: content.title,
        contentType: content.contentType,
        targetChurches: churchIds.length,
        churchIds,
      },
    });

    console.log(`[notifyChurchesOfNewContent] Completed notification for content ${contentId}`);

    return {
      contentId,
      contentTitle: content.title,
      networkId: content.networkId,
      targetChurches: churchIds.length,
      notifications,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[notifyChurchesOfNewContent] Error:', error);
    throw error;
  }
}

/**
 * sendEmailNotification(churchId, contentId)
 * Send email to church admin about new content
 * (This is a stub - integrate with email service)
 */
async function sendEmailNotification(churchId, contentId) {
  try {
    console.log(`[sendEmailNotification] Preparing email for church ${churchId} about content ${contentId}`);

    // Get church and content details
    const church = await Church.findByPk(churchId, {
      attributes: ['id', 'name', 'email'],
    });

    const content = await NetworkContent.findByPk(contentId, {
      include: [
        {
          model: ChurchNetwork,
          as: 'network',
          attributes: ['name'],
        },
      ],
    });

    if (!church || !content) {
      console.warn('[sendEmailNotification] Church or content not found');
      return null;
    }

    // TODO: Implement actual email sending via email service
    // For now, just log that we would send it
    const emailPayload = {
      to: church.email,
      subject: `New Content from ${content.network.name}: ${content.title}`,
      template: 'content-published-notification',
      context: {
        churchName: church.name,
        contentTitle: content.title,
        contentType: content.contentType,
        networkName: content.network.name,
        viewUrl: `https://${church.slug}.elyonsys.com/content/available/${contentId}`,
      },
    };

    console.log('[sendEmailNotification] Email would be sent with payload:', emailPayload);

    return emailPayload;
  } catch (error) {
    console.error('[sendEmailNotification] Error:', error);
    throw error;
  }
}

/**
 * sendPushNotification(churchId, contentId)
 * Send push notification to church admin mobile app
 * (This is a stub - integrate with push notification service)
 */
async function sendPushNotification(churchId, contentId) {
  try {
    console.log(`[sendPushNotification] Preparing push notification for church ${churchId}`);

    const content = await NetworkContent.findByPk(contentId, {
      include: [
        {
          model: ChurchNetwork,
          as: 'network',
          attributes: ['name'],
        },
      ],
    });

    if (!content) {
      console.warn('[sendPushNotification] Content not found');
      return null;
    }

    // TODO: Implement actual push notification via FCM, APNs, etc.
    const pushPayload = {
      churchId,
      contentId,
      title: `New Content: ${content.title}`,
      body: `${content.network.name} shared: ${content.title}`,
      data: {
        contentType: content.contentType,
        contentId: contentId.toString(),
      },
    };

    console.log('[sendPushNotification] Push notification would be sent with payload:', pushPayload);

    return pushPayload;
  } catch (error) {
    console.error('[sendPushNotification] Error:', error);
    throw error;
  }
}

/**
 * getUnreadNotifications(churchId)
 * Get content that a church hasn't acted on yet
 * (content with adoptionStatus = 'available')
 */
async function getUnreadNotifications(churchId) {
  try {
    console.log(`[getUnreadNotifications] Fetching unread notifications for church ${churchId}`);

    const unread = await ChurchContentAdoption.findAll({
      where: {
        churchId,
        adoptionStatus: 'available', // Not yet viewed/acted on
      },
      include: [
        {
          model: NetworkContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType', 'description', 'publishedAt', 'networkId'],
          include: [
            {
              model: ChurchNetwork,
              as: 'network',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return unread;
  } catch (error) {
    console.error('[getUnreadNotifications] Error:', error);
    throw error;
  }
}

/**
 * markNotificationAsRead(churchId, contentId)
 * Mark a notification as read (update adoptionStatus to 'viewed')
 */
async function markNotificationAsRead(churchId, contentId) {
  try {
    console.log(`[markNotificationAsRead] Marking content ${contentId} as read for church ${churchId}`);

    const adoption = await ChurchContentAdoption.findOne({
      where: {
        churchId,
        networkContentId: contentId,
      },
    });

    if (!adoption) {
      console.warn(
        `[markNotificationAsRead] No adoption record found for church ${churchId}, content ${contentId}`
      );
      return null;
    }

    if (adoption.adoptionStatus !== 'available') {
      console.log(`[markNotificationAsRead] Already marked as ${adoption.adoptionStatus}`);
      return adoption;
    }

    return await adoption.update({
      adoptionStatus: 'viewed',
      viewedAt: new Date(),
    });
  } catch (error) {
    console.error('[markNotificationAsRead] Error:', error);
    throw error;
  }
}

/**
 * getNotificationStats(churchId)
 * Get notification statistics for a church
 */
async function getNotificationStats(churchId) {
  try {
    console.log(`[getNotificationStats] Fetching notification stats for church ${churchId}`);

    const stats = await ChurchContentAdoption.findAll({
      where: { churchId },
      attributes: ['adoptionStatus', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      group: ['adoptionStatus'],
      raw: true,
    });

    const result = {
      total: 0,
      available: 0, // Unread
      viewed: 0, // Read but not adopted
      adopted: 0,
      ignored: 0,
      archived: 0,
    };

    stats.forEach((stat) => {
      if (result.hasOwnProperty(stat.adoptionStatus)) {
        result[stat.adoptionStatus] = parseInt(stat.count, 10);
      }
      result.total += parseInt(stat.count, 10);
    });

    return result;
  } catch (error) {
    console.error('[getNotificationStats] Error:', error);
    throw error;
  }
}

module.exports = {
  notifyChurchesOfNewContent,
  sendEmailNotification,
  sendPushNotification,
  getUnreadNotifications,
  markNotificationAsRead,
  getNotificationStats,
};
