module.exports = (sequelize, Sequelize) => {
    const InventoryItem = sequelize.define("inventory_item", {
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
        },
        quantity: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        // Replaces simple string 'location'
        roomId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'rooms',
                key: 'id'
            }
        },
        managerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: Sequelize.ENUM('bon_etat', 'reparer', 'hors_service', 'perdu'),
            defaultValue: 'bon_etat'
        },
        quantity_available: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        isShared: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    });

    return InventoryItem;
};
