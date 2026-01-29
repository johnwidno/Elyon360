module.exports = (sequelize, Sequelize) => {
    const ContactSubtype = sequelize.define("contact_subtype", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        contactTypeId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });

    return ContactSubtype;
};
