module.exports = (sequelize, Sequelize) => {
    const StatusHistory = sequelize.define("status_history", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false
        },
        changeDate: {
            type: Sequelize.DATE,
            allowNull: false
        },
        changedById: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    });

    return StatusHistory;
};
