const db = require('../models');
const sundaySchoolController = require('../controllers/sundaySchoolController');
require('dotenv').config();

async function verifyHistorization() {
    try {
        console.log('=== VERIFICATION DE L\'HISTORISATION AUTOMATIQUE ===\n');

        const userId = 26;
        const churchId = 5;

        // 1. Initial State
        console.log('1. Etat initial (Assignation dynamique)...');
        await sundaySchoolController.assignMemberToClasses(userId, churchId);

        let assignments = await db.SundaySchoolMember.findAll({ where: { userId } });
        console.log(`   Membre assigné à ${assignments.length} classes.`);

        // 2. Simulate Change (e.g., make member inactive)
        console.log('\n2. Changement de Statut -> "Inactif"...');
        const user = await db.User.findByPk(userId);
        const originalStatus = user.status;
        user.status = 'Inactif';
        await user.save();

        // 3. Trigger Assignment Re-sync
        await sundaySchoolController.assignMemberToClasses(userId, churchId);

        // 4. Verify History
        console.log('\n3. Resultat après changement:');
        assignments = await db.SundaySchoolMember.findAll({ where: { userId } });

        for (const a of assignments) {
            const cls = await db.SundaySchool.findByPk(a.sundaySchoolId);
            const statusStr = a.level === 'Actuel' ? 'ACTUEL' : `NON-ACTUEL (Critéres non respectés)`;
            console.log(`   - Classe: ${cls.name}`);
            console.log(`     Niveau: ${statusStr}`);
            if (a.leftAt) console.log(`     Sorti le: ${a.leftAt.toISOString()}`);
        }

        // 5. Restore member status
        user.status = originalStatus;
        await user.save();
        await sundaySchoolController.assignMemberToClasses(userId, churchId);

        console.log('\n✅ Vérification terminée.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

verifyHistorization();
