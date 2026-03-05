module.exports = (sequelize, Sequelize) => {
    const Visitor = sequelize.define("visitor", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false
        },
        phone: {
            type: Sequelize.STRING
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('new', 'contacted', 'integrated'),
            defaultValue: 'new'
        },
        wantsMembership: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        viewStatus: {
            type: Sequelize.ENUM('not_viewed', 'viewed'),
            defaultValue: 'not_viewed',
            allowNull: false
        },
        convertedToMemberId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        notes: {
            type: Sequelize.TEXT
        }
    });

    return Visitor;
};
