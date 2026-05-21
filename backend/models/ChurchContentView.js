'use strict';

/**
 * Model: ChurchContentView
 * Purpose: Track portal content views for analytics (anonymous + authenticated visitors)
 * Table: church_content_views (7 columns)
 * Relationships: belongsTo ChurchContent, belongsTo Church, belongsTo User (optional)
 * Features: Anonymous visitor fingerprinting, view tracking, referrer tracking
 * Phase: 5a - Church Portal System
 */

module.exports = (sequelize, DataTypes) => {
  const ChurchContentView = sequelize.define(
    'ChurchContentView',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      churchContentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'church_content',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Foreign key: Content that was viewed',
      },
      churchId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'churches',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Foreign key: Church (denormalized for faster queries)',
      },
      visitorFingerprint: {
        type: DataTypes.STRING(255),
        allowNull: true,
        index: true,
        comment: 'Anonymous visitor fingerprint (device/browser hash for anonymous users)',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        index: true,
        comment: 'Foreign key: User who viewed (if authenticated)',
      },
      referrerUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'HTTP referrer URL (where visitor came from)',
      },
      viewedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        index: true,
        comment: 'When the view occurred',
      },
    },
    {
      sequelize,
      modelName: 'ChurchContentView',
      tableName: 'church_content_views',
      timestamps: false, // Only viewedAt, no createdAt/updatedAt
      indexes: [
        {
          fields: ['churchContentId'],
          name: 'idx_views_contentId',
        },
        {
          fields: ['churchContentId', 'viewedAt'],
          name: 'idx_views_contentId_viewedAt',
        },
        {
          fields: ['churchId'],
          name: 'idx_views_churchId',
        },
        {
          fields: ['churchId', 'viewedAt'],
          name: 'idx_views_churchId_viewedAt',
        },
        {
          fields: ['visitorFingerprint'],
          name: 'idx_views_visitorFingerprint',
        },
        {
          fields: ['userId'],
          name: 'idx_views_userId',
        },
      ],
    }
  );

  // ============================================================================
  // ASSOCIATIONS
  // ============================================================================

  ChurchContentView.associate = (models) => {
    // View belongs to Content
    ChurchContentView.belongsTo(models.ChurchContent, {
      foreignKey: 'churchContentId',
      as: 'content',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // View belongs to Church
    ChurchContentView.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // View belongs to User (optional - can be anonymous)
    ChurchContentView.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  // ============================================================================
  // INSTANCE METHODS
  // ============================================================================

  /**
   * Check if view is from authenticated user
   * Returns: true if userId is set
   */
  ChurchContentView.prototype.isAuthenticated = function () {
    return this.userId !== null;
  };

  /**
   * Check if view is from anonymous visitor
   * Returns: true if visitorFingerprint is set
   */
  ChurchContentView.prototype.isAnonymous = function () {
    return this.visitorFingerprint !== null;
  };

  /**
   * Get view source summary
   * Returns: string ('authenticated', 'anonymous', 'unknown')
   */
  ChurchContentView.prototype.getViewSource = function () {
    if (this.isAuthenticated()) return 'authenticated';
    if (this.isAnonymous()) return 'anonymous';
    return 'unknown';
  };

  /**
   * Get referrer domain
   * Returns: domain string or null
   */
  ChurchContentView.prototype.getReferrerDomain = function () {
    if (!this.referrerUrl) return null;
    try {
      const url = new URL(this.referrerUrl);
      return url.hostname;
    } catch {
      return null;
    }
  };

  /**
   * Format view for analytics display
   * Returns: { source, date, referrer, user }
   */
  ChurchContentView.prototype.toAnalytics = function () {
    return {
      id: this.id,
      viewedAt: this.viewedAt,
      source: this.getViewSource(),
      referrer: this.referrerUrl,
      referrerDomain: this.getReferrerDomain(),
      userId: this.userId,
      visitorFingerprint: this.visitorFingerprint,
    };
  };

  // ============================================================================
  // CLASS METHODS (STATIC)
  // ============================================================================

  /**
   * Record a new content view
   * Params: { churchId, churchContentId, userId, visitorFingerprint, referrerUrl }
   * Returns: Created ChurchContentView
   */
  ChurchContentView.recordView = async function (viewData) {
    return this.create({
      churchId: viewData.churchId,
      churchContentId: viewData.churchContentId,
      userId: viewData.userId || null,
      visitorFingerprint: viewData.visitorFingerprint || null,
      referrerUrl: viewData.referrerUrl || null,
      viewedAt: new Date(),
    });
  };

  /**
   * Get view count for content
   * Params: churchContentId
   * Returns: number
   */
  ChurchContentView.getViewCount = async function (churchContentId) {
    return this.count({
      where: { churchContentId },
    });
  };

  /**
   * Get unique visitor count for content
   * Combines authenticated users + anonymous fingerprints
   * Params: churchContentId
   * Returns: number
   */
  ChurchContentView.getUniqueVisitorCount = async function (churchContentId) {
    const authenticatedUsers = await this.count({
      where: {
        churchContentId,
        userId: { [sequelize.Op.not]: null },
      },
      distinct: true,
      col: 'userId',
    });

    const anonymousVisitors = await this.count({
      where: {
        churchContentId,
        visitorFingerprint: { [sequelize.Op.not]: null },
      },
      distinct: true,
      col: 'visitorFingerprint',
    });

    return authenticatedUsers + anonymousVisitors;
  };

  /**
   * Get recent views for content
   * Params: churchContentId, limit, offset
   * Returns: Array of ChurchContentView
   */
  ChurchContentView.getRecentViews = async function (
    churchContentId,
    limit = 20,
    offset = 0
  ) {
    return this.findAll({
      where: { churchContentId },
      order: [['viewedAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
    });
  };

  /**
   * Get views for a church (all content)
   * Params: churchId, limit, offset, dateRange
   * Returns: Array of ChurchContentView
   */
  ChurchContentView.getChurchViews = async function (
    churchId,
    limit = 20,
    offset = 0,
    dateRange = null
  ) {
    const where = { churchId };

    if (dateRange) {
      if (dateRange.startDate) {
        where.viewedAt = { [sequelize.Op.gte]: dateRange.startDate };
      }
      if (dateRange.endDate) {
        if (where.viewedAt) {
          where.viewedAt[sequelize.Op.lte] = dateRange.endDate;
        } else {
          where.viewedAt = { [sequelize.Op.lte]: dateRange.endDate };
        }
      }
    }

    return this.findAll({
      where,
      order: [['viewedAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.ChurchContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType'],
        },
      ],
    });
  };

  /**
   * Get view statistics for a church
   * Params: churchId, dateRange
   * Returns: { totalViews, uniqueVisitors, viewsPerDay, topContent }
   */
  ChurchContentView.getChurchStatistics = async function (
    churchId,
    dateRange = null
  ) {
    const where = { churchId };

    if (dateRange) {
      if (dateRange.startDate) {
        where.viewedAt = { [sequelize.Op.gte]: dateRange.startDate };
      }
      if (dateRange.endDate) {
        if (where.viewedAt) {
          where.viewedAt[sequelize.Op.lte] = dateRange.endDate;
        } else {
          where.viewedAt = { [sequelize.Op.lte]: dateRange.endDate };
        }
      }
    }

    // Total views
    const totalViews = await this.count({ where });

    // Unique visitors (authenticated + anonymous)
    const uniqueUsers = await this.count({
      where: { ...where, userId: { [sequelize.Op.not]: null } },
      distinct: true,
      col: 'userId',
    });

    const uniqueAnonymous = await this.count({
      where: { ...where, visitorFingerprint: { [sequelize.Op.not]: null } },
      distinct: true,
      col: 'visitorFingerprint',
    });

    const uniqueVisitors = uniqueUsers + uniqueAnonymous;

    // Views per day (last 7 days)
    const viewsPerDay = await this.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('viewedAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where,
      group: [sequelize.fn('DATE', sequelize.col('viewedAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('viewedAt')), 'DESC']],
      limit: 7,
      raw: true,
    });

    // Top content by views
    const topContent = await this.findAll({
      attributes: [
        'churchContentId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'viewCount'],
      ],
      where,
      group: ['churchContentId'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
      include: [
        {
          model: sequelize.models.ChurchContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType'],
          required: true,
        },
      ],
    });

    return {
      totalViews,
      uniqueVisitors,
      authenticatedVisitors: uniqueUsers,
      anonymousVisitors: uniqueAnonymous,
      viewsPerDay,
      topContent,
    };
  };

  /**
   * Get views by referrer source
   * Params: churchId, limit
   * Returns: Array of { referrer, count }
   */
  ChurchContentView.getViewsByReferrer = async function (churchId, limit = 10) {
    return this.findAll({
      attributes: [
        'referrerUrl',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        churchId,
        referrerUrl: { [sequelize.Op.not]: null },
      },
      group: ['referrerUrl'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit,
      raw: true,
    });
  };

  /**
   * Get views by content type
   * Params: churchId
   * Returns: Array of { contentType, viewCount }
   */
  ChurchContentView.getViewsByContentType = async function (churchId) {
    return this.findAll({
      attributes: [
        [sequelize.col('content.contentType'), 'contentType'],
        [sequelize.fn('COUNT', sequelize.col('ChurchContentView.id')), 'viewCount'],
      ],
      where: { churchId },
      include: [
        {
          model: sequelize.models.ChurchContent,
          as: 'content',
          attributes: [],
          required: true,
        },
      ],
      group: [sequelize.col('content.contentType')],
      raw: true,
    });
  };

  /**
   * Clean up old views (older than N days)
   * Params: daysToKeep (default 90)
   * Returns: number of deleted rows
   */
  ChurchContentView.cleanupOldViews = async function (daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return this.destroy({
      where: {
        viewedAt: { [sequelize.Op.lt]: cutoffDate },
      },
    });
  };

  /**
   * Get average views per content for a church
   * Params: churchId
   * Returns: { totalContent, totalViews, averageViews }
   */
  ChurchContentView.getAverageViewsPerContent = async function (churchId) {
    const stats = await this.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalViews'],
      ],
      where: { churchId },
      raw: true,
    });

    const totalViews = stats[0].totalViews || 0;

    const contentCount = await sequelize.models.ChurchContent.count({
      where: { churchId, isArchived: false },
    });

    const averageViews = contentCount > 0 ? totalViews / contentCount : 0;

    return {
      totalContent: contentCount,
      totalViews,
      averageViews: parseFloat(averageViews.toFixed(2)),
    };
  };

  return ChurchContentView;
};
