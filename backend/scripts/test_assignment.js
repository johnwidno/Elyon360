const db = require('../models');
require('dotenv').config();

async function testAssignment() {
    try {
        console.log('=== TEST D\'ASSIGNATION AUTOMATIQUE ===\n');

        const m = await db.User.findByPk(26);
        if (!m) {
            console.log('Membre 26 non trouvé');
            process.exit(1);
        }

        const age = m.birthDate ? Math.floor((new Date() - new Date(m.birthDate)) / 31557600000) : null;
        const st = await db.ContactSubtype.findByPk(m.subtypeId);

        console.log('MEMBRE 26:');
        console.log('  Nom:', m.firstName, m.lastName);
        console.log('  Age:', age, 'ans');
        console.log('  subtypeId:', m.subtypeId);
        console.log('  Subtype:', st?.name);
        console.log('  Marital:', m.maritalStatus);
        console.log('  Gender:', m.gender);
        console.log('  Status:', m.status);

        console.log('\nCLASSES DYNAMIQUES:');
        const classes = await db.SundaySchool.findAll({
            where: { churchId: 5, isDynamic: true }
        });

        for (const cls of classes) {
            const cat = await db.ContactSubtype.findByPk(cls.memberCategoryId);
            console.log(`\n"${cls.name}":`);
            console.log('  Age:', cls.minAge || 0, '-', cls.maxAge || '∞');
            console.log('  Marital:', cls.maritalStatus);
            console.log('  CategoryId:', cls.memberCategoryId);
            console.log('  Category:', cat?.name || 'N/A');
            console.log('  Gender:', cls.gender);
            console.log('  ActiveOnly:', cls.activeOnly);

            // Test matching logic
            const ageMatch = !age || (age >= (cls.minAge || 0) && age <= (cls.maxAge || 999));
            const categoryMatch = !cls.memberCategoryId || m.subtypeId === cls.memberCategoryId;

            const userMarital = (m.maritalStatus || '').toLowerCase();
            let maritalMatch = cls.maritalStatus === 'any';
            if (!maritalMatch) {
                const maritalMatches = {
                    'single': ['célibataire', 'single', 'non marié', 'unmarried', 'celibataire'],
                    'married': ['marié', 'mariée', 'marié(e)', 'married', 'époux', 'épouse'],
                    'widowed': ['veuf', 'veuve', 'widowed', 'widow', 'widower'],
                    'divorced': ['divorcé', 'divorcée', 'divorced', 'divorcé(e)']
                };
                const acceptedStatuses = maritalMatches[cls.maritalStatus] || [];
                maritalMatch = acceptedStatuses.some(status => userMarital.includes(status));
            }

            const userGender = (m.gender || '').toLowerCase();
            let genderMatch = cls.gender === 'any';
            if (!genderMatch) {
                if (cls.gender === 'male') {
                    genderMatch = ['masculin', 'male', 'garçon', 'homme', 'm'].includes(userGender);
                } else if (cls.gender === 'female') {
                    genderMatch = ['féminin', 'female', 'fille', 'femme', 'f'].includes(userGender);
                }
            }

            const userStatus = (m.status || '').toLowerCase();
            let statusMatch = true;
            if (cls.memberStatus && cls.memberStatus !== 'any') {
                statusMatch = userStatus === cls.memberStatus.toLowerCase();
            }

            console.log('  ✓ Age match:', ageMatch);
            console.log('  ✓ Category match:', categoryMatch, `(${m.subtypeId} === ${cls.memberCategoryId})`);
            console.log('  ✓ Marital match:', maritalMatch);
            console.log('  ✓ Gender match:', genderMatch);
            console.log('  ✓ Status match:', statusMatch);

            const shouldAssign = ageMatch && categoryMatch && maritalMatch && genderMatch && statusMatch;
            console.log('  → DEVRAIT ASSIGNER:', shouldAssign ? '✅ OUI' : '❌ NON');
        }

        console.log('\n' + '='.repeat(60));
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

testAssignment();
