const db = require('../models');
require('dotenv').config();

/**
 * Diagnostic tool to check why a member is not assigned to a class
 * Usage: node scripts/diagnose_assignment.js <memberId> <classId>
 */

async function diagnoseAssignment() {
    try {
        const memberId = process.argv[2];
        const classId = process.argv[3];

        if (!memberId || !classId) {
            console.log('Usage: node diagnose_assignment.js <memberId> <classId>');
            process.exit(1);
        }

        console.log(`\n🔍 Diagnostic d'assignation`);
        console.log(`Membre ID: ${memberId}`);
        console.log(`Classe ID: ${classId}\n`);

        // Get member details
        const member = await db.User.findByPk(memberId, {
            include: [
                { model: db.MemberCategory, as: 'category' }
            ]
        });

        if (!member) {
            console.log('❌ Membre non trouvé');
            process.exit(1);
        }

        // Get class details
        const cls = await db.SundaySchool.findByPk(classId, {
            include: [
                { model: db.MemberCategory, as: 'admissionCategory' }
            ]
        });

        if (!cls) {
            console.log('❌ Classe non trouvée');
            process.exit(1);
        }

        console.log('📋 INFORMATIONS DU MEMBRE:');
        console.log(`   Nom: ${member.firstName} ${member.lastName}`);
        console.log(`   Âge: ${member.birthDate ? calculateAge(member.birthDate) : 'N/A'} ans`);
        console.log(`   État civil: ${member.maritalStatus || 'N/A'}`);
        console.log(`   Catégorie: ${member.category?.name || 'N/A'}`);
        console.log(`   Sexe: ${member.gender || 'N/A'}`);
        console.log(`   Statut: ${member.status || 'N/A'}`);

        console.log('\n📋 CRITÈRES DE LA CLASSE:');
        console.log(`   Nom: ${cls.name}`);
        console.log(`   Dynamique: ${cls.isDynamic ? 'OUI' : 'NON'}`);
        console.log(`   Âge: ${cls.minAge || 0}-${cls.maxAge || '∞'} ans`);
        console.log(`   État civil: ${cls.maritalStatus}`);
        console.log(`   Catégorie: ${cls.admissionCategory?.name || cls.baptismalStatus || 'N/A'}`);
        console.log(`   Sexe: ${cls.gender}`);
        console.log(`   Actifs seulement: ${cls.activeOnly ? 'OUI' : 'NON'}`);

        console.log('\n✅ VÉRIFICATION DES CRITÈRES:');

        // 1. Check if class is dynamic
        if (!cls.isDynamic) {
            console.log('   ❌ La classe n\'est PAS dynamique (assignation manuelle uniquement)');
            process.exit(0);
        } else {
            console.log('   ✅ La classe est dynamique');
        }

        // 2. Check age
        const age = member.birthDate ? calculateAge(member.birthDate) : null;
        const ageMatch = !age || (age >= (cls.minAge || 0) && age <= (cls.maxAge || 999));
        console.log(`   ${ageMatch ? '✅' : '❌'} Âge: ${age} ans (requis: ${cls.minAge || 0}-${cls.maxAge || '∞'})`);

        // 3. Check marital status
        const maritalMatches = {
            'single': ['célibataire', 'single', 'non marié', 'unmarried', 'celibataire'],
            'married': ['marié', 'married', 'mariée', 'marie'],
            'widowed': ['veuf', 'veuve', 'widowed', 'widow'],
            'divorced': ['divorcé', 'divorcée', 'divorced', 'divorce']
        };

        let maritalMatch = cls.maritalStatus === 'any';
        if (!maritalMatch && member.maritalStatus) {
            const userStatus = member.maritalStatus.toLowerCase();
            const acceptedStatuses = maritalMatches[cls.maritalStatus] || [];
            maritalMatch = acceptedStatuses.some(s => userStatus.includes(s));
        }
        console.log(`   ${maritalMatch ? '✅' : '❌'} État civil: ${member.maritalStatus} (requis: ${cls.maritalStatus})`);

        // 4. Check member category
        let categoryMatch = true;
        if (cls.memberCategoryId) {
            categoryMatch = member.memberCategoryId === cls.memberCategoryId;
            console.log(`   ${categoryMatch ? '✅' : '❌'} Catégorie: ${member.category?.name || 'N/A'} (requis: ${cls.admissionCategory?.name})`);
        } else if (cls.baptismalStatus !== 'any') {
            // Fallback to baptismalStatus if no memberCategoryId
            categoryMatch = member.baptismalStatus === cls.baptismalStatus;
            console.log(`   ${categoryMatch ? '✅' : '❌'} Statut baptismal: ${member.baptismalStatus} (requis: ${cls.baptismalStatus})`);
        } else {
            console.log(`   ✅ Catégorie: Aucune restriction`);
        }

        // 5. Check gender
        const genderMatch = cls.gender === 'any' || member.gender === cls.gender;
        console.log(`   ${genderMatch ? '✅' : '❌'} Sexe: ${member.gender} (requis: ${cls.gender})`);

        // 6. Member Status check
        let statusMatch = true;
        if (cls.memberStatus && cls.memberStatus !== 'any') {
            const userStatus = (member.status || '').toLowerCase();
            const targetStatus = cls.memberStatus.toLowerCase();
            statusMatch = userStatus === targetStatus;
            console.log(`   ${statusMatch ? '✅' : '❌'} Statut: "${member.status}" (requis: "${cls.memberStatus}")`);
        } else {
            console.log(`   ✅ Statut: Aucune restriction (Peu importe)`);
        }

        // Final verdict
        const allMatch = ageMatch && maritalMatch && categoryMatch && genderMatch && statusMatch;

        console.log('\n' + '='.repeat(50));
        if (allMatch) {
            console.log('✅ RÉSULTAT: Le membre DEVRAIT être assigné à cette classe');
            console.log('\n💡 Suggestion: Exécutez la réassignation automatique:');
            console.log('   POST /api/sunday-school/reassign-all');
        } else {
            console.log('❌ RÉSULTAT: Le membre NE CORRESPOND PAS aux critères');
        }
        console.log('='.repeat(50) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Run the diagnostic
diagnoseAssignment();
