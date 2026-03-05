module.exports = (sequelize, Sequelize) => {
    const OrganizationMember = sequelize.define("organization_member", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'organizations',
                key: 'id'
            }
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        role: {
            type: Sequelize.STRING, // e.g., 'Founder', 'Member', 'Employee', 'Volunteer'
            defaultValue: 'Member'
        },
        startDate: {
            type: Sequelize.DATEONLY,
            defaultValue: Sequelize.NOW
        },
        endDate: {
            type: Sequelize.DATEONLY,
            allowNull: true
        },
        description: {
            type: Sequelize.STRING,
            allowNull: true
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('Active', 'Former', 'On Leave'),
            defaultValue: 'Active'
        }
    });

    return OrganizationMember;
};
