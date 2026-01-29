module.exports = (sequelize, Sequelize) => {
    const ActivityParticipant = sequelize.define("activity_participants", {
        status: {
            type: Sequelize.ENUM('present', 'absent', 'excused', 'invited'),
            defaultValue: 'invited'
        },
        guestName: {
            type: Sequelize.STRING
        },
        guestEmail: {
            type: Sequelize.STRING
        },
        guestPhone: {
            type: Sequelize.STRING
        },
        notes: {
            type: Sequelize.TEXT
        },
        guestIp: {
            type: Sequelize.STRING,
            allowNull: true
        }
    });

    return ActivityParticipant;
};
