const db = require('./models');

/**
 * Script de nettoyage COMPLET des rôles
 * - SUPPRIME TOUS les rôles existants
 * - RECRÉE uniquement les 3 rôles de base : admin, staff, member
 */
async function cleanupAndResetRoles() {
    try {
        console.log('🔧 NETTOYAGE COMPLET DES RÔLES...\n');
        console.log('⚠️  ATTENTION: Ce script va supprimer TOUS les rôles et recréer seulement les 3 de base\n');

        // Récupérer toutes les églises
        const churches = await db.Church.findAll();
        console.log(`📊 Trouvé ${churches.length} église(s)\n`);

        let totalDeleted = 0;
        let totalCreated = 0;

        for (const church of churches) {
            console.log(`\n🏛️  Église: ${church.name} (ID: ${church.id})`);

            // Compter les rôles actuels
            const currentRoles = await db.Role.findAll({
                where: { churchId: church.id }
            });
            console.log(`   📋 Rôles actuels: ${currentRoles.length} (${currentRoles.map(r => r.name).join(', ')})`);

            // ÉTAPE 1: SUPPRIMER TOUS LES RÔLES
            const deleted = await db.Role.destroy({
                where: { churchId: church.id }
            });
            totalDeleted += deleted;
            console.log(`   🗑️  Supprimés: ${deleted} rôle(s)`);

            // ÉTAPE 2: RECRÉER UNIQUEMENT LES 3 RÔLES DE BASE
            const baseRoles = [
                {
                    name: 'admin',
                    permissions: ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings']
                },
                {
                    name: 'staff',
                    permissions: ['members', 'events', 'groups', 'sunday-school', 'ceremonies']
                },
                {
                    name: 'member',
                    permissions: []
                }
            ];

            for (const role of baseRoles) {
                await db.Role.create({
                    churchId: church.id,
                    name: role.name,
                    permissions: role.permissions
                });
                totalCreated++;
                console.log(`   ✅ Créé: ${role.name}`);
            }

            // Vérification finale
            const finalRoles = await db.Role.findAll({
                where: { churchId: church.id },
                order: [['name', 'ASC']]
            });
            console.log(`   ✨ Rôles finaux: ${finalRoles.map(r => r.name).join(', ')}`);
        }

        console.log('\n\n📊 RÉSUMÉ:');
        console.log(`   🗑️  Total supprimés: ${totalDeleted}`);
        console.log(`   ✅ Total créés: ${totalCreated}`);
        console.log('\n✅ Nettoyage complet terminé avec succès!');
        console.log('💡 Seuls les 3 rôles de base existent maintenant: admin, staff, member\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        process.exit(1);
    }
}

// Avertissement avant exécution
console.log('\n⚠️  ═══════════════════════════════════════════════════════════');
console.log('⚠️  AVERTISSEMENT: Ce script va supprimer TOUS les rôles');
console.log('⚠️  et recréer seulement les 3 rôles de base (admin, staff, member)');
console.log('⚠️  ═══════════════════════════════════════════════════════════\n');

// Attendre 3 secondes avant de commencer
setTimeout(() => {
    cleanupAndResetRoles();
}, 3000);

console.log('⏳ Démarrage dans 3 secondes... (Ctrl+C pour annuler)\n');
