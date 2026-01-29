module.exports = (sequelize, Sequelize) => {
    const Plan = sequelize.define("plan", {
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        interval: {
            type: Sequelize.ENUM('monthly', 'yearly'),
            defaultValue: 'monthly'
        },
        features: {
            type: Sequelize.JSON, // Array of feature strings or objects
            allowNull: true
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        }
    });

    return Plan;
};
