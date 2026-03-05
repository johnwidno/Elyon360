module.exports = (sequelize, Sequelize) => {
    const Reservation = sequelize.define("reservation", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        roomId: {
            type: Sequelize.INTEGER, // Can be null if only reserving equipment
            allowNull: true,
            references: {
                model: 'rooms',
                key: 'id'
            }
        },
        // For simple single-resource booking or primary resource. 
        // Complex multi-resource bookings might need a junction table, but let's keep it simple or use JSON for now
        resourceIds: {
            type: Sequelize.JSON, // Array of { resourceId: 1, quantity: 2 }
            allowNull: true
        },
        organizerId: {
            type: Sequelize.INTEGER,
            allowNull: true, // User ID who organized it
            references: {
                model: 'users',
                key: 'id'
            }
        },
        groupId: {
            type: Sequelize.INTEGER,
            allowNull: true, // If reserved on behalf of a group
            references: {
                model: 'groups',
                key: 'id'
            }
        },
        expectedAttendees: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        startTime: {
            type: Sequelize.DATE,
            allowNull: false
        },
        endTime: {
            type: Sequelize.DATE,
            allowNull: false
        },
        type: {
            type: Sequelize.STRING, // e.g. "Meeting", "Rehearsal", "Service"
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('pending', 'confirmed', 'rejected', 'cancelled'),
            defaultValue: 'pending'
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    });

    return Reservation;
};
