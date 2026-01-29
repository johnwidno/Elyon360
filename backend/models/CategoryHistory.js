module.exports = (sequelize, Sequelize) => {
    const CategoryHistory = sequelize.define("category_history", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        subtypeId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        baptismalStatus: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        memberCategoryId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        changeDate: {
            type: Sequelize.DATE,
            allowNull: false
        },
        changedById: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    });

    return CategoryHistory;
};
