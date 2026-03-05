module.exports = (sequelize, Sequelize) => {
    const CardTemplate = sequelize.define("card_template", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        frontBackgroundUrl: {
            type: Sequelize.STRING,
            allowNull: true
        },
        backBackgroundUrl: {
            type: Sequelize.STRING,
            allowNull: true
        },
        layoutConfig: {
            type: Sequelize.JSON,
            allowNull: true
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    });

    return CardTemplate;
};
