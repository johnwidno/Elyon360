module.exports = (sequelize, Sequelize) => {
    const Relationship = sequelize.define("relationship", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        personAId: { // The person defining the relationship
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        personBId: { // The relative
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        type: {
            type: Sequelize.STRING, // e.g., 'Parent', 'Child', 'Spouse', 'Sibling', 'Other'
            allowNull: false
        },
        details: {
            type: Sequelize.STRING, // Optional note
            allowNull: true
        }
    });

    return Relationship;
};
