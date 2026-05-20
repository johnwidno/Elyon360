module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    'Role',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      churchId: DataTypes.INTEGER,
      networkId: DataTypes.INTEGER,
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      displayName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: DataTypes.TEXT,
      permissionIds: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      domain: {
        type: DataTypes.ENUM('platform', 'network', 'church'),
        allowNull: false,
      },
      isSystemRole: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
    },
    {
      tableName: 'roles',
      timestamps: true,
    }
  );

  Role.associate = (models) => {
    // Many-to-many: Role has many Users through UserRoles
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: 'roleId',
      otherKey: 'userId',
      as: 'users',
    });

    // One-to-many: Many roles can exist in a Church
    Role.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
    });

    // One-to-many: Many roles can exist in a ChurchNetwork
    Role.belongsTo(models.ChurchNetwork, {
      foreignKey: 'networkId',
      as: 'network',
    });

    // One-to-many: Role has many UserRoles
    Role.hasMany(models.UserRole, {
      foreignKey: 'roleId',
      as: 'userAssignments',
    });
  };

  /**
   * Get all permissions for this role
   * @returns {Promise<Permission[]>}
   */
  Role.prototype.getPermissions = async function () {
    const { Permission } = sequelize.models;
    if (!this.permissionIds || this.permissionIds.length === 0) {
      return [];
    }
    return Permission.findAll({
      where: {
        id: { [sequelize.Sequelize.Op.in]: this.permissionIds },
      },
    });
  };

  /**
   * Add permission to this role
   * @param {number} permissionId - Permission ID to add
   */
  Role.prototype.addPermission = async function (permissionId) {
    if (!this.permissionIds) this.permissionIds = [];
    if (!this.permissionIds.includes(permissionId)) {
      this.permissionIds.push(permissionId);
      await this.save();
    }
  };

  /**
   * Remove permission from this role
   * @param {number} permissionId - Permission ID to remove
   */
  Role.prototype.removePermission = async function (permissionId) {
    if (this.permissionIds && this.permissionIds.includes(permissionId)) {
      this.permissionIds = this.permissionIds.filter((id) => id !== permissionId);
      await this.save();
    }
  };

  /**
   * Get all users assigned to this role
   * @returns {Promise<User[]>}
   */
  Role.prototype.getAssignedUsers = async function () {
    const { UserRole } = sequelize.models;
    const assignments = await UserRole.findAll({
      where: { roleId: this.id, isActive: true },
      include: [{ model: sequelize.models.User, as: 'user' }],
    });
    return assignments.map((ur) => ur.user);
  };

  return Role;
};
