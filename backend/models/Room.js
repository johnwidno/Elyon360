module.exports = (sequelize, Sequelize) => {
    const Room = sequelize.define("room", {
        // Core IDs
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        buildingId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'buildings',
                key: 'id'
            }
        },

        // 🆔 Identification & rattachement
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        code: {
            type: Sequelize.STRING, // Référence interne
            allowNull: true
        },
        floor: {
            type: Sequelize.STRING, // Rez-de-chaussée, 1er étage, etc.
            allowNull: true
        },
        type: {
            type: Sequelize.STRING, // culte, réunion, classe, répétition, bureau, polyvalente, etc.
            allowNull: true
        },

        // 📐 Caractéristiques physiques
        area: {
            type: Sequelize.FLOAT, // m²
            allowNull: true
        },
        capacity: {
            type: Sequelize.INTEGER, // Nombre de personnes
            allowNull: true
        },
        layout: {
            type: Sequelize.STRING, // théâtre, classe, cercle, modulable, fixe
            allowNull: true
        },
        condition: {
            type: Sequelize.ENUM('Bon', 'Moyen', 'Mauvais', 'En maintenance'),
            defaultValue: 'Bon'
        },

        // 🏷️ Statut & disponibilité
        status: {
            type: Sequelize.ENUM('Libre', 'Occupée', 'Réservée', 'En maintenance'),
            defaultValue: 'Libre'
        },
        authorizedUse: {
            type: Sequelize.STRING, // formation, répétition, réunion, culte, événement, mixte
            allowNull: true
        },
        isBookable: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        maxBookingDuration: {
            type: Sequelize.INTEGER, // en heures
            allowNull: true
        },
        requiresApproval: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        // 📅 Gestion des horaires
        recurringSchedule: {
            type: Sequelize.JSON, // Horaires fixes récurrents
            allowNull: true
            // Format: [{"day": "Sunday", "start": "08:00", "end": "12:00"}]
        },
        defaultAvailability: {
            type: Sequelize.JSON,
            allowNull: true
        },
        bookingRules: {
            type: Sequelize.JSON, // Règles de réservation
            allowNull: true
        },

        // 🪑 Équipements & matériels disponibles
        facilities: {
            type: Sequelize.JSON,
            allowNull: true
            // Format: [{"name": "Chaises", "quantity": 50, "shared": false}]
        },

        // 👤 Responsabilités
        managerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        managerType: {
            type: Sequelize.ENUM('Membre', 'Staff'),
            allowNull: true
        },
        managerContact: {
            type: Sequelize.STRING, // Téléphone ou email
            allowNull: true
        },

        // 🔧 Sécurité & conditions
        pmrAccess: {
            type: Sequelize.BOOLEAN, // Accès PMR
            defaultValue: false
        },
        emergencyExits: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        electricalSystem: {
            type: Sequelize.BOOLEAN, // Système électrique fonctionnel
            defaultValue: true
        },
        specialRules: {
            type: Sequelize.TEXT, // Interdictions, limitations sonores, etc.
            allowNull: true
        },

        // 📊 Suivi & maintenance
        lastInspection: {
            type: Sequelize.DATE,
            allowNull: true
        },
        nextMaintenance: {
            type: Sequelize.DATE,
            allowNull: true
        },
        maintenanceHistory: {
            type: Sequelize.JSON,
            allowNull: true
            // Format: [{"date": "2024-01-15", "type": "Réparation", "description": "..."}]
        },
        observations: {
            type: Sequelize.TEXT,
            allowNull: true
        },

        // 📎 Médias & documents
        photos: {
            type: Sequelize.JSON, // Array of URLs
            allowNull: true
        },
        layoutPlan: {
            type: Sequelize.STRING, // URL du plan de disposition
            allowNull: true
        }
    });

    return Room;
};
