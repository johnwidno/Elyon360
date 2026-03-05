module.exports = (sequelize, Sequelize) => {
    const SundaySchoolAttendance = sequelize.define("sunday_school_attendance", {
        classId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('present', 'absent', 'excused'),
            defaultValue: 'present'
        },
        monitorId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        reportId: {
            type: Sequelize.INTEGER,
            allowNull: true
        }
    });

    return SundaySchoolAttendance;
};
