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
        }
    });

    return SundaySchoolMember;
};
