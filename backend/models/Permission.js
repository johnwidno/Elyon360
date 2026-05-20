module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define(
    'Permission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      displayName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: DataTypes.TEXT,
      domain: {
        type: DataTypes.ENUM('platform', 'network', 'church'),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'roles',
          'members',
          'finances',
          'events',
          'content',
          'settings',
          'reports',
          'groups',
          'notifications',
          'admin',
          'other'
        ),
        defaultValue: 'other',
      },
      resource: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'permissions',
      timestamps: true,
    }
  );

  Permission.associate = (models) => {
    // Many-to-many: Permission is used by many Roles
    Permission.belongsToMany(models.Role, {
      through: 'RolePermissions',
      foreignKey: 'permissionId',
      otherKey: 'roleId',
      as: 'roles',
    });
  };

  return Permission;
};
