module.exports = (sequelize, Sequelize) => {
    const GroupMember = sequelize.define("group_member", {
        groupId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        role: {
            type: Sequelize.STRING,
            defaultValue: 'membre'
        },
        status: {
            type: Sequelize.ENUM('active', 'inactive', 'paused'),
            defaultValue: 'active'
        },
        statusChangedAt: {
            type: Sequelize.DATE,
            allowNull: true
        },
        joinedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['groupId', 'userId'],
                name: 'unique_group_user'
            },
            {
                unique: true,
                fields: ['groupId', 'organizationId'],
                name: 'unique_group_org'
            }
        ]
    });

    return GroupMember;
};
