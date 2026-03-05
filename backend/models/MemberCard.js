module.exports = (sequelize, Sequelize) => {
    const MemberCard = sequelize.define("member_card", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        cardNumber: {
            type: Sequelize.STRING,
            allowNull: false
        },
        issueDate: {
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('Active', 'Inactive'),
            defaultValue: 'Active'
        },
        description: {
            type: Sequelize.STRING,
            allowNull: true
        },
        templateId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        qrCode: {
            type: Sequelize.STRING,
            allowNull: true
        },
        frontImageUrl: {
            type: Sequelize.STRING,
            allowNull: true
        },
        backImageUrl: {
            type: Sequelize.STRING,
            allowNull: true
        },
        pdfUrl: {
            type: Sequelize.STRING,
            allowNull: true
        }
    });

    return MemberCard;
};
