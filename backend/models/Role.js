module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define("role", {
        churchId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        permissions: {
            type: Sequelize.TEXT,
            allowNull: false,
            get() {
                const rawValue = this.getDataValue('permissions');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(val) {
                this.setDataValue('permissions', JSON.stringify(val));
            }
        }
    });

    return Role;
};
