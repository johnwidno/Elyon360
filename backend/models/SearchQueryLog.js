module.exports = (sequelize, DataTypes) => {
    const SearchQueryLog = sequelize.define('SearchQueryLog', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        churchId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        tableName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        columns: {
            type: DataTypes.JSON,
            allowNull: false
        },
        filters: {
            type: DataTypes.JSON,
            allowNull: true
        },
        sqlQuery: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    return SearchQueryLog;
};
