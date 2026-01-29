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
        category: {
            type: Sequelize.STRING,
            allowNull: true
        },
        location: {
            type: Sequelize.STRING,
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('bon_etat', 'reparer', 'hors_service'),
            defaultValue: 'bon_etat'
        }
    });

    return InventoryItem;
};
