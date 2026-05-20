/**
 * Migration 008: Create audit_logs table for security event tracking
 * 
 * Purpose: Track all authentication, authorization, and security-related events
 * for compliance, debugging, and security monitoring.
 * 
 * Audit Log Fields:
 * - Event types: login, logout, role_assignment, permission_grant, data_access, login_failure, etc.
 * - User/Church/Network context for proper filtering and reporting
 * - IP address and user agent for security monitoring
 * - Success/failure status with error details
 * - Timestamps for timeline analysis
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      // Event Details
      eventType: {
        type: Sequelize.ENUM(
          'login',
          'logout',
          'login_failure',
          'password_reset',
          'mfa_enabled',
          'mfa_disabled',
          'role_assigned',
          'role_removed',
          'permission_granted',
          'permission_revoked',
          'data_access',
          'export_data',
          'api_call',
          'permission_denied',
          'domain_violation',
          'rate_limit_exceeded',
          'unauthorized_access',
          'other'
        ),
        allowNull: false,
      },

      severity: {
        type: Sequelize.ENUM('info', 'warning', 'error', 'critical'),
        allowNull: false,
        defaultValue: 'info',
      },

      status: {
        type: Sequelize.ENUM('success', 'failure', 'partial'),
        allowNull: false,
        defaultValue: 'success',
      },

      // Actor Information
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        allowNull: true, // Some events may not have a user (e.g., pre-auth)
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // Context Information (Domain Isolation)
      churchId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'churches',
          key: 'id',
        },
        allowNull: true, // Platform-level events may have null churchId
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      networkId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'church_networks',
          key: 'id',
        },
        allowNull: true, // Church-only events may have null networkId
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // Request Information
      ipAddress: {
        type: Sequelize.STRING(45), // Supports IPv4 and IPv6
        allowNull: true,
      },

      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      requestMethod: {
        type: Sequelize.STRING(10), // GET, POST, PATCH, DELETE, etc.
        allowNull: true,
      },

      requestPath: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },

      // Event Details
      resourceType: {
        type: Sequelize.STRING(100), // 'user', 'role', 'permission', 'church', etc.
        allowNull: true,
      },

      resourceId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      action: {
        type: Sequelize.STRING(100), // 'read', 'create', 'update', 'delete'
        allowNull: true,
      },

      // Error Details
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      errorCode: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      // Additional Context
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional context-specific data (e.g., changed fields, reason for action)',
      },

      // Timestamps
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },

      // Note: No updatedAt - audit logs should be immutable
    });

    // Indexes for efficient querying and reporting
    await queryInterface.addIndex('audit_logs', ['userId'], {
      name: 'idx_audit_userId',
    });

    await queryInterface.addIndex('audit_logs', ['churchId'], {
      name: 'idx_audit_churchId',
    });

    await queryInterface.addIndex('audit_logs', ['networkId'], {
      name: 'idx_audit_networkId',
    });

    await queryInterface.addIndex('audit_logs', ['eventType'], {
      name: 'idx_audit_eventType',
    });

    await queryInterface.addIndex('audit_logs', ['severity'], {
      name: 'idx_audit_severity',
    });

    await queryInterface.addIndex('audit_logs', ['status'], {
      name: 'idx_audit_status',
    });

    await queryInterface.addIndex('audit_logs', ['createdAt'], {
      name: 'idx_audit_createdAt',
    });

    // Composite indexes for common queries
    await queryInterface.addIndex('audit_logs', ['churchId', 'eventType', 'createdAt'], {
      name: 'idx_audit_church_event_time',
    });

    await queryInterface.addIndex('audit_logs', ['userId', 'eventType', 'createdAt'], {
      name: 'idx_audit_user_event_time',
    });

    await queryInterface.addIndex('audit_logs', ['ipAddress', 'eventType'], {
      name: 'idx_audit_ip_event',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  },
};
