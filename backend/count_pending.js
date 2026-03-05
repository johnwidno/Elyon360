const { Sequelize, DataTypes } = require('./node_modules/sequelize');
const sequelize = new Sequelize('elyonsys360_db', 'postgres', 'password123', { host: 'localhost', dialect: 'postgres', logging: false });
const P = sequelize.define('pending_registration', { id: { type: DataTypes.INTEGER, primaryKey: true } }, { tableName: 'pending_registrations', timestamps: false });
P.count().then(c => { console.log('REMAINING:', c); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
