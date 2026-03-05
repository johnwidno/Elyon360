const db = require('./models');

async function checkChurches() {
    try {
        const churches = await db.Church.findAll({
            limit: 10,
            attributes: ['id', 'name', 'subdomain', 'status']
        });

        console.log(`\n📊 Total d'églises dans la base: ${churches.length}`);

        if (churches.length === 0) {
            console.log("❌ AUCUNE ÉGLISE dans la base de données !");
            console.log("   Le Super Admin dashboard sera vide.");
        } else {
            console.log("\n✅ Églises trouvées:");
            churches.forEach((church, i) => {
                console.log(`   ${i + 1}. ${church.name} (${church.subdomain}) - ${church.status}`);
            });
        }

    } catch (error) {
        console.error("❌ Erreur:", error.message);
    } finally {
        await db.sequelize.close();
    }
}

checkChurches();
