module.exports = (sequelize, Sequelize) => {
    const Event = sequelize.define("event", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
        },
        startDate: {
            type: Sequelize.DATE,
            allowNull: false
        },
        endDate: {
            type: Sequelize.DATE
        },
        location: {
            type: Sequelize.STRING
        },
        type: {
            type: Sequelize.STRING,
            defaultValue: 'Service spécial'
        },
        status: {
            type: Sequelize.ENUM('planned', 'completed', 'cancelled'),
            defaultValue: 'planned'
        },
        registrationToken: {
            type: Sequelize.STRING,
            unique: true
        },
        registrationExpiresAt: {
            type: Sequelize.DATE
        }
    });

    return Event;
};
