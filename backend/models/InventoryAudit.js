module.exports = (sequelize, Sequelize) => {
    const InventoryAudit = sequelize.define("inventory_audit", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        auditorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        // Stores a snapshot of the audit details
        // Array of objects: { itemId: 1, itemName: "Mic", prevStatus: "good", newStatus: "good", comment: "ok" }
        itemsChecked: {
            type: Sequelize.JSON,
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('draft', 'completed'),
            defaultValue: 'draft'
        }
    });

    return InventoryAudit;
};
