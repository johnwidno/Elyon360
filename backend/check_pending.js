const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false
    }
);

const PendingRegistration = sequelize.define("pending_registration", {
    orderId: { type: DataTypes.STRING },
    churchData: { type: DataTypes.JSON },
    status: { type: DataTypes.STRING },
    paymentMethod: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE }
});

async function checkPending() {
    try {
        await sequelize.authenticate();
        const pending = await PendingRegistration.findAll({
            orderId: [['createdAt', 'DESC']],
            limit: 10
        });

        console.log('--- DERNIÈRES INSCRIPTIONS EN ATTENTE ---');
        if (pending.length === 0) {
            console.log('Aucune inscription en attente trouvée.');
        } else {
            pending.forEach(p => {
                console.log(`ID: ${p.orderId} | Statut: ${p.status} | Méthode: ${p.paymentMethod} | Créé le: ${p.createdAt}`);
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

checkPending();
