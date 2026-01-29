module.exports = (sequelize, Sequelize) => {
    const Donation = sequelize.define("donation", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true // Member can be anonymous or linked
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: true // For organization donations
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: Sequelize.STRING,
            defaultValue: 'HTG'
        },
        type: {
            type: Sequelize.STRING,
            defaultValue: 'offrande'
        },
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        depositDate: {
            type: Sequelize.DATE,
            allowNull: true // Date when deposited to bank
        },
        paymentMethod: {
            type: Sequelize.STRING,
            defaultValue: 'ESPECE'
        },
        status: {
            type: Sequelize.ENUM('pending', 'deposited', 'complete', 'en_attente', 'annule'),
            defaultValue: 'pending'
        },
        bankAccountId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        createdById: {
            type: Sequelize.INTEGER,
            allowNull: true // User who created this donation
        },
        depositedById: {
            type: Sequelize.INTEGER,
            allowNull: true // User who deposited this donation
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    });

    return Donation;
};
