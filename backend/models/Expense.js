module.exports = (sequelize, Sequelize) => {
    const Expense = sequelize.define("expense", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        budgetId: {
            type: Sequelize.INTEGER,
            allowNull: true // Optional, if they want to track expenses without a budget link initially
        },
        bankAccountId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        amount: {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false
        },
        currency: {
            type: Sequelize.STRING,
            defaultValue: 'HTG'
        },
        description: {
            type: Sequelize.STRING,
            allowNull: false
        },
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        category: {
            type: Sequelize.STRING
        },
        paymentMethod: {
            type: Sequelize.STRING,
            defaultValue: 'CASH'
        }
    });

    return Expense;
};
