module.exports = (sequelize, DataTypes) => {
  const ChurchNetwork = sequelize.define(
    'ChurchNetwork',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('diocese', 'district', 'network', 'mission', 'institution', 'other'),
        defaultValue: 'diocese',
      },
      description: DataTypes.TEXT,
      leaderEmail: DataTypes.STRING(255),
      leaderName: DataTypes.STRING(255),
      country: DataTypes.STRING(100),
      region: DataTypes.STRING(100),
      createdBy: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'archived'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'church_networks',
      timestamps: true,
    }
  );

  ChurchNetwork.associate = (models) => {
    // Many-to-many: ChurchNetwork has many Churches through ChurchNetworkAffiliations
    ChurchNetwork.belongsToMany(models.Church, {
      through: models.ChurchNetworkAffiliation,
      foreignKey: 'networkId',
      otherKey: 'churchId',
      as: 'affiliatedChurches',
    });

    // One-to-many: ChurchNetwork has many Roles
    ChurchNetwork.hasMany(models.Role, {
      foreignKey: 'networkId',
      as: 'roles',
    });

    // One-to-many: ChurchNetwork has many UserRoles
    ChurchNetwork.hasMany(models.UserRole, {
      foreignKey: 'networkId',
      as: 'userRoles',
    });

    // One-to-many: ChurchNetwork has many DataConsents
    ChurchNetwork.hasMany(models.ChurchDataConsent, {
      foreignKey: 'networkId',
      as: 'consentSettings',
    });
  };

  /**
   * Get all affiliated churches for this network
   * @param {Object} options - Query options
   * @returns {Promise<Church[]>}
   */
  ChurchNetwork.prototype.getAffiliatedChurches = async function (options = {}) {
    return this.getAffiliatedChurches(options);
  };

  /**
   * Get all active roles for this network
   * @returns {Promise<Role[]>}
   */
  ChurchNetwork.prototype.getNetworkRoles = async function () {
    return this.getRoles({
      where: { isActive: true, domain: 'network' },
    });
  };

  /**
   * Get users who have roles in this network
   * @returns {Promise<User[]>}
   */
  ChurchNetwork.prototype.getNetworkAdministrators = async function () {
    const { sequelize } = this;
    return sequelize.models.User.findAll({
      include: [
        {
          model: sequelize.models.UserRole,
          as: 'userRoles',
          where: { networkId: this.id, isActive: true },
        },
      ],
    });
  };

  /**
   * Affiliate a church with this network
   * @param {number} churchId - Church to affiliate
   * @param {Object} data - Affiliation data
   * @returns {Promise<ChurchNetworkAffiliation>}
   */
  ChurchNetwork.prototype.affiliateChurch = async function (churchId, data = {}) {
    const { ChurchNetworkAffiliation } = sequelize.models;
    return ChurchNetworkAffiliation.create({
      churchId,
      networkId: this.id,
      status: data.status || 'pending',
      approvedBy: data.approvedBy,
      notes: data.notes,
    });
  };

  return ChurchNetwork;
};
