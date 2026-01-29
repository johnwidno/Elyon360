module.exports = (sequelize, Sequelize) => {
    const Budget = sequelize.define("budget", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        amount: {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        currency: {
            type: Sequelize.STRING,
            defaultValue: 'HTG'
        },
        description: {
            type: Sequelize.TEXT
        },
        startDate: {
            type: Sequelize.DATEONLY
        },
        endDate: {
            type: Sequelize.DATEONLY
        },
        status: {
            type: Sequelize.ENUM('actif', 'inactif', 'suspendu'),
            defaultValue: 'actif'
        },
        year: {
            type: Sequelize.INTEGER,
            defaultValue: new Date().getFullYear()
        },
        bankAccountId: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    });

    return Budget;
};
