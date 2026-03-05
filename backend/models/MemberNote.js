module.exports = (sequelize, Sequelize) => {
    const MemberNote = sequelize.define("member_note", {
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
        title: {
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

    return MemberNote;
};
