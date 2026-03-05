module.exports = (sequelize, Sequelize) => {
    const SundaySchoolMember = sequelize.define("sunday_school_member", {
        sundaySchoolId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        assignmentType: {
            type: Sequelize.ENUM('automatic', 'manual'),
            defaultValue: 'automatic'
        },
        level: {
            type: Sequelize.STRING,
            defaultValue: 'Actuel'
        },
        status: {
            type: Sequelize.STRING,
            defaultValue: 'active'
        },
        joinedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        leftAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });

    return SundaySchoolMember;
};
