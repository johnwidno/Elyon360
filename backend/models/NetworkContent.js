/**
 * Network Content Model
 * Represents content published by organizations (networks) for distribution to affiliated churches
 *
 * Content Types: policy, training, announcement, guidelines, template, resource
 * Publication Status: draft, published, archived
 * Lifecycle: Created by org admin → Published to library → Churches view & adopt
 */

'use strict';

module.exports = (sequelize, DataTypes) => {
  const NetworkContent = sequelize.define(
    'NetworkContent',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // Foreign Keys
      networkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'church_networks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        index: true,
        comment: 'Network (Diocese/District) publishing content',
      },

      // Content Metadata
      contentType: {
        type: DataTypes.ENUM('policy', 'training', 'announcement', 'guidelines', 'template', 'resource'),
        allowNull: false,
        defaultValue: 'resource',
        comment: 'Category of content (policy, training, announcement, etc.)',
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Content title visible to churches',
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Brief summary of content',
      },

      // Content Storage
      fileUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL to attached file (PDF, DOCX, etc.)',
      },

      richTextContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Rich text content (HTML) - alternative to file upload',
      },

      // Publication Status
      isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether content is visible to affiliated churches',
      },

      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when content was published',
      },

      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether content is archived (hidden from new church views)',
      },

      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when content was archived',
      },

      // Targeting & Scope
      targetScope: {
        type: DataTypes.ENUM('all_churches', 'selected_churches'),
        defaultValue: 'all_churches',
        comment: 'Whether targeting all affiliated churches or specific ones',
      },

      targetChurchIds: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Array of churchId values if targetScope = selected_churches',
      },

      // Audit Trail
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who created content',
      },

      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who last updated content',
      },

      // Timestamps
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
      modelName: 'NetworkContent',
      tableName: 'network_content',
      timestamps: true,
      underscored: false,
      comment: 'Content published by organizations for affiliated churches',
      indexes: [
        {
          fields: ['networkId'],
          name: 'idx_network_content_networkId',
        },
        {
          fields: ['contentType'],
          name: 'idx_network_content_contentType',
        },
        {
          fields: ['isPublished', 'networkId'],
          name: 'idx_network_content_published',
        },
        {
          fields: ['createdBy'],
          name: 'idx_network_content_createdBy',
        },
      ],
    }
  );

  // Associations
  NetworkContent.associate = (models) => {
    // Belongs to ChurchNetwork (publisher)
    NetworkContent.belongsTo(models.ChurchNetwork, {
      foreignKey: 'networkId',
      as: 'network',
      comment: 'Network that published this content',
    });

    // Belongs to User (creator)
    NetworkContent.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      comment: 'User who created this content',
    });

    // Has many church adoptions
    NetworkContent.hasMany(models.ChurchContentAdoption, {
      foreignKey: 'networkContentId',
      as: 'adoptions',
      comment: 'Churches that have adopted this content',
      onDelete: 'CASCADE',
    });
  };

  // Helper Methods

  /**
   * getPublishedContent(networkId)
   * Get all published content for a network
   */
  NetworkContent.getPublishedContent = async (networkId) => {
    return await NetworkContent.findAll({
      where: {
        networkId,
        isPublished: true,
        isArchived: false,
      },
      order: [['publishedAt', 'DESC']],
    });
  };

  /**
   * getDraftContent(networkId)
   * Get all unpublished (draft) content for a network
   */
  NetworkContent.getDraftContent = async (networkId) => {
    return await NetworkContent.findAll({
      where: {
        networkId,
        isPublished: false,
      },
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * getContentByType(networkId, contentType)
   * Get content filtered by type
   */
  NetworkContent.getContentByType = async (networkId, contentType) => {
    return await NetworkContent.findAll({
      where: {
        networkId,
        contentType,
        isPublished: true,
        isArchived: false,
      },
      order: [['publishedAt', 'DESC']],
    });
  };

  /**
   * publish(contentId)
   * Mark content as published (visible to churches)
   */
  NetworkContent.publish = async (contentId) => {
    return await NetworkContent.update(
      {
        isPublished: true,
        publishedAt: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      {
        where: { id: contentId },
        returning: true,
      }
    );
  };

  /**
   * archive(contentId)
   * Mark content as archived (hidden from new views)
   */
  NetworkContent.archive = async (contentId) => {
    return await NetworkContent.update(
      {
        isArchived: true,
        archivedAt: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      {
        where: { id: contentId },
        returning: true,
      }
    );
  };

  /**
   * getAdoptionStats(contentId)
   * Get adoption statistics for a content piece
   * Returns: {total, adopted, ignored, viewed}
   */
  NetworkContent.getAdoptionStats = async (contentId) => {
    const { ChurchContentAdoption } = sequelize.models;

    const stats = await ChurchContentAdoption.findAll({
      where: { networkContentId: contentId },
      attributes: ['adoptionStatus', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['adoptionStatus'],
      raw: true,
    });

    const result = {
      total: 0,
      viewed: 0,
      adopted: 0,
      ignored: 0,
      archived: 0,
    };

    stats.forEach((stat) => {
      result[stat.adoptionStatus] = parseInt(stat.count, 10);
      result.total += parseInt(stat.count, 10);
    });

    return result;
  };

  return NetworkContent;
};
