module.exports = (sequelize, Sequelize) => {
    const SubscriptionTransaction = sequelize.define("subscription_transaction", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        planId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: Sequelize.STRING,
            defaultValue: 'HTG'
        },
        paymentMethod: {
            type: Sequelize.STRING, // 'moncash', 'stripe'
            allowNull: false
        },
        orderId: {
            type: Sequelize.STRING,
            allowNull: false
        },
        gatewayReference: {
            type: Sequelize.STRING,
            allowNull: true
        },
        status: {
            type: Sequelize.STRING, // 'success', 'failed', 'pending'
            defaultValue: 'success'
        },
        periodStart: {
            type: Sequelize.DATE,
            allowNull: true
        },
        periodEnd: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });

    return SubscriptionTransaction;
};
