module.exports = (sequelize, Sequelize) => {
    const EventType = sequelize.define("event_type", {
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

    return EventType;
};
