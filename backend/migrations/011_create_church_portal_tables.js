'use strict';

/**
 * Migration: Create Church Portal Tables (Phase 5a)
 * Purpose: Create 4 tables for church public portal system, content management, and analytics
 * Tables: church_content, church_content_type_config, church_content_views, church_portal_settings
 * Dependencies: Requires churches table to exist
 * Rollback: Drops all 4 tables in reverse order
 * Date: May 20, 2026
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Table 1: church_portal_settings
      // Purpose: Store portal branding, configuration, and domain settings per church
      await queryInterface.createTable(
        'church_portal_settings',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          churchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'churches',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            unique: true, // One settings record per church
          },
          // Portal branding
          portalTitle: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Custom title for church portal (e.g., "First Baptist Church")',
          },
          portalDescription: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Short description for portal SEO and display',
          },
          portalLogoUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'URL to church logo for portal header',
          },
          heroImageUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'URL to hero banner image for portal homepage',
          },
          // Domain configuration
          subdomain: {
            type: Sequelize.STRING(63),
            allowNull: true,
            unique: true,
            comment: 'Subdomain for church portal (e.g., "firstbaptist" in firstbaptist.elyonsys.com)',
          },
          customDomain: {
            type: Sequelize.STRING(255),
            allowNull: true,
            unique: true,
            comment: 'Optional custom domain (e.g., "firstbaptist.org") - Phase 6',
          },
          // Portal settings
          itemsPerPage: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 10,
            comment: 'Number of content items per page in portal lists',
          },
          enableComments: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Allow members to comment on portal content',
          },
          enableSearch: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Enable portal search functionality',
          },
          socialMediaLinks: {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'JSON: {facebook, twitter, instagram, youtube}',
          },
          googleAnalyticsId: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Google Analytics tracking ID (UA-XXXXXXXX-X or G-XXXXXXXX)',
          },
          // Footer & legal
          footerText: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Custom footer text for portal',
          },
          privacyPolicyUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'URL to church privacy policy',
          },
          contactEmail: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Email for portal contact form submissions',
          },
          // Audit
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        },
        { transaction }
      );

      // Index: Fast lookup by churchId (already unique, but indexed for joins)
      await queryInterface.addIndex('church_portal_settings', ['churchId'], {
        name: 'idx_portal_settings_churchId',
        transaction,
      });

      // Table 2: church_content_type_config
      // Purpose: Define what content types each church wants to display on portal
      await queryInterface.createTable(
        'church_content_type_config',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          churchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'churches',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          contentTypeName: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Unique name for content type (e.g., "sermon", "announcement", "event")',
          },
          displayName: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'User-friendly display name (e.g., "Sunday Sermons")',
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Description of this content type for church admin',
          },
          isEnabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether this content type is active for the church',
          },
          sortOrder: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Display order in portal menus (0 = first)',
          },
          showInPublicPortal: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Display in unauthenticated public portal',
          },
          showInMemberPortal: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Display in authenticated member portal',
          },
          defaultVisibility: {
            type: Sequelize.ENUM('public', 'members_only', 'private'),
            allowNull: false,
            defaultValue: 'public',
            comment: 'Default visibility when content of this type is created',
          },
          requiresFeaturedImage: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether featured image is mandatory for this type',
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        },
        { transaction }
      );

      // Unique constraint: One config per content type per church
      await queryInterface.addConstraint(
        'church_content_type_config',
        {
          fields: ['churchId', 'contentTypeName'],
          type: 'unique',
          name: 'uk_church_contentTypeName',
          transaction,
        }
      );

      // Indexes
      await queryInterface.addIndex('church_content_type_config', ['churchId'], {
        name: 'idx_contentTypeConfig_churchId',
        transaction,
      });

      await queryInterface.addIndex(
        'church_content_type_config',
        ['churchId', 'isEnabled'],
        {
          name: 'idx_contentTypeConfig_churchId_enabled',
          transaction,
        }
      );

      // Table 3: church_content
      // Purpose: Store public/member content for church portal
      await queryInterface.createTable(
        'church_content',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          churchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'churches',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          // Content identity & slug
          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Content title (e.g., "Sunday Service Recording")',
          },
          slug: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'URL-friendly slug for content (e.g., "sunday-service-recording")',
          },
          // Content categorization
          contentType: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Type of content (e.g., "sermon", "announcement", "event", "blog")',
          },
          category: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Optional category grouping within content type',
          },
          tags: {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: [],
            comment: 'Array of tags for content discovery (e.g., ["prayer", "healing"])',
          },
          // Content visibility
          visibility: {
            type: Sequelize.ENUM('public', 'members_only', 'private'),
            allowNull: false,
            defaultValue: 'public',
            comment: 'Who can see: public (unauthenticated), members_only, or private (admin only)',
          },
          isArchived: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Soft delete flag (archived content hidden from portal)',
          },
          publishedAt: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When content was published (null = draft)',
          },
          // Content data
          richTextContent: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'HTML/Markdown rich text content body',
          },
          featuredImageUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'URL to featured image for content card display',
          },
          attachmentUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'URL to downloadable attachment (PDF, document, etc.)',
          },
          // Access control
          requiredRoles: {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: [],
            comment: 'Array of role names required to view (empty = no restriction)',
          },
          // SEO
          metaTitle: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'SEO meta title (default: title if not set)',
          },
          metaDescription: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'SEO meta description for search results',
          },
          // Audit
          createdBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          updatedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        },
        { transaction }
      );

      // Unique constraint: churchId + slug (one slug per church)
      await queryInterface.addConstraint('church_content', {
        fields: ['churchId', 'slug'],
        type: 'unique',
        name: 'uk_church_content_slug',
        transaction,
      });

      // Indexes
      await queryInterface.addIndex('church_content', ['churchId'], {
        name: 'idx_content_churchId',
        transaction,
      });

      await queryInterface.addIndex('church_content', ['churchId', 'visibility'], {
        name: 'idx_content_churchId_visibility',
        transaction,
      });

      await queryInterface.addIndex(
        'church_content',
        ['visibility', 'publishedAt'],
        {
          name: 'idx_content_visibility_publishedAt',
          transaction,
        }
      );

      await queryInterface.addIndex('church_content', ['isArchived'], {
        name: 'idx_content_isArchived',
        transaction,
      });

      await queryInterface.addIndex('church_content', ['contentType'], {
        name: 'idx_content_contentType',
        transaction,
      });

      // Table 4: church_content_views
      // Purpose: Track portal content views for analytics (anonymous + authenticated)
      await queryInterface.createTable(
        'church_content_views',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          churchContentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'church_content',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          churchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'churches',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          // Visitor identification (anonymous)
          visitorFingerprint: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Anonymous visitor fingerprint (device/browser hash)',
          },
          // Visitor identification (authenticated)
          userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          // Request context
          referrerUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'HTTP referrer URL (where user came from)',
          },
          // Timestamp
          viewedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        },
        { transaction }
      );

      // Indexes
      await queryInterface.addIndex('church_content_views', ['churchContentId'], {
        name: 'idx_views_contentId',
        transaction,
      });

      await queryInterface.addIndex(
        'church_content_views',
        ['churchContentId', 'viewedAt'],
        {
          name: 'idx_views_contentId_viewedAt',
          transaction,
        }
      );

      await queryInterface.addIndex('church_content_views', ['churchId'], {
        name: 'idx_views_churchId',
        transaction,
      });

      await queryInterface.addIndex(
        'church_content_views',
        ['churchId', 'viewedAt'],
        {
          name: 'idx_views_churchId_viewedAt',
          transaction,
        }
      );

      await queryInterface.addIndex(
        'church_content_views',
        ['visitorFingerprint'],
        {
          name: 'idx_views_visitorFingerprint',
          transaction,
        }
      );

      await queryInterface.addIndex('church_content_views', ['userId'], {
        name: 'idx_views_userId',
        transaction,
      });

      await transaction.commit();
      console.log(
        '✅ Migration 011: Church Portal tables created successfully'
      );
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration 011 failed:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop tables in reverse order (FKs first)
      await queryInterface.dropTable('church_content_views', { transaction });
      console.log('  ✅ Dropped church_content_views');

      await queryInterface.dropTable('church_content', { transaction });
      console.log('  ✅ Dropped church_content');

      await queryInterface.dropTable('church_content_type_config', {
        transaction,
      });
      console.log('  ✅ Dropped church_content_type_config');

      await queryInterface.dropTable('church_portal_settings', { transaction });
      console.log('  ✅ Dropped church_portal_settings');

      await transaction.commit();
      console.log('✅ Migration 011 rolled back successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  },
};
