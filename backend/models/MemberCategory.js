module.exports = (sequelize, Sequelize) => {
    const MemberCategory = sequelize.define("member_category", {
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
        }
    });

    return MemberCategory;
};
