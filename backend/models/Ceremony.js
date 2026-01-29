module.exports = (sequelize, Sequelize) => {
    const Ceremony = sequelize.define("ceremony", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        type: {
            type: Sequelize.ENUM('bapteme', 'mariage', 'sainte_cene', 'autre'),
            defaultValue: 'autre'
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        date: {
            type: Sequelize.DATE,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        participants: {
            type: Sequelize.JSON, // Array of strings or objects
            allowNull: true
        }
    });

    return Ceremony;
};
