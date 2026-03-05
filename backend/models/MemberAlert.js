module.exports = (sequelize, Sequelize) => {
    const MemberAlert = sequelize.define("member_alert", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        }
    });

    return MemberAlert;
};
