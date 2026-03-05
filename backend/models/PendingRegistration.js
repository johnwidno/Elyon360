module.exports = (sequelize, Sequelize) => {
    const PendingRegistration = sequelize.define("pending_registration", {
        orderId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        churchData: {
            type: Sequelize.JSON,
            allowNull: false
        },
        adminData: {
            type: Sequelize.JSON,
            allowNull: false
        },
        planId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        paymentMethod: {
            type: Sequelize.STRING,
            allowNull: false
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('pending', 'completed', 'failed'),
            defaultValue: 'pending'
        }
    });

    return PendingRegistration;
};
