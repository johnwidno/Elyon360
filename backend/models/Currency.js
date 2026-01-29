module.exports = (sequelize, Sequelize) => {
    const Currency = sequelize.define("currency", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        code: {
            type: Sequelize.STRING(10),
            allowNull: false
        },
        symbol: {
            type: Sequelize.STRING(5),
            allowNull: true
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        balance: {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.00
        }
    });

    return Currency;
};
