module.exports = (sequelize, Sequelize) => {
    const CeremonyParticipant = sequelize.define("ceremony_participant", {
        ceremonyId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        role: {
            type: Sequelize.STRING, // participant, parrain, marraine, officiant, etc.
            allowNull: true
        }
    });

    return CeremonyParticipant;
};
