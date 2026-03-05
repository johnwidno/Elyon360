const db = require('../models');
require('dotenv').config();

/**
 * Quick script to check member 24 and all classes
 */

async function checkMember24() {
    try {
        console.log('\n🔍 Diagnostic du membre 24\n');

        // Get member 24
        const member = await db.User.findByPk(24, {
            include: [
                { model: db.MemberCategory, as: 'category' }
            ]
        });

        if (!member) {
            console.log('❌ Membre 24 non trouvé');
            process.exit(1);
        }

        const age = member.birthDate ? calculateAge(member.birthDate) : null;

        console.log('📋 INFORMATIONS DU MEMBRE 24:');
        console.log(`   Nom: ${member.firstName} ${member.lastName}`);
        console.log(`   Âge: ${age || 'N/A'} ans`);
        console.log(`   Date de naissance: ${member.birthDate || 'N/A'}`);
        console.log(`   État civil: "${member.maritalStatus || 'N/A'}"`);
        console.log(`   Catégorie ID: ${member.memberCategoryId || 'N/A'}`);
        console.log(`   Catégorie nom: ${member.category?.name || 'N/A'}`);
        console.log(`   Baptismal Status: "${member.baptismalStatus || 'N/A'}"`);
        console.log(`   Sexe: "${member.gender || 'N/A'}"`);
        console.log(`   Statut: "${member.status || 'N/A'}"`);
        console.log(`   Church ID: ${member.churchId}`);

        // Get all dynamic classes for this church
        const classes = await db.SundaySchool.findAll({
            where: { churchId: member.churchId, isDynamic: true },
            include: [
                { model: db.MemberCategory, as: 'admissionCategory' }
            ]
        });

        console.log(`\n📚 CLASSES DYNAMIQUES (${classes.length}):\n`);

        for (const cls of classes) {
            console.log(`\n━━━ Classe: ${cls.name} (ID: ${cls.id}) ━━━`);
            console.log(`   Âge: ${cls.minAge || 0}-${cls.maxAge || '∞'}`);
            console.log(`   État civil: "${cls.maritalStatus}"`);
            console.log(`   Catégorie ID: ${cls.memberCategoryId || 'N/A'}`);
            console.log(`   Catégorie nom: ${cls.admissionCategory?.name || 'N/A'}`);
            console.log(`   Baptismal: "${cls.baptismalStatus}"`);
            console.log(`   Sexe: "${cls.gender}"`);
            console.log(`   Actifs seulement: ${cls.activeOnly}`);

            // Check each criterion
            let match = true;
            const reasons = [];

            // 1. Age
            if (age !== null && cls.minAge !== null && age < cls.minAge) {
                match = false;
                reasons.push(`❌ Âge trop jeune (${age} < ${cls.minAge})`);
            } else if (age !== null && cls.maxAge !== null && age > cls.maxAge) {
                match = false;
                reasons.push(`❌ Âge trop vieux (${age} > ${cls.maxAge})`);
            } else {
                reasons.push(`✅ Âge OK`);
            }

            // 2. Marital status
            const userMarital = (member.maritalStatus || '').toLowerCase();
            if (cls.maritalStatus !== 'any') {
                const maritalMatches = {
                    'single': ['célibataire', 'single', 'non marié', 'unmarried', 'celibataire'],
                    'married': ['marié', 'mariée', 'marié(e)', 'married', 'époux', 'épouse'],
                    'widowed': ['veuf', 'veuve', 'widowed', 'widow', 'widower'],
                    'divorced': ['divorcé', 'divorcée', 'divorced', 'divorcé(e)']
                };
                const acceptedStatuses = maritalMatches[cls.maritalStatus] || [];
                const maritalMatch = acceptedStatuses.some(status => userMarital.includes(status));
                if (!maritalMatch) {
                    match = false;
                    reasons.push(`❌ État civil ("${userMarital}" ne correspond pas à "${cls.maritalStatus}")`);
                } else {
                    reasons.push(`✅ État civil OK`);
                }
            } else {
                reasons.push(`✅ État civil (aucune restriction)`);
            }

            // 3. Category
            if (cls.memberCategoryId) {
                if (member.memberCategoryId !== cls.memberCategoryId) {
                    match = false;
                    reasons.push(`❌ Catégorie (${member.memberCategoryId} ≠ ${cls.memberCategoryId})`);
                } else {
                    reasons.push(`✅ Catégorie OK`);
                }
            } else {
                reasons.push(`✅ Catégorie (aucune restriction)`);
            }

            // 4. Gender
            const userGender = (member.gender || '').toLowerCase();
            if (cls.gender !== 'any') {
                let genderMatch = false;
                if (cls.gender === 'male') {
                    genderMatch = ['masculin', 'male', 'garçon', 'homme', 'm'].includes(userGender);
                } else if (cls.gender === 'female') {
                    genderMatch = ['féminin', 'female', 'fille', 'femme', 'f'].includes(userGender);
                }
                if (!genderMatch) {
                    match = false;
                    reasons.push(`❌ Sexe ("${userGender}" ne correspond pas à "${cls.gender}")`);
                } else {
                    reasons.push(`✅ Sexe OK`);
                }
            } else {
                reasons.push(`✅ Sexe (aucune restriction)`);
            }

            // 5. Active status
            if (cls.activeOnly) {
                const userStatus = (member.status || '').toLowerCase();
                if (!['actif', 'active'].includes(userStatus)) {
                    match = false;
                    reasons.push(`❌ Statut actif requis (statut actuel: "${member.status}")`);
                } else {
                    reasons.push(`✅ Statut actif OK`);
                }
            } else {
                reasons.push(`✅ Statut (aucune restriction)`);
            }

            console.log(`\n   Résultat: ${match ? '✅ DEVRAIT ÊTRE ASSIGNÉ' : '❌ NE CORRESPOND PAS'}`);
            reasons.forEach(r => console.log(`   ${r}`));
        }

        console.log('\n' + '='.repeat(60) + '\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
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

checkMember24();
