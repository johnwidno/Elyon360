module.exports = (sequelize, Sequelize) => {
  const Church = sequelize.define("church", {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    acronym: {
      type: Sequelize.STRING,
      allowNull: true // Optional or required depending on preference, making it optional for now or required if form enforces it
    },
    subdomain: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    logoUrl: {
      type: Sequelize.STRING,
      allowNull: true
    },
    customDomain: {
      type: Sequelize.STRING,
      unique: true
    },
    description: {
      type: Sequelize.TEXT
    },
    pastoralTeam: {
      type: Sequelize.JSON // [{name, role, bio, photo}]
    },
    schedules: {
      type: Sequelize.JSON // [{day, time, type}]
    },
    address: {
      type: Sequelize.STRING
    },
    city: {
      type: Sequelize.STRING
    },
    contactEmail: {
      type: Sequelize.STRING
    },
    contactPhone: {
      type: Sequelize.STRING
    },
    heroImageUrl: {
      type: Sequelize.STRING
    },
    missionTitle: {
      type: Sequelize.STRING
    },
    mission: {
      type: Sequelize.TEXT
    },
    missionImageUrl: {
      type: Sequelize.STRING
    },
    visionTitle: {
      type: Sequelize.STRING
    },
    vision: {
      type: Sequelize.TEXT
    },
    visionImageUrl: {
      type: Sequelize.STRING
    },
    values: {
      type: Sequelize.TEXT
    },
    valuesImageUrl: {
      type: Sequelize.STRING
    },
    recentActivities: {
      type: Sequelize.JSON // [{title, description, date, type}]
    },
    socialLinks: {
      type: Sequelize.JSON // {facebook, youtube, instagram, whatsapp}
    },
    supportedCurrencies: {
      type: Sequelize.JSON,
      defaultValue: ["HTG", "USD"]
    },
    plan: {
      type: Sequelize.ENUM('monthly', 'yearly'),
      defaultValue: 'monthly'
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive', 'suspended', 'expired'),
      defaultValue: 'inactive'
    },
    subscriptionStartedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    subscriptionExpiresAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    setupCompleted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    moncashOrderId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    moncashTransactionId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    pastorName: {
      type: Sequelize.STRING,
      allowNull: true
    },
    churchEmail: {
      type: Sequelize.STRING,
      allowNull: true
    }
  });

  return Church;
};
