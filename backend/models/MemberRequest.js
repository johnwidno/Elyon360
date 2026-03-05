module.exports = (sequelize, Sequelize) => {
    const MemberRequest = sequelize.define("member_request", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        title: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: ""
        },
        requestType: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: ""
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: ""
        },
        status: {
            // Using STRING instead of ENUM to avoid PostgreSQL cast/conversion issues during sync
            type: Sequelize.STRING,
            defaultValue: 'non vue'
        },
        internalNote: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        assignedToId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        statusUpdateDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    });

    return MemberRequest;
};
