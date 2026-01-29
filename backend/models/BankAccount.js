const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BankAccount = sequelize.define('BankAccount', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bankName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        currency: {
            type: DataTypes.ENUM('HTG', 'USD', 'EUR'),
            allowNull: false,
            defaultValue: 'HTG'
        },
        balance: {
            type: DataTypes.DECIMAL(20, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        churchId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    return BankAccount;
};
