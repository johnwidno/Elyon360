module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notification", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        isRead: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        type: {
            type: Sequelize.STRING, // 'event', 'donation', 'system'
            defaultValue: 'system'
        }
    });

    return Notification;
};
