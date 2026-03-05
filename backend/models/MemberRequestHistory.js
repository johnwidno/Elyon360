module.exports = (sequelize, Sequelize) => {
    const MemberRequestHistory = sequelize.define("member_request_history", {
        requestId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        oldStatus: {
            type: Sequelize.STRING,
            allowNull: true
        },
        newStatus: {
            type: Sequelize.STRING,
            allowNull: false
        },
        changedById: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        changeDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        note: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    });

    return MemberRequestHistory;
};
