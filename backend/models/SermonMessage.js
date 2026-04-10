module.exports = (sequelize, Sequelize) => {
    const SermonMessage = sequelize.define("sermon_message", {
        worshipServiceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'worship_services',
                key: 'id'
            }
        },
        preacherId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        title: {
            type: Sequelize.STRING,
            allowNull: true
        },
        content: {
            type: Sequelize.TEXT // Store HTML from TipTap
        },
        points: {
            type: Sequelize.JSON,
            defaultValue: []
        },
        attachments: {
            type: Sequelize.JSON, // Array of URLs / file objects
            defaultValue: []
        }
    }, {
        underscored: true
    });

    return SermonMessage;
};
