module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    churchId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.TEXT,
      defaultValue: JSON.stringify(['member']),
      get() {
        const value = this.getDataValue('role');
        if (!value) return ['member'];
        try {
          return JSON.parse(value);
        } catch (e) {
          return value ? value.split(',') : ['member'];
        }
      },
      set(val) {
        this.setDataValue('role', Array.isArray(val) ? JSON.stringify(val) : JSON.stringify([val]));
      }
    },
    subtypeId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    address: {
      type: Sequelize.STRING,
      allowNull: true
    },
    city: {
      type: Sequelize.STRING,
      allowNull: true
    },
    department: {
      type: Sequelize.STRING,
      allowNull: true
    },
    zipCode: {
      type: Sequelize.STRING,
      allowNull: true
    },
    country: {
      type: Sequelize.STRING,
      allowNull: true
    },
    gender: {
      type: Sequelize.STRING,
      allowNull: true
    },
    birthDate: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    maritalStatus: {
      type: Sequelize.STRING,
      allowNull: true
    },
    baptismalStatus: {
      type: Sequelize.ENUM('baptized', 'not_baptized', 'candidate', 'adherent', 'transferred', 'affiliated', 'child', 'other'),
      defaultValue: 'not_baptized'
    },
    baptismDate: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    photo: {
      type: Sequelize.TEXT('long'),
      allowNull: true
    },
    nifCin: {
      type: Sequelize.STRING,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('Actif', 'Inactif', 'En déplacement', 'Décédé', 'Transféré', 'Abandonné'),
      defaultValue: 'Actif'
    },
    statusChangeDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    categoryChangeDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    birthPlace: {
      type: Sequelize.STRING,
      allowNull: true
    },
    nickname: {
      type: Sequelize.STRING,
      allowNull: true
    },
    joinDate: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    workAddress: {
      type: Sequelize.STRING,
      allowNull: true
    },
    workEmail: {
      type: Sequelize.STRING,
      allowNull: true
    },
    workPhone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    emergencyContact: {
      type: Sequelize.STRING,
      allowNull: true
    },
    facebookUrl: {
      type: Sequelize.STRING,
      allowNull: true
    },
    linkedinUrl: {
      type: Sequelize.STRING,
      allowNull: true
    },
    spouseName: {
      type: Sequelize.STRING,
      allowNull: true
    },
    memberCode: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    },
    memberCategoryId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    instagramUrl: {
      type: Sequelize.STRING,
      allowNull: true
    },
    tiktokUrl: {
      type: Sequelize.STRING,
      allowNull: true
    },
    websiteUrl: {
      type: Sequelize.STRING,
      allowNull: true
    },
    emergencyPhone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    emergencyEmail: {
      type: Sequelize.STRING,
      allowNull: true
    },
    secondaryPhone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    secondaryEmail: {
      type: Sequelize.STRING,
      allowNull: true
    },
    bloodGroup: {
      type: Sequelize.STRING,
      allowNull: true
    },
    mustChangePassword: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    tempPassword: {
      type: Sequelize.STRING,
      allowNull: true
    },
    addedById: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    coverPic: {
      type: Sequelize.TEXT('long'),
      allowNull: true
    },
    education: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: '[]'
    },
    bio: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    spouseId: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  });

  return User;
};
