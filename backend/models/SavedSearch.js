module.exports = (sequelize, DataTypes) => {
    const SavedSearch = sequelize.define('SavedSearch', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
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
        }
    });

    return SavedSearch;
};
