const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MemberStatus = sequelize.define('MemberStatus', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        churchId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        adminId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('verset', 'temoignage', 'reflexion', 'news'),
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
        styleConfig: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
                bgColor: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)',
                textColor: '#ffffff',
                fontFamily: 'font-sans'
            }
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    }, {
        tableName: 'member_statuses',
        timestamps: true,
    });

    MemberStatus.associate = (models) => {
        MemberStatus.belongsTo(models.Church, { foreignKey: 'churchId', as: 'church' });
        MemberStatus.belongsTo(models.User, { foreignKey: 'adminId', as: 'admin' });
    };

    return MemberStatus;
};
