const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CommunityPost = sequelize.define('CommunityPost', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        churchId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'general',
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        targetSubtypeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        isGlobal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'community_posts',
        timestamps: true,
    });

    CommunityPost.associate = (models) => {
        CommunityPost.belongsTo(models.Church, { foreignKey: 'churchId', as: 'church' });
        CommunityPost.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
        CommunityPost.belongsTo(models.ContactSubtype, { foreignKey: 'targetSubtypeId', as: 'targetSubtype' });
    };

    return CommunityPost;
};
