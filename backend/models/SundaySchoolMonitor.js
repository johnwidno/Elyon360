module.exports = (sequelize, Sequelize) => {
    const SundaySchoolMonitor = sequelize.define("sunday_school_monitor", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        classId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        role: {
            type: Sequelize.ENUM('superintendent', 'assistant', 'secretary', 'treasurer', 'monitor'),
            allowNull: false
        }
    });

    return SundaySchoolMonitor;
};
