/**
 * AuditLog Model
 * 
 * Purpose: Track all authentication, authorization, and security events
 * for compliance, auditing, and security monitoring.
 * 
 * Design Decisions:
 * - Immutable: No updatedAt field (audit logs should not change)
 * - Flexible: metadata field for context-specific data
 * - Indexed: Multiple indexes for efficient querying and reporting
 * - Domain-scoped: churchId/networkId for multi-tenant isolation
 * - UUID primary key for distributed system compatibility
 */

'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // Event Information
    eventType: {
      type: DataTypes.ENUM(
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
      validate: {
        notEmpty: true,
      },
    },

    severity: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
      allowNull: false,
      defaultValue: 'info',
    },

    status: {
      type: DataTypes.ENUM('success', 'failure', 'partial'),
      allowNull: false,
      defaultValue: 'success',
    },

    // Actor
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: true,
    },

    // Context (Domain Isolation)
    churchId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'churches',
        key: 'id',
      },
      allowNull: true,
    },

    networkId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'church_networks',
        key: 'id',
      },
      allowNull: true,
    },

    // Request Details
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      validate: {
        isIP: true,
      },
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    requestMethod: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS', 'HEAD']],
      },
    },

    requestPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // Resource Information
    resourceType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    action: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Error Details
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    errorCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Context
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional context-specific data (changed fields, reason, etc.)',
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false, // Audit logs are immutable
    indexes: [
      { fields: ['userId'] },
      { fields: ['churchId'] },
      { fields: ['networkId'] },
      { fields: ['eventType'] },
      { fields: ['severity'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
      { fields: ['churchId', 'eventType', 'createdAt'] },
      { fields: ['userId', 'eventType', 'createdAt'] },
      { fields: ['ipAddress', 'eventType'] },
    ],
  });

  // Associations
  AuditLog.associate = (db) => {
    AuditLog.belongsTo(db.User, {
      foreignKey: 'userId',
      as: 'user',
      targetKey: 'id',
    });

    AuditLog.belongsTo(db.Church, {
      foreignKey: 'churchId',
      as: 'church',
      targetKey: 'id',
    });

    AuditLog.belongsTo(db.ChurchNetwork, {
      foreignKey: 'networkId',
      as: 'network',
      targetKey: 'id',
    });
  };

  // Helper Methods

  /**
   * Create an audit log entry
   * @param {Object} logData - Audit event data
   * @param {string} logData.eventType - Type of event
   * @param {string} logData.severity - Event severity (info, warning, error, critical)
   * @param {string} logData.status - Event status (success, failure, partial)
   * @param {Integer} logData.userId - User who triggered event
   * @param {Integer} logData.churchId - Church context
   * @param {Integer} logData.networkId - Network context
   * @param {string} logData.ipAddress - Client IP address
   * @param {Object} logData.request - Express request object (for extracting IP, userAgent, path, method)
   * @returns {Promise<AuditLog>}
   */
  AuditLog.logEvent = async function(logData) {
    try {
      // Extract request info if provided
      let requestInfo = {};
      if (logData.request) {
        requestInfo = {
          ipAddress: logData.ipAddress || logData.request.ip || logData.request.connection.remoteAddress,
          userAgent: logData.request.get('user-agent'),
          requestMethod: logData.request.method,
          requestPath: logData.request.path,
        };
      }

      const auditEntry = await this.create({
        eventType: logData.eventType,
        severity: logData.severity || 'info',
        status: logData.status || 'success',
        userId: logData.userId,
        churchId: logData.churchId,
        networkId: logData.networkId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        requestMethod: requestInfo.requestMethod,
        requestPath: requestInfo.requestPath,
        resourceType: logData.resourceType,
        resourceId: logData.resourceId,
        action: logData.action,
        errorMessage: logData.errorMessage,
        errorCode: logData.errorCode,
        description: logData.description,
        metadata: logData.metadata,
      });

      return auditEntry;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  };

  /**
   * Get audit logs for a user
   * @param {Integer} userId - User ID
   * @param {Object} options - Query options (limit, offset, eventType, startDate, endDate)
   * @returns {Promise<Array>}
   */
  AuditLog.getUserAuditLog = async function(userId, options = {}) {
    const where = { userId };

    if (options.eventType) {
      where.eventType = options.eventType;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt[sequelize.Op.gte] = new Date(options.startDate);
      if (options.endDate) where.createdAt[sequelize.Op.lte] = new Date(options.endDate);
    }

    return this.findAll({
      where,
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * Get audit logs for a church
   * @param {Integer} churchId - Church ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  AuditLog.getChurchAuditLog = async function(churchId, options = {}) {
    const where = { churchId };

    if (options.eventType) {
      where.eventType = options.eventType;
    }

    if (options.severity) {
      where.severity = options.severity;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt[sequelize.Op.gte] = new Date(options.startDate);
      if (options.endDate) where.createdAt[sequelize.Op.lte] = new Date(options.endDate);
    }

    return this.findAll({
      where,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      limit: options.limit || 100,
      offset: options.offset || 0,
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * Get failed login attempts from IP
   * @param {string} ipAddress - Client IP address
   * @param {Integer} minutes - Look back period (default 30 minutes)
   * @returns {Promise<Integer>} Count of failed login attempts
   */
  AuditLog.getFailedLoginAttempts = async function(ipAddress, minutes = 30) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    return this.count({
      where: {
        ipAddress,
        eventType: 'login_failure',
        createdAt: {
          [sequelize.Op.gte]: since,
        },
      },
    });
  };

  /**
   * Get security events summary
   * @param {Integer} churchId - Church ID (optional, for church-level summary)
   * @param {Date} startDate - Start date for summary
   * @param {Date} endDate - End date for summary
   * @returns {Promise<Object>} Summary statistics
   */
  AuditLog.getSecuritySummary = async function(churchId, startDate, endDate) {
    const where = {};

    if (churchId) {
      where.churchId = churchId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[sequelize.Op.gte] = startDate;
      if (endDate) where.createdAt[sequelize.Op.lte] = endDate;
    }

    const summary = await this.findAll({
      attributes: [
        'eventType',
        'severity',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where,
      group: ['eventType', 'severity', 'status'],
      raw: true,
    });

    return {
      total: summary.reduce((sum, item) => sum + parseInt(item.count), 0),
      byEventType: summary,
    };
  };

  return AuditLog;
};
