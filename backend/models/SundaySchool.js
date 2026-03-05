module.exports = (sequelize, Sequelize) => {
    const SundaySchool = sequelize.define("sunday_school", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        teacherId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        minAge: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        maxAge: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        maritalStatus: {
            type: Sequelize.ENUM('single', 'married', 'widowed', 'divorced', 'any'),
            defaultValue: 'any'
        },
        baptismalStatus: {
            type: Sequelize.ENUM('baptized', 'not_baptized', 'candidate', 'adherent', 'transferred', 'affiliated', 'child', 'other', 'any'),
            defaultValue: 'any'
        },
        gender: {
            type: Sequelize.ENUM('male', 'female', 'any'),
            defaultValue: 'any'
        },
        activeOnly: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        memberStatus: {
            type: Sequelize.STRING,
            defaultValue: 'any'
        },
        isDynamic: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        memberCategoryId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        // Room Reservation for Recurring Classes
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
            // Format: {"day": "Dimanche", "startTime": "09:00", "endTime": "10:30"}
        }
    });

    return SundaySchool;
};
