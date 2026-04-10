module.exports = (sequelize, Sequelize) => {
    const WorshipService = sequelize.define("worship_service", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        theme: {
            type: Sequelize.STRING,
            allowNull: false
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        time: {
            type: Sequelize.STRING,
            allowNull: false
        },
        type: {
            type: Sequelize.ENUM('normal', 'special', 'celebration', 'deliverance', 'prayer'),
            defaultValue: 'normal'
        },
        description: {
            type: Sequelize.TEXT
        },
        imageUrl: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.ENUM('draft', 'validated', 'archived'),
            defaultValue: 'draft'
        },
        leaderId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    }, {
        underscored: true
    });

    return WorshipService;
};
