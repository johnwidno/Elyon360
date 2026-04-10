module.exports = (sequelize, Sequelize) => {
    const ServiceBlock = sequelize.define("service_block", {
        worshipServiceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'worship_services',
                key: 'id'
            }
        },
        type: {
            type: Sequelize.STRING,
            allowNull: false
            // song, biblereading, prayer, welcome, choir, announcement, offering, etc.
        },
        orderIndex: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        label: {
            type: Sequelize.STRING,
            allowNull: true
        },
        metadata: {
            type: Sequelize.JSON,
            defaultValue: {}
            // songId, lyrics, verses, assignedUserId, etc.
        }
    }, {
        underscored: true
    });

    return ServiceBlock;
};
