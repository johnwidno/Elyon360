const db = require('./models');

async function activateChurch() {
    try {
        // Chercher l'église "edpp"
        const church = await db.Church.findOne({
            where: {
                subdomain: 'edpp.ekklesia360.com'
            }
        });

        if (!church) {
            console.log("❌ Église 'edpp.ekklesia360.com' non trouvée");
            return;
        }

        console.log(`📋 Église trouvée: ${church.name}`);
        console.log(`📊 Statut actuel: ${church.status}`);

        // Activer l'église
        await church.update({ status: 'active' });

        console.log(`✅ Église activée avec succès!`);
        console.log(`🔓 Vous pouvez maintenant vous connecter à ${church.subdomain}`);

    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await db.sequelize.close();
    }
}

activateChurch();
