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
        }
    });

    return Group;
};
