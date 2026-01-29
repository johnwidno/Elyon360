module.exports = (sequelize, Sequelize) => {
    const EventParticipant = sequelize.define("event_participant", {
        eventId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('confirmed', 'interested', 'invited'),
            defaultValue: 'confirmed'
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
        guestIp: {
            type: Sequelize.STRING
        },
        notes: {
            type: Sequelize.TEXT
        }
    });

    return EventParticipant;
};
