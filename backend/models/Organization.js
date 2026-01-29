module.exports = (sequelize, Sequelize) => {
    const Organization = sequelize.define("organization", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        email: {
            type: Sequelize.STRING
        },
        phone: {
            type: Sequelize.STRING
        },
        address: {
            type: Sequelize.STRING
        },
        city: {
            type: Sequelize.STRING,
            allowNull: true
        },
        country: {
            type: Sequelize.STRING,
            allowNull: true
        },
        website: {
            type: Sequelize.STRING,
            allowNull: true
        },
        logo: {
            type: Sequelize.STRING,
            allowNull: true
        },
        subtypeId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        type: {
            type: Sequelize.STRING,
            defaultValue: 'Organisation' // e.g., Membre, Organisation
        },
        isSystem: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        description: {
            type: Sequelize.TEXT
        },
        status: {
            type: Sequelize.ENUM('Actif', 'Inactif', 'En déplacement', 'Décédé', 'Transféré'),
            defaultValue: 'Actif'
        },
        statusChangeDate: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });

    return Organization;
};
