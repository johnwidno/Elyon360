module.exports = (sequelize, Sequelize) => {
    const MemberAction = sequelize.define("member_action", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        addedById: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        type: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
        },
        date: {
            type: Sequelize.DATEONLY
        }
    });

    return MemberAction;
};
