module.exports = (sequelize, Sequelize) => {
    const Visitor = sequelize.define("visitor", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        fullName: {
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
        status: {
            type: Sequelize.ENUM('new', 'contacted', 'integrated'),
            defaultValue: 'new'
        },
        notes: {
            type: Sequelize.TEXT
        }
    });

    return Visitor;
};
