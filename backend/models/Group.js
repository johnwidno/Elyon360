module.exports = (sequelize, Sequelize) => {
    const Group = sequelize.define("group", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
        },
        type: {
            type: Sequelize.ENUM('ministry', 'cell', 'department', 'other'),
            defaultValue: 'ministry'
        },
        status: {
            type: Sequelize.ENUM('active', 'inactive', 'archived'),
            defaultValue: 'active'
        },
        leaderName: {
            type: Sequelize.STRING
        },
        meetingDay: {
            type: Sequelize.STRING // Ex: "Mardi"
        },
        meetingTime: {
            type: Sequelize.STRING // Ex: "19:00"
        },
        // Room Reservation for Recurring Meetings
        roomId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'rooms',
                key: 'id'
            }
        },
        recurringSchedule: {
            type: Sequelize.JSON,
            allowNull: true
            // Format: {"day": "Samedi", "startTime": "15:00", "endTime": "18:00"}
        },
        logo: {
            type: Sequelize.TEXT('long'),
            allowNull: true
        },
        charter: {
            type: Sequelize.TEXT('long'),
            allowNull: true
        }
    });

    return Group;
};
