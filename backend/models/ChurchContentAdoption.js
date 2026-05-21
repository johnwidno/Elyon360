/**
 * Church Content Adoption Model
 * Tracks whether and how churches adopt content published by their affiliated networks
 *
 * Adoption Statuses: viewed, adopted, ignored, archived
 * Church Decision: Independent, per-content basis
 * Sharing: Church decides if they want to share with their own members
 */

'use strict';

module.exports = (sequelize, DataTypes) => {
  const ChurchContentAdoption = sequelize.define(
    'ChurchContentAdoption',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // Foreign Keys
      churchId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'churches',
          key: 'id',
        },
        onDelete: 'CASCADE',
        index: true,
        comment: 'Church making adoption decision',
      },

      networkContentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'network_content',
          key: 'id',
        },
        onDelete: 'CASCADE',
        index: true,
        comment: 'Content published by network',
      },

      // Adoption Status
      adoptionStatus: {
        type: DataTypes.ENUM('viewed', 'adopted', 'ignored', 'archived'),
        allowNull: false,
        defaultValue: 'viewed',
        comment: 'Church adoption status (viewed, adopted, ignored, archived)',
      },

      // Sharing Decision
      shareWithMembers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether church is sharing this content with members',
      },

      shareMethod: {
        type: DataTypes.ENUM('not_shared', 'website', 'newsletter', 'announcement', 'download_link'),
        defaultValue: 'not_shared',
        comment: 'How church is sharing content (if shareWithMembers = true)',
      },

      // Audit Trail
      adoptedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who made adoption decision',
      },

      // Timestamps for Lifecycle
      viewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When church admin first viewed this content',
      },

      adoptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When church decided to adopt content',
      },

      sharedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When church started sharing with members',
      },

      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When church archived/removed from active display',
      },

      // Notes & Custom Data
      churchNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Internal notes about adoption decision',
      },

      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Flexible field for custom adoption tracking',
      },

      // System Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'),
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      sequelize,
      modelName: 'ChurchContentAdoption',
      tableName: 'church_content_adoption',
      timestamps: true,
      underscored: false,
      comment: 'Tracks church adoption decisions for network-published content',
      indexes: [
        {
          fields: ['churchId'],
          name: 'idx_church_adoption_churchId',
        },
        {
          fields: ['networkContentId'],
          name: 'idx_church_adoption_contentId',
        },
        {
          fields: ['churchId', 'networkContentId'],
          unique: true,
          name: 'idx_church_adoption_unique',
          comment: 'One adoption record per church per content',
        },
        {
          fields: ['adoptionStatus'],
          name: 'idx_church_adoption_status',
        },
        {
          fields: ['shareWithMembers'],
          name: 'idx_church_adoption_sharing',
        },
      ],
    }
  );

  // Associations
  ChurchContentAdoption.associate = (models) => {
    // Belongs to Church (adopter)
    ChurchContentAdoption.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
      comment: 'Church making adoption decision',
    });

    // Belongs to NetworkContent
    ChurchContentAdoption.belongsTo(models.NetworkContent, {
      foreignKey: 'networkContentId',
      as: 'content',
      comment: 'Network content being adopted',
    });

    // Belongs to User (who made decision)
    ChurchContentAdoption.belongsTo(models.User, {
      foreignKey: 'adoptedBy',
      as: 'adoptedByUser',
      comment: 'User who made adoption decision',
    });
  };

  // Helper Methods

  /**
   * getChurchAdoptedContent(churchId)
   * Get all content a church has adopted
   */
  ChurchContentAdoption.getChurchAdoptedContent = async (churchId) => {
    return await ChurchContentAdoption.findAll({
      where: {
        churchId,
        adoptionStatus: 'adopted',
      },
      include: [
        {
          model: sequelize.models.NetworkContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType', 'description', 'fileUrl', 'publishedAt'],
        },
      ],
      order: [['adoptedAt', 'DESC']],
    });
  };

  /**
   * getChurchAvailableContent(churchId)
   * Get all content available to a church (from affiliated networks) that hasn't been viewed
   */
  ChurchContentAdoption.getChurchAvailableContent = async (churchId) => {
    const { ChurchNetworkAffiliation, NetworkContent } = sequelize.models;

    // Get churches affiliated networks
    const affiliations = await ChurchNetworkAffiliation.findAll({
      where: { churchId },
      attributes: ['networkId'],
    });

    const networkIds = affiliations.map((a) => a.networkId);

    if (networkIds.length === 0) {
      return [];
    }

    // Get published content from those networks
    const availableContent = await NetworkContent.findAll({
      where: {
        networkId: { [sequelize.Sequelize.Op.in]: networkIds },
        isPublished: true,
        isArchived: false,
      },
      order: [['publishedAt', 'DESC']],
    });

    // Get this church's adoption records
    const churchAdoptions = await ChurchContentAdoption.findAll({
      where: {
        churchId,
        networkContentId: {
          [sequelize.Sequelize.Op.in]: availableContent.map((c) => c.id),
        },
      },
      attributes: ['networkContentId', 'adoptionStatus'],
      raw: true,
    });

    const adoptionMap = {};
    churchAdoptions.forEach((a) => {
      adoptionMap[a.networkContentId] = a.adoptionStatus;
    });

    // Return content with adoption status
    return availableContent.map((content) => ({
      ...content.toJSON(),
      adoptionStatus: adoptionMap[content.id] || 'available',
    }));
  };

  /**
   * getChurchSharedContent(churchId)
   * Get content church is actively sharing with members
   */
  ChurchContentAdoption.getChurchSharedContent = async (churchId) => {
    return await ChurchContentAdoption.findAll({
      where: {
        churchId,
        shareWithMembers: true,
        adoptionStatus: ['adopted', 'archived'],
      },
      include: [
        {
          model: sequelize.models.NetworkContent,
          as: 'content',
          attributes: ['id', 'title', 'contentType', 'description', 'fileUrl', 'publishedAt'],
        },
      ],
      order: [['sharedAt', 'DESC']],
    });
  };

  /**
   * recordView(churchId, contentId, userId)
   * Record when church admin first views content
   */
  ChurchContentAdoption.recordView = async (churchId, contentId, userId) => {
    let adoption = await ChurchContentAdoption.findOne({
      where: { churchId, networkContentId: contentId },
    });

    if (!adoption) {
      adoption = await ChurchContentAdoption.create({
        churchId,
        networkContentId: contentId,
        adoptionStatus: 'viewed',
        adoptedBy: userId,
        viewedAt: sequelize.literal('CURRENT_TIMESTAMP'),
      });
    } else if (!adoption.viewedAt) {
      adoption = await adoption.update({
        viewedAt: sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }

    return adoption;
  };

  /**
   * recordAdoption(churchId, contentId, userId)
   * Record when church decides to adopt content
   */
  ChurchContentAdoption.recordAdoption = async (churchId, contentId, userId) => {
    let adoption = await ChurchContentAdoption.findOne({
      where: { churchId, networkContentId: contentId },
    });

    if (!adoption) {
      adoption = await ChurchContentAdoption.create({
        churchId,
        networkContentId: contentId,
        adoptionStatus: 'adopted',
        adoptedBy: userId,
        adoptedAt: sequelize.literal('CURRENT_TIMESTAMP'),
        viewedAt: sequelize.literal('CURRENT_TIMESTAMP'),
      });
    } else {
      adoption = await adoption.update({
        adoptionStatus: 'adopted',
        adoptedAt: sequelize.literal('CURRENT_TIMESTAMP'),
        adoptedBy: userId,
      });
    }

    return adoption;
  };

  /**
   * recordIgnore(churchId, contentId, userId)
   * Record when church decides to ignore content
   */
  ChurchContentAdoption.recordIgnore = async (churchId, contentId, userId) => {
    let adoption = await ChurchContentAdoption.findOne({
      where: { churchId, networkContentId: contentId },
    });

    if (!adoption) {
      adoption = await ChurchContentAdoption.create({
        churchId,
        networkContentId: contentId,
        adoptionStatus: 'ignored',
        adoptedBy: userId,
        viewedAt: sequelize.literal('CURRENT_TIMESTAMP'),
      });
    } else {
      adoption = await adoption.update({
        adoptionStatus: 'ignored',
        adoptedBy: userId,
      });
    }

    return adoption;
  };

  /**
   * updateSharingStatus(churchId, contentId, shareWithMembers, shareMethod)
   * Update how/whether church shares content with members
   */
  ChurchContentAdoption.updateSharingStatus = async (
    churchId,
    contentId,
    shareWithMembers,
    shareMethod = 'not_shared'
  ) => {
    const adoption = await ChurchContentAdoption.findOne({
      where: { churchId, networkContentId: contentId },
    });

    if (!adoption) {
      throw new Error(
        `Adoption record not found for church ${churchId}, content ${contentId}`
      );
    }

    return await adoption.update({
      shareWithMembers,
      shareMethod: shareWithMembers ? shareMethod : 'not_shared',
      sharedAt: shareWithMembers ? sequelize.literal('CURRENT_TIMESTAMP') : null,
    });
  };

  /**
   * getAdoptionStatsForChurch(churchId)
   * Get adoption statistics for a church
   * Returns: {total, adopted, ignored, viewed, shared}
   */
  ChurchContentAdoption.getAdoptionStatsForChurch = async (churchId) => {
    const stats = await ChurchContentAdoption.findAll({
      where: { churchId },
      attributes: [
        'adoptionStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
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

    // Count shared content
    const sharedCount = await ChurchContentAdoption.count({
      where: {
        churchId,
        shareWithMembers: true,
      },
    });

    result.shared = sharedCount;

    return result;
  };

  return ChurchContentAdoption;
};
