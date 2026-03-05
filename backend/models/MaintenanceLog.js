module.exports = (sequelize, Sequelize) => {
    const MaintenanceLog = sequelize.define("maintenance_log", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        entityType: {
            type: Sequelize.ENUM('room', 'inventory_item'),
            allowNull: false
        },
        entityId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        reportedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        assignedTo: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: Sequelize.ENUM('reported', 'in_progress', 'resolved', 'cancelled'),
            defaultValue: 'reported'
        },
        cost: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        dateReported: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        dateResolved: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });

    return MaintenanceLog;
};
