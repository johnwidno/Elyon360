module.exports = (sequelize, Sequelize) => {
    const GroupActivity = sequelize.define("group_activities", {
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
        },
        date: {
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
            defaultValue: 'Formation'
        },
        status: {
            type: Sequelize.ENUM('planned', 'completed', 'cancelled'),
            defaultValue: 'planned'
        },
        coordinatorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        registrationToken: {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true
        },
        registrationExpiresAt: {
            type: Sequelize.DATE,
            allowNull: true
        },
        startTime: {
            type: Sequelize.STRING,
            allowNull: true
        }
    });

    return GroupActivity;
};
