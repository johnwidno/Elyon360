'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create network_content table
    await queryInterface.createTable('network_content', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      networkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'church_networks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Network (Diocese/District) publishing content',
      },
      contentType: {
        type: Sequelize.ENUM('policy', 'training', 'announcement', 'guidelines', 'template', 'resource'),
        allowNull: false,
        defaultValue: 'resource',
        comment: 'Category of content',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Content title visible to churches',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Brief summary of content',
      },
      fileUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL to attached file (PDF, DOCX, etc.)',
      },
      richTextContent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Rich text content (HTML) - alternative to file upload',
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether content is visible to affiliated churches',
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when content was published',
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether content is archived',
      },
      archivedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when content was archived',
      },
      targetScope: {
        type: Sequelize.ENUM('all_churches', 'selected_churches'),
        defaultValue: 'all_churches',
        comment: 'Targeting scope',
      },
      targetChurchIds: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'Array of churchId values if targetScope = selected_churches',
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who created content',
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who last updated content',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Indexes for network_content
    await queryInterface.addIndex('network_content', ['networkId'], {
      name: 'idx_network_content_networkId',
    });
    await queryInterface.addIndex('network_content', ['contentType'], {
      name: 'idx_network_content_contentType',
    });
    await queryInterface.addIndex('network_content', ['isPublished', 'networkId'], {
      name: 'idx_network_content_published',
    });
    await queryInterface.addIndex('network_content', ['createdBy'], {
      name: 'idx_network_content_createdBy',
    });

    // Create church_content_adoption table
    await queryInterface.createTable('church_content_adoption', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      churchId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'churches',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Church making adoption decision',
      },
      networkContentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'network_content',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Content published by network',
      },
      adoptionStatus: {
        type: Sequelize.ENUM('viewed', 'adopted', 'ignored', 'archived'),
        allowNull: false,
        defaultValue: 'viewed',
        comment: 'Church adoption status',
      },
      shareWithMembers: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether church is sharing this content with members',
      },
      shareMethod: {
        type: Sequelize.ENUM('not_shared', 'website', 'newsletter', 'announcement', 'download_link'),
        defaultValue: 'not_shared',
        comment: 'How church is sharing content',
      },
      adoptedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who made adoption decision',
      },
      viewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When church admin first viewed this content',
      },
      adoptedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When church decided to adopt content',
      },
      sharedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When church started sharing with members',
      },
      archivedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When church archived/removed from active display',
      },
      churchNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Internal notes about adoption decision',
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
        comment: 'Flexible field for custom adoption tracking',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Indexes for church_content_adoption
    await queryInterface.addIndex('church_content_adoption', ['churchId'], {
      name: 'idx_church_adoption_churchId',
    });
    await queryInterface.addIndex('church_content_adoption', ['networkContentId'], {
      name: 'idx_church_adoption_contentId',
    });
    await queryInterface.addIndex('church_content_adoption', ['churchId', 'networkContentId'], {
      unique: true,
      name: 'idx_church_adoption_unique',
    });
    await queryInterface.addIndex('church_content_adoption', ['adoptionStatus'], {
      name: 'idx_church_adoption_status',
    });
    await queryInterface.addIndex('church_content_adoption', ['shareWithMembers'], {
      name: 'idx_church_adoption_sharing',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order (due to foreign keys)
    await queryInterface.dropTable('church_content_adoption');
    await queryInterface.dropTable('network_content');
  },
};
