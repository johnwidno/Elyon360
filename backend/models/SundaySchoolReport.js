module.exports = (sequelize, Sequelize) => {
    const SundaySchoolReport = sequelize.define("sunday_school_report", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        classId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: true
        },
        lessonTitle: {
            type: Sequelize.STRING,
            allowNull: true
        },
        totalLessonPoints: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        coveredLessonPoints: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        goldenText: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        bibleCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        hymnalCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        offeringAmount: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0
        },
        monitorExpectations: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        participantExpectations: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        presentCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        absentCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        excusedCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        observations: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        spiritualProgress: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        submittedById: {
            type: Sequelize.INTEGER,
            allowNull: true
        }
    });

    return SundaySchoolReport;
};
