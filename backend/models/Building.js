module.exports = (sequelize, Sequelize) => {
    const Building = sequelize.define("building", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // 🆔 Informations générales
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        code: {
            type: Sequelize.STRING,
            allowNull: true
        },
        type: {
            type: Sequelize.STRING, // Temple, salle polyvalente, etc.
            allowNull: true
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        // 📍 Localisation
        address: {
            type: Sequelize.STRING,
            allowNull: true
        },
        city: {
            type: Sequelize.STRING,
            allowNull: true
        },
        district: {
            type: Sequelize.STRING, // Quartier
            allowNull: true
        },
        country: {
            type: Sequelize.STRING,
            allowNull: true
        },
        latitude: {
            type: Sequelize.FLOAT,
            allowNull: true
        },
        longitude: {
            type: Sequelize.FLOAT,
            allowNull: true
        },
        // 📐 Caractéristiques physiques
        surfaceArea: {
            type: Sequelize.FLOAT, // m²
            allowNull: true
        },
        floors: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        totalRooms: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        capacity: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        constructionYear: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        condition: {
            type: Sequelize.ENUM('Bon', 'Moyen', 'Mauvais', 'En rénovation'),
            defaultValue: 'Bon'
        },
        // 🏷️ Statut & utilisation
        status: {
            type: Sequelize.ENUM('Actif', 'Inactif', 'En maintenance', 'Fermé temporairement'),
            defaultValue: 'Actif'
        },
        usage: {
            type: Sequelize.STRING, // Culte, réunions, etc.
            allowNull: true
        },
        // 👤 Responsabilités (Keeping simple fields for valid contact info, could be FK in future but user asked for fields)
        managerType: {
            type: Sequelize.ENUM('Membre', 'Staff'),
            allowNull: true
        },
        managerName: {
            type: Sequelize.STRING,
            allowNull: true
        },
        managerPhone: {
            type: Sequelize.STRING,
            allowNull: true
        },
        managerEmail: {
            type: Sequelize.STRING,
            allowNull: true
        }
    });

    return Building;
};
