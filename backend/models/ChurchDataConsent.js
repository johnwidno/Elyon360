module.exports = (sequelize, DataTypes) => {
  const ChurchDataConsent = sequelize.define(
    'ChurchDataConsent',
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
      shareFinancialData: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      shareMembershipData: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      shareEventData: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      shareActivityData: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      shareAttendanceData: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      shareDetailedFinances: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      shareMemberNames: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customSharedCategories: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      lastModifiedBy: DataTypes.INTEGER,
      lastModifiedAt: DataTypes.DATE,
    },
    {
      tableName: 'church_data_consent',
      timestamps: true,
    }
  );

  ChurchDataConsent.associate = (models) => {
    ChurchDataConsent.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
    });

    ChurchDataConsent.belongsTo(models.ChurchNetwork, {
      foreignKey: 'networkId',
      as: 'network',
    });
  };

  return ChurchDataConsent;
};
