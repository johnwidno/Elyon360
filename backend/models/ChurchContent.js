'use strict';

/**
 * Model: ChurchContent
 * Purpose: Represents content published on a church's public portal
 * Table: church_content (18 columns)
 * Relationships: belongsTo Church, belongsTo User (createdBy, updatedBy), hasMany ChurchContentView
 * Features: Slug-based URLs, visibility control, SEO metadata, role-based access
 * Phase: 5a - Church Portal System
 */

module.exports = (sequelize, DataTypes) => {
  const ChurchContent = sequelize.define(
    'ChurchContent',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
        comment: 'Foreign key: Church that owns this content',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 255],
        },
        comment: 'Content title (e.g., "Sunday Service Recording")',
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
        comment: 'URL-friendly slug (e.g., "sunday-service-recording")',
      },
      contentType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Type of content (e.g., "sermon", "announcement", "event", "blog")',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Optional category grouping within content type',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of tags for discovery (e.g., ["prayer", "healing"])',
      },
      visibility: {
        type: DataTypes.ENUM('public', 'members_only', 'private'),
        allowNull: false,
        defaultValue: 'public',
        comment: 'public=unauthenticated, members_only=church members, private=admin only',
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        index: true,
        comment: 'Soft delete flag (archived content hidden from portal)',
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When content was published (null = draft)',
      },
      richTextContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'HTML/Markdown rich text content body',
      },
      featuredImageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
        comment: 'URL to featured image for content card display',
      },
      attachmentUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
        comment: 'URL to downloadable attachment (PDF, document, etc.)',
      },
      requiredRoles: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of role names required to view (empty = no restriction)',
      },
      metaTitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'SEO meta title (default: title if not set)',
      },
      metaDescription: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'SEO meta description for search results',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'User ID who created this content',
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'User ID who last updated this content',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ChurchContent',
      tableName: 'church_content',
      timestamps: true,
      paranoid: false, // Using isArchived flag instead of paranoid
      indexes: [
        {
          fields: ['churchId'],
          name: 'idx_content_churchId',
        },
        {
          fields: ['churchId', 'visibility'],
          name: 'idx_content_churchId_visibility',
        },
        {
          fields: ['visibility', 'publishedAt'],
          name: 'idx_content_visibility_publishedAt',
        },
        {
          fields: ['contentType'],
          name: 'idx_content_contentType',
        },
      ],
      uniqueKeys: {
        uk_church_content_slug: {
          fields: ['churchId', 'slug'],
        },
      },
    }
  );

  // ============================================================================
  // ASSOCIATIONS
  // ============================================================================

  ChurchContent.associate = (models) => {
    // Content belongs to a Church
    ChurchContent.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Content belongs to User (who created it)
    ChurchContent.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Content belongs to User (who last updated it)
    ChurchContent.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Content has many Views
    ChurchContent.hasMany(models.ChurchContentView, {
      foreignKey: 'churchContentId',
      as: 'views',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  // ============================================================================
  // INSTANCE METHODS
  // ============================================================================

  /**
   * Get the SEO title for this content
   * Returns: metaTitle if set, otherwise title
   */
  ChurchContent.prototype.getSeoTitle = function () {
    return this.metaTitle || this.title;
  };

  /**
   * Get the SEO description for this content
   * Returns: metaDescription if set, otherwise truncated richTextContent
   */
  ChurchContent.prototype.getSeoDescription = function () {
    if (this.metaDescription) return this.metaDescription;

    // Generate from content (strip HTML, truncate to 160 chars)
    if (this.richTextContent) {
      const plainText = this.richTextContent
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return plainText.substring(0, 160);
    }
    return '';
  };

  /**
   * Check if content is published
   * Returns: true if publishedAt is set and not archived
   */
  ChurchContent.prototype.isPublished = function () {
    return this.publishedAt !== null && !this.isArchived;
  };

  /**
   * Check if content is a draft
   * Returns: true if publishedAt is null
   */
  ChurchContent.prototype.isDraft = function () {
    return this.publishedAt === null;
  };

  /**
   * Check if user can view this content
   * Params: user object with roles array, churchId
   * Returns: true if visibility allows AND requiredRoles is satisfied
   */
  ChurchContent.prototype.canUserView = function (user) {
    // If archived, only allow editors/admins
    if (this.isArchived) {
      return user.roles && user.roles.includes('admin');
    }

    // Check visibility
    if (this.visibility === 'private') {
      return false; // Private content not viewable
    }

    if (this.visibility === 'members_only') {
      // Check if user is from this church
      if (!user || user.churchId !== this.churchId) {
        return false;
      }
    }

    // Check required roles
    if (
      this.requiredRoles &&
      this.requiredRoles.length > 0 &&
      user &&
      user.roles
    ) {
      return this.requiredRoles.some((role) => user.roles.includes(role));
    }

    return true;
  };

  /**
   * Mark content as published
   * Updates: publishedAt to current date, returns this
   */
  ChurchContent.prototype.publish = function () {
    this.publishedAt = new Date();
    return this;
  };

  /**
   * Mark content as archived (soft delete)
   * Updates: isArchived = true, returns this
   */
  ChurchContent.prototype.archive = function () {
    this.isArchived = true;
    return this;
  };

  /**
   * Get view statistics for this content
   * Params: { limit, offset }
   * Returns: { totalViews, uniqueVisitors, recentViews }
   */
  ChurchContent.prototype.getViewStats = async function (options = {}) {
    const { limit = 10, offset = 0 } = options;

    // Total views
    const totalViews = await this.countViews();

    // Unique visitors (from views with visitorFingerprint)
    const uniqueVisitors = await sequelize.models.ChurchContentView.count({
      where: {
        churchContentId: this.id,
        visitorFingerprint: { [sequelize.Op.ne]: null },
      },
      distinct: true,
      col: 'visitorFingerprint',
    });

    // Recent views
    const recentViews = await this.getViews({
      order: [['viewedAt', 'DESC']],
      limit,
      offset,
    });

    return {
      totalViews,
      uniqueVisitors,
      recentViews,
    };
  };

  /**
   * Create URL-friendly slug from title
   * Static method: Used during content creation
   */
  ChurchContent.createSlug = function (title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // ============================================================================
  // CLASS METHODS (STATIC)
  // ============================================================================

  /**
   * Get all active (published, non-archived) content for a church
   * Params: churchId, contentType (optional), limit, offset
   * Returns: Array of ChurchContent
   */
  ChurchContent.getActiveContent = async function (
    churchId,
    contentType = null,
    limit = 20,
    offset = 0
  ) {
    const where = {
      churchId,
      isArchived: false,
      publishedAt: { [sequelize.Op.not]: null },
    };

    if (contentType) {
      where.contentType = contentType;
    }

    return this.findAll({
      where,
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
  };

  /**
   * Get public content for a church (visibility = 'public')
   * Params: churchId, limit, offset
   * Returns: Array of ChurchContent
   */
  ChurchContent.getPublicContent = async function (
    churchId,
    limit = 20,
    offset = 0
  ) {
    return this.findAll({
      where: {
        churchId,
        isArchived: false,
        publishedAt: { [sequelize.Op.not]: null },
        visibility: 'public',
      },
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
    });
  };

  /**
   * Get member-only content for a church
   * Params: churchId, limit, offset
   * Returns: Array of ChurchContent
   */
  ChurchContent.getMembersOnlyContent = async function (
    churchId,
    limit = 20,
    offset = 0
  ) {
    return this.findAll({
      where: {
        churchId,
        isArchived: false,
        publishedAt: { [sequelize.Op.not]: null },
        visibility: ['public', 'members_only'], // Both public and members_only
      },
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
    });
  };

  /**
   * Get content by type for a church
   * Params: churchId, contentType, limit, offset
   * Returns: Array of ChurchContent
   */
  ChurchContent.getContentByType = async function (
    churchId,
    contentType,
    limit = 20,
    offset = 0
  ) {
    return this.getActiveContent(churchId, contentType, limit, offset);
  };

  /**
   * Search content by title or tags
   * Params: churchId, searchTerm, limit, offset
   * Returns: Array of ChurchContent
   */
  ChurchContent.searchContent = async function (
    churchId,
    searchTerm,
    limit = 20,
    offset = 0
  ) {
    return this.findAll({
      where: {
        churchId,
        isArchived: false,
        [sequelize.Op.or]: [
          { title: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
          { richTextContent: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
          sequelize.where(
            sequelize.fn('array_to_string', sequelize.col('tags'), ','),
            sequelize.Op.iLike,
            `%${searchTerm}%`
          ),
        ],
      },
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
    });
  };

  /**
   * Get draft content for a church (unpublished)
   * Params: churchId, limit, offset
   * Returns: Array of ChurchContent
   */
  ChurchContent.getDraftContent = async function (
    churchId,
    limit = 20,
    offset = 0
  ) {
    return this.findAll({
      where: {
        churchId,
        publishedAt: null,
        isArchived: false,
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  };

  /**
   * Get content analytics for a church
   * Params: churchId
   * Returns: { totalContent, publishedCount, draftCount, viewStats, contentByType }
   */
  ChurchContent.getContentAnalytics = async function (churchId) {
    const totalContent = await this.count({
      where: { churchId },
    });

    const publishedCount = await this.count({
      where: {
        churchId,
        isArchived: false,
        publishedAt: { [sequelize.Op.not]: null },
      },
    });

    const draftCount = await this.count({
      where: {
        churchId,
        publishedAt: null,
        isArchived: false,
      },
    });

    // Content by type
    const contentByType = await this.findAll({
      attributes: [
        'contentType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { churchId, isArchived: false },
      group: ['contentType'],
      raw: true,
    });

    // Total views
    const viewStats = await sequelize.models.ChurchContentView.findAll({
      attributes: [
        'churchContentId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'viewCount'],
      ],
      where: { churchId },
      group: ['churchContentId'],
      raw: true,
      limit: 5,
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
    });

    return {
      totalContent,
      publishedCount,
      draftCount,
      contentByType,
      topContent: viewStats,
    };
  };

  return ChurchContent;
};
