const db = require('./models');

async function verifyRoles() {
    try {
        console.log('🔍 Vérification des rôles dans la base de données...\n');

        const churches = await db.Church.findAll();

        for (const church of churches) {
            console.log(`\n🏛️  Église: ${church.name} (ID: ${church.id})`);

            const roles = await db.Role.findAll({
                where: { churchId: church.id },
                order: [['name', 'ASC']]
            });

            console.log(`   📊 Nombre de rôles: ${roles.length}`);
            console.log(`   📋 Rôles:`);
            roles.forEach(role => {
                const perms = Array.isArray(role.permissions) ? role.permissions.join(', ') : 'none';
                console.log(`      - ${role.name} (permissions: ${perms})`);
            });
        }

        console.log('\n✅ Vérification terminée!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

verifyRoles();
