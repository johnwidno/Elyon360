module.exports = (sequelize, DataTypes) => {
  const ChurchNetworkAffiliation = sequelize.define(
    'ChurchNetworkAffiliation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      churchId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      networkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'active', 'suspended', 'terminated'),
        defaultValue: 'pending',
      },
      affiliatedAt: DataTypes.DATE,
      approvedBy: DataTypes.INTEGER,
      terminatedAt: DataTypes.DATE,
      terminatedBy: DataTypes.INTEGER,
      terminationReason: DataTypes.TEXT,
      notes: DataTypes.TEXT,
    },
    {
      tableName: 'church_network_affiliations',
      timestamps: true,
    }
  );

  ChurchNetworkAffiliation.associate = (models) => {
    ChurchNetworkAffiliation.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
    });

    ChurchNetworkAffiliation.belongsTo(models.ChurchNetwork, {
      foreignKey: 'networkId',
      as: 'network',
    });
  };

  return ChurchNetworkAffiliation;
};
