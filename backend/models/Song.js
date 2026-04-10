module.exports = (sequelize, Sequelize) => {
    const Song = sequelize.define("song", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        number: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        collection: {
            type: Sequelize.STRING, // CHE, Echo, Melody, Crimson, etc.
            defaultValue: 'CHE'
        },
        lyrics: {
            type: Sequelize.TEXT
        },
        chords: {
            type: Sequelize.TEXT
        },
        author: {
            type: Sequelize.STRING
        },
        musicalKey: {
            type: Sequelize.STRING
        },
        duration: {
            type: Sequelize.STRING // e.g. "4:30"
        },
        mediaLinks: {
            type: Sequelize.JSON, // { audio: "...", video: "...", chords: "..." }
            defaultValue: {}
        },
        category: {
            type: Sequelize.STRING, // Louange, Adoration, Culte, etc.
            defaultValue: 'General'
        }
    }, {
        underscored: true
    });

    return Song;
};
