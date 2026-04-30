module.exports = (sequelize, Sequelize) => {
    const SundaySchoolComment = sequelize.define("sunday_school_comment", {
        reportId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'sunday_school_reports',
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
        }
    }, {
        underscored: true,
        timestamps: true
    });

    return SundaySchoolComment;
};
