const { Sequelize, DataTypes } = require('./node_modules/sequelize');
const sequelize = new Sequelize('elyonsys360_db', 'postgres', 'password123', { host: 'localhost', dialect: 'postgres', logging: false });
const C = sequelize.define('church', { name: DataTypes.STRING, id: { type: DataTypes.INTEGER, primaryKey: true } }, { tableName: 'churches', timestamps: false });
C.findAll({ order: [['id', 'DESC']], limit: 10 }).then(cs => {
    cs.forEach(c => console.log(c.id, c.name));
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
