module.exports = (sequelize, Sequelize) => {
    const DonationType = sequelize.define("donation_type", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        isMandatory: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        }
    });

    return DonationType;
};
