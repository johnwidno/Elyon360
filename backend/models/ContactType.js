module.exports = (sequelize, Sequelize) => {
    const ContactType = sequelize.define("contact_type", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        isSystem: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    });

    return ContactType;
};
