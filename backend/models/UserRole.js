module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define(
    'UserRole',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      churchId: DataTypes.INTEGER,
      networkId: DataTypes.INTEGER,
      assignedBy: DataTypes.INTEGER,
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
    },
    {
      tableName: 'user_roles',
      timestamps: true,
    }
  );

  UserRole.associate = (models) => {
    // Many-to-one: UserRole belongs to User
    UserRole.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    // Many-to-one: UserRole belongs to Role
    UserRole.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role',
    });

    // Many-to-one: UserRole belongs to Church (optional)
    UserRole.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
    });

    // Many-to-one: UserRole belongs to ChurchNetwork (optional)
    UserRole.belongsTo(models.ChurchNetwork, {
      foreignKey: 'networkId',
      as: 'network',
    });
  };

  return UserRole;
};
