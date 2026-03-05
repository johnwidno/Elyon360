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
            type: Sequelize.ENUM('monthly', 'yearly', 'custom'),
            defaultValue: 'monthly'
        },
        billingCycle: {
            type: Sequelize.STRING, // e.g., 'monthly', 'yearly', '2 years', '3 years'
            allowNull: true
        },
        durationMonths: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 1 // Default to 1 month
        },
        startDate: {
            type: Sequelize.DATE,
            allowNull: true
        },
        endDate: {
            type: Sequelize.DATE,
            allowNull: true
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
