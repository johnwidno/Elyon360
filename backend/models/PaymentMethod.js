module.exports = (sequelize, Sequelize) => {
    const PaymentMethod = sequelize.define("payment_method", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        }
    });

    return PaymentMethod;
};
