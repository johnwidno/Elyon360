module.exports = (sequelize, Sequelize) => {
    const Attachment = sequelize.define("member_attachment", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        type: {
            type: Sequelize.ENUM('file', 'link'),
            defaultValue: 'file'
        },
        url: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        fileType: {
            type: Sequelize.STRING,
            allowNull: true
        },
        size: {
            type: Sequelize.INTEGER,
            allowNull: true
        }
    });

    return Attachment;
};
