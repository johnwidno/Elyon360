'use strict';

/**
 * Model: ChurchContentTypeConfig
 * Purpose: Define configurable content types for each church's portal
 * Table: church_content_type_config (10 columns)
 * Relationships: belongsTo Church
 * Features: Admin-configurable content types, per-church customization, visibility settings
 * Phase: 5a - Church Portal System
 */

module.exports = (sequelize, DataTypes) => {
  const ChurchContentTypeConfig = sequelize.define(
    'ChurchContentTypeConfig',
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
        comment: 'Foreign key: Church that owns this configuration',
      },
      contentTypeName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
          isLowercase: true,
        },
        comment: 'Unique identifier for content type (e.g., "sermon", "announcement")',
      },
      displayName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
        comment: 'User-friendly name displayed in UI (e.g., "Sunday Sermons")',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description of this content type for church admin reference',
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        index: true,
        comment: 'Whether this content type is active and should be displayed',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Display order in portal menus (0 = first)',
      },
      showInPublicPortal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Display in unauthenticated public portal',
      },
      showInMemberPortal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Display in authenticated member portal',
      },
      defaultVisibility: {
        type: DataTypes.ENUM('public', 'members_only', 'private'),
        allowNull: false,
        defaultValue: 'public',
        comment: 'Default visibility when content of this type is created',
      },
      requiresFeaturedImage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether featured image is mandatory for this content type',
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
      modelName: 'ChurchContentTypeConfig',
      tableName: 'church_content_type_config',
      timestamps: true,
      indexes: [
        {
          fields: ['churchId'],
          name: 'idx_contentTypeConfig_churchId',
        },
        {
          fields: ['churchId', 'isEnabled'],
          name: 'idx_contentTypeConfig_churchId_enabled',
        },
      ],
      uniqueKeys: {
        uk_church_contentTypeName: {
          fields: ['churchId', 'contentTypeName'],
        },
      },
    }
  );

  // ============================================================================
  // ASSOCIATIONS
  // ============================================================================

  ChurchContentTypeConfig.associate = (models) => {
    // Config belongs to a Church
    ChurchContentTypeConfig.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  // ============================================================================
  // INSTANCE METHODS
  // ============================================================================

  /**
   * Check if this content type is visible in public portal
   * Returns: true if isEnabled AND showInPublicPortal
   */
  ChurchContentTypeConfig.prototype.isVisiblePublic = function () {
    return this.isEnabled && this.showInPublicPortal;
  };

  /**
   * Check if this content type is visible in member portal
   * Returns: true if isEnabled AND showInMemberPortal
   */
  ChurchContentTypeConfig.prototype.isVisibleMembers = function () {
    return this.isEnabled && this.showInMemberPortal;
  };

  /**
   * Check if this content type is visible in any portal
   * Returns: true if visible in public OR member portal
   */
  ChurchContentTypeConfig.prototype.isVisible = function () {
    return this.isVisiblePublic() || this.isVisibleMembers();
  };

  /**
   * Get portal display order
   * Returns: sortOrder value
   */
  ChurchContentTypeConfig.prototype.getDisplayOrder = function () {
    return this.sortOrder;
  };

  /**
   * Disable this content type
   * Updates: isEnabled = false, returns this
   */
  ChurchContentTypeConfig.prototype.disable = function () {
    this.isEnabled = false;
    return this;
  };

  /**
   * Enable this content type
   * Updates: isEnabled = true, returns this
   */
  ChurchContentTypeConfig.prototype.enable = function () {
    this.isEnabled = true;
    return this;
  };

  /**
   * Update display settings
   * Params: { displayName, description, sortOrder, visibility }
   * Returns: this
   */
  ChurchContentTypeConfig.prototype.updateSettings = function (updates) {
    if (updates.displayName) this.displayName = updates.displayName;
    if (updates.description) this.description = updates.description;
    if (updates.sortOrder !== undefined)
      this.sortOrder = updates.sortOrder;
    if (updates.defaultVisibility)
      this.defaultVisibility = updates.defaultVisibility;
    if (updates.showInPublicPortal !== undefined)
      this.showInPublicPortal = updates.showInPublicPortal;
    if (updates.showInMemberPortal !== undefined)
      this.showInMemberPortal = updates.showInMemberPortal;
    if (updates.requiresFeaturedImage !== undefined)
      this.requiresFeaturedImage = updates.requiresFeaturedImage;
    return this;
  };

  // ============================================================================
  // CLASS METHODS (STATIC)
  // ============================================================================

  /**
   * Get all enabled content types for a church
   * Params: churchId, portalType ('public' | 'members' | 'all')
   * Returns: Array of ChurchContentTypeConfig, sorted by sortOrder
   */
  ChurchContentTypeConfig.getEnabledTypes = async function (
    churchId,
    portalType = 'all'
  ) {
    let where = { churchId, isEnabled: true };

    if (portalType === 'public') {
      where.showInPublicPortal = true;
    } else if (portalType === 'members') {
      where.showInMemberPortal = true;
    }

    return this.findAll({
      where,
      order: [['sortOrder', 'ASC']],
    });
  };

  /**
   * Get all content types for a church (including disabled)
   * Params: churchId
   * Returns: Array of ChurchContentTypeConfig, sorted by sortOrder
   */
  ChurchContentTypeConfig.getAllTypes = async function (churchId) {
    return this.findAll({
      where: { churchId },
      order: [['sortOrder', 'ASC']],
    });
  };

  /**
   * Get a specific content type config by name
   * Params: churchId, contentTypeName
   * Returns: ChurchContentTypeConfig or null
   */
  ChurchContentTypeConfig.getType = async function (churchId, contentTypeName) {
    return this.findOne({
      where: { churchId, contentTypeName },
    });
  };

  /**
   * Create or update a content type config
   * Params: churchId, { contentTypeName, displayName, ...settings }
   * Returns: { config, isNew }
   */
  ChurchContentTypeConfig.upsertType = async function (
    churchId,
    data
  ) {
    const { contentTypeName, ...updates } = data;

    const [config, created] = await this.findOrCreate({
      where: { churchId, contentTypeName },
      defaults: {
        churchId,
        contentTypeName,
        displayName: updates.displayName || contentTypeName,
        ...updates,
      },
    });

    if (!created) {
      // Update existing
      await config.update(updates);
    }

    return { config, isNew: created };
  };

  /**
   * Delete a content type config
   * Params: churchId, contentTypeName
   * Returns: number of destroyed rows
   */
  ChurchContentTypeConfig.deleteType = async function (
    churchId,
    contentTypeName
  ) {
    return this.destroy({
      where: { churchId, contentTypeName },
    });
  };

  /**
   * Reorder content types
   * Params: churchId, orderedTypeNames (array)
   * Returns: Array of updated configs
   */
  ChurchContentTypeConfig.reorderTypes = async function (
    churchId,
    orderedTypeNames
  ) {
    const updates = orderedTypeNames.map((name, index) => ({
      contentTypeName: name,
      sortOrder: index,
    }));

    for (const update of updates) {
      await this.update(
        { sortOrder: update.sortOrder },
        {
          where: {
            churchId,
            contentTypeName: update.contentTypeName,
          },
        }
      );
    }

    return this.getAllTypes(churchId);
  };

  /**
   * Get portal visibility summary for a church
   * Params: churchId
   * Returns: { publicCount, memberCount, totalEnabled, totalAvailable }
   */
  ChurchContentTypeConfig.getVisibilitySummary = async function (churchId) {
    const allTypes = await this.findAll({
      where: { churchId },
      raw: true,
    });

    const publicCount = allTypes.filter(
      (t) => t.isEnabled && t.showInPublicPortal
    ).length;

    const memberCount = allTypes.filter(
      (t) => t.isEnabled && t.showInMemberPortal
    ).length;

    const totalEnabled = allTypes.filter((t) => t.isEnabled).length;

    return {
      publicCount,
      memberCount,
      totalEnabled,
      totalAvailable: allTypes.length,
    };
  };

  /**
   * Initialize default content types for a new church
   * Params: churchId
   * Returns: Array of created configs
   */
  ChurchContentTypeConfig.initializeDefaults = async function (churchId) {
    const defaultTypes = [
      {
        contentTypeName: 'sermon',
        displayName: 'Sermons',
        description: 'Sunday service recordings and transcripts',
        defaultVisibility: 'public',
        requiresFeaturedImage: false,
        sortOrder: 0,
      },
      {
        contentTypeName: 'announcement',
        displayName: 'Announcements',
        description: 'Church announcements and updates',
        defaultVisibility: 'public',
        requiresFeaturedImage: false,
        sortOrder: 1,
      },
      {
        contentTypeName: 'event',
        displayName: 'Events',
        description: 'Church events and activities',
        defaultVisibility: 'public',
        requiresFeaturedImage: true,
        sortOrder: 2,
      },
      {
        contentTypeName: 'blog',
        displayName: 'Blog',
        description: 'Church blog posts and articles',
        defaultVisibility: 'public',
        requiresFeaturedImage: false,
        sortOrder: 3,
      },
      {
        contentTypeName: 'resource',
        displayName: 'Resources',
        description: 'Downloadable resources and documents',
        defaultVisibility: 'members_only',
        requiresFeaturedImage: false,
        sortOrder: 4,
      },
    ];

    const created = [];
    for (const typeData of defaultTypes) {
      const config = await this.create({
        churchId,
        ...typeData,
      });
      created.push(config);
    }

    return created;
  };

  /**
   * Check if a church has any enabled content types
   * Params: churchId
   * Returns: boolean
   */
  ChurchContentTypeConfig.hasEnabledTypes = async function (churchId) {
    const count = await this.count({
      where: { churchId, isEnabled: true },
    });
    return count > 0;
  };

  /**
   * Get total enabled content types for a church
   * Params: churchId
   * Returns: number
   */
  ChurchContentTypeConfig.countEnabledTypes = async function (churchId) {
    return this.count({
      where: { churchId, isEnabled: true },
    });
  };

  return ChurchContentTypeConfig;
};
