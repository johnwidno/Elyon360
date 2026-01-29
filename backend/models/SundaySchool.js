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
        isDynamic: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        memberCategoryId: {
            type: Sequelize.INTEGER,
            allowNull: true
        }
    });

    return SundaySchool;
};
