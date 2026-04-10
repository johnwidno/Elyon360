module.exports = (sequelize, Sequelize) => {
    const MessageComment = sequelize.define("message_comment", {
        sermonMessageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'sermon_messages',
                key: 'id'
            }
        },
        authorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        content: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        parentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'message_comments',
                key: 'id'
            }
        },
        highlightRange: {
            type: Sequelize.JSON, // Google Docs style text selection range
            allowNull: true
        },
        isResolved: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {
        underscored: true
    });

    return MessageComment;
};
