const db = require('../models');

// Get current church settings
exports.getChurchSettings = async (req, res) => {
    try {
        const churchId = req.user?.churchId || req.church?.id;
        const church = await db.Church.findByPk(churchId);

        if (!church) {
            return res.status(404).json({ message: "Église non trouvée" });
        }

        // Fetch supported currencies from table
        let currencies = await db.Currency.findAll({ where: { churchId } });

        // Fetch supported donation types from table
        let donationTypes = await db.DonationType.findAll({ where: { churchId } });

        // Fetch supported payment methods from tables
        let paymentMethods = await db.PaymentMethod.findAll({ where: { churchId } });

        const churchJSON = church.toJSON();
        churchJSON.supportedCurrencies = currencies.map(c => c.code);
        churchJSON.donationTypes = donationTypes.map(t => t.name);
        churchJSON.paymentMethods = paymentMethods.map(p => p.name);

        res.json({ church: churchJSON });
    } catch (error) {
        console.error("Get Settings Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des paramètres." });
    }
};

// Update church settings
exports.updateChurchSettings = async (req, res) => {
    try {
        const churchId = req.user?.churchId || req.church?.id;
        const {
            name, acronym, description,
            address, city, contactEmail, contactPhone,
            heroImageUrl, missionTitle, mission, missionImageUrl, visionTitle, vision, visionImageUrl, values, valuesImageUrl, recentActivities, socialLinks,

            schedules, pastoralTeam, supportedCurrencies, donationTypes, paymentMethods, setupCompleted
        } = req.body;

        const church = await db.Church.findByPk(churchId);
        if (!church) {
            return res.status(404).json({ message: "Église non trouvée" });
        }

        await church.update({
            name, acronym, description,
            address, city, contactEmail, contactPhone,
            heroImageUrl, missionTitle, mission, missionImageUrl, visionTitle, vision, visionImageUrl, values, valuesImageUrl, recentActivities, socialLinks,
            schedules, pastoralTeam,
            supportedCurrencies, // redundantly save to JSON
            setupCompleted: setupCompleted !== undefined ? setupCompleted : church.setupCompleted
        });

        // Sync Currencies Table
        if (supportedCurrencies && Array.isArray(supportedCurrencies)) {
            const existingCurrs = await db.Currency.findAll({ where: { churchId } });
            const existingCodes = existingCurrs.map(c => c.code);

            const toAdd = supportedCurrencies.filter(code => !existingCodes.includes(code));
            if (toAdd.length > 0) {
                await db.Currency.bulkCreate(toAdd.map(code => ({
                    churchId, code,
                    symbol: code === 'HTG' ? 'G' : (code === 'USD' ? '$' : null)
                })));
            }

            const toRemove = existingCodes.filter(code => !supportedCurrencies.includes(code));
            if (toRemove.length > 0) {
                await db.Currency.destroy({ where: { churchId, code: toRemove } });
            }
        }

        // Sync DonationTypes Table
        if (donationTypes && Array.isArray(donationTypes)) {
            const existingTypes = await db.DonationType.findAll({ where: { churchId } });
            const existingNames = existingTypes.map(t => t.name);

            const toAddTypes = donationTypes.filter(name => !existingNames.includes(name));
            if (toAddTypes.length > 0) {
                await db.DonationType.bulkCreate(toAddTypes.map(name => ({
                    churchId, name,
                    isMandatory: ['offrande', 'dime', 'don_special', 'promesse'].includes(name.toLowerCase())
                })));
            }

            const toRemoveTypes = existingNames.filter(name => !donationTypes.includes(name));
            if (toRemoveTypes.length > 0) {
                // Ensure we don't remove mandatory ones
                await db.DonationType.destroy({
                    where: {
                        churchId,
                        name: toRemoveTypes,
                        isMandatory: false
                    }
                });
            }
        }

        // Sync PaymentMethods Table
        if (paymentMethods && Array.isArray(paymentMethods)) {
            const existingMethods = await db.PaymentMethod.findAll({ where: { churchId } });
            const existingNames = existingMethods.map(p => p.name);

            const toAddMethods = paymentMethods.filter(name => !existingNames.includes(name));
            if (toAddMethods.length > 0) {
                await db.PaymentMethod.bulkCreate(toAddMethods.map(name => ({
                    churchId, name
                })));
            }

            const toRemoveMethods = existingNames.filter(name => !paymentMethods.includes(name));
            if (toRemoveMethods.length > 0) {
                // Prevent deleting defaults: 'CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT'
                const protectedMethods = ['CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT'];
                const safeToRemove = toRemoveMethods.filter(m => !protectedMethods.includes(m));

                if (safeToRemove.length > 0) {
                    await db.PaymentMethod.destroy({ where: { churchId, name: safeToRemove } });
                }
            }
        }

        // Fetch latest to return
        const [updatedCurrs, updatedTypes, updatedMethods] = await Promise.all([
            db.Currency.findAll({ where: { churchId } }),
            db.DonationType.findAll({ where: { churchId } }),
            db.PaymentMethod.findAll({ where: { churchId } })
        ]);

        const churchJSON = church.toJSON();
        churchJSON.supportedCurrencies = updatedCurrs.map(c => c.code);
        churchJSON.donationTypes = updatedTypes.map(t => t.name);
        churchJSON.paymentMethods = updatedMethods.map(p => p.name);

        res.json({ message: "Paramètres mis à jour avec succès", church: churchJSON });
    } catch (error) {
        console.error("Update Settings Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour des paramètres." });
    }
};

// Get Dashboard Statistics (Updated for Advanced Requirements)
exports.getDashboardStats = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Get current week boundaries (Monday to Sunday)
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get Monday of current week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);

        // Run all counts in parallel
        const [
            memberCount,
            inventoryCount,
            classCount,
            ceremonyCount,
            recentDonations,
            upcomingCeremonies,
            membersAll,
            donationsLast7Days,
            organizationCount,
            groupCount,
            visitorsAll,
            organizationsAll,
            recentMembers, // NEW: 3 most recently added members
            allMembersWithBirthday // NEW: For birthday calculation
        ] = await Promise.all([
            db.User.count({ where: { churchId, role: { [db.Sequelize.Op.like]: '%member%' } } }),
            db.InventoryItem.count({ where: { churchId } }),
            db.SundaySchool.count({ where: { churchId } }),
            db.Ceremony.count({ where: { churchId } }),
            db.Donation.findAll({
                where: { churchId },
                limit: 3, // Reduced to 3 items as requested
                order: [['date', 'DESC']],
                include: [{ model: db.User, as: 'member', attributes: ['firstName', 'lastName'] }]
            }),
            db.Ceremony.findAll({
                where: { churchId, date: { [db.Sequelize.Op.gte]: new Date() } },
                limit: 3,
                order: [['date', 'ASC']]
            }),
            // Fetch all members for demographics and growth
            db.User.findAll({
                where: { churchId, role: { [db.Sequelize.Op.like]: '%member%' } },
                attributes: ['id', 'gender', 'birthDate', 'createdAt', 'maritalStatus']
            }),
            // Fetch donations for graph (last 7 days)
            db.Donation.findAll({
                where: {
                    churchId,
                    date: { [db.Sequelize.Op.gte]: sevenDaysAgo }
                },
                attributes: ['amount', 'date', 'currency']
            }),
            db.Organization.count({ where: { churchId } }),
            db.Group.count({ where: { churchId } }),
            // Fetch visitors for growth
            db.Visitor.findAll({
                where: { churchId },
                attributes: ['id', 'createdAt']
            }),
            // Fetch organizations for growth
            db.Organization.findAll({
                where: { churchId },
                attributes: ['id', 'createdAt']
            }),
            // NEW: Fetch 3 most recently added members
            db.User.findAll({
                where: { churchId, role: { [db.Sequelize.Op.like]: '%member%' } },
                limit: 3,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'firstName', 'lastName', 'email', 'photo', 'createdAt']
            }),
            // NEW: Fetch all members with birthdate for birthday calculation
            db.User.findAll({
                where: {
                    churchId,
                    role: { [db.Sequelize.Op.like]: '%member%' },
                    birthDate: { [db.Sequelize.Op.ne]: null }
                },
                attributes: ['id', 'firstName', 'lastName', 'birthDate', 'photo']
            })
        ]);

        // --- 1. Growth Structure (Members, Visitors, Orgs) ---
        const memberGrowth = [];
        for (let i = 0; i < 30; i++) { // 30 Days History
            const d = new Date();
            d.setDate(d.getDate() - i);
            // Format: "23 Jan"
            const dayStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

            const isSameDay = (dateStr) => {
                const checkDate = new Date(dateStr);
                return checkDate.getDate() === d.getDate() &&
                    checkDate.getMonth() === d.getMonth() &&
                    checkDate.getFullYear() === d.getFullYear();
            };

            const newMembers = membersAll.filter(m => isSameDay(m.createdAt)).length;
            const newVisitors = visitorsAll.filter(v => isSameDay(v.createdAt)).length;
            const newOrgs = organizationsAll.filter(o => isSameDay(o.createdAt)).length;

            memberGrowth.unshift({ // Add to beginning (oldest first)
                name: dayStr,
                members: newMembers,
                visitors: newVisitors,
                organizations: newOrgs
            });
        }

        // --- 2. Finance Trends (Last 7 Days) - Multi-currency ---
        const financesTrend = [];
        const usedCurrencies = new Set(); // Track which currencies appeared

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toLocaleDateString('fr-FR', { weekday: 'short' });

            const dayDonations = donationsLast7Days.filter(don => {
                const donDate = new Date(don.date);
                return donDate.getDate() === d.getDate() && donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
            });

            // Group by currency for this day
            const dailyStats = { name: dayStr };
            dayDonations.forEach(don => {
                const curr = don.currency || 'HTG';
                dailyStats[curr] = (dailyStats[curr] || 0) + parseFloat(don.amount);
                usedCurrencies.add(curr);
            });

            financesTrend.push(dailyStats);
        }

        // --- 3. Demographics (Detailed Buckets) ---
        // --- 3. Demographics (Age Buckets) ---
        const demographics = [
            { name: 'Enfants', min: 0, max: 8, count: 0 },
            { name: 'Ados', min: 9, max: 14, count: 0 },
            { name: 'Jeunes', min: 15, max: 25, count: 0 },
            { name: 'Adultes', min: 26, max: 60, count: 0 },
            { name: 'Aînés', min: 61, max: 150, count: 0 },
        ];

        membersAll.forEach(m => {
            if (!m.birthDate) return;
            const birth = new Date(m.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();

            // Bucket Logic
            if (age <= 8) demographics[0].count++;
            else if (age <= 14) demographics[1].count++;
            else if (age <= 25) demographics[2].count++;
            else if (age <= 60) demographics[3].count++;
            else demographics[4].count++;
        });

        // Format for Recharts
        const demographicsData = demographics.map((d, index) => ({
            name: `${d.name} (${d.min}-${d.max === 150 ? '+' : d.max})`,
            value: d.count,
            color: ['#4318FF', '#6Ad2FF', '#EFF4FB', '#05CD99', '#FFB547'][index]
        }));

        // --- 5. Gender Distribution ---
        const genderStats = { Homme: 0, Femme: 0 };
        membersAll.forEach(m => {
            if (!m.gender) return;
            const g = m.gender.trim().toUpperCase();
            if (['HOMME', 'MALE', 'M', 'GARÇON'].includes(g)) genderStats.Homme++;
            else if (['FEMME', 'FEMALE', 'F', 'FILLE'].includes(g)) genderStats.Femme++;
        });

        const genderDistribution = [
            { name: 'Hommes', value: genderStats.Homme, color: '#4318FF' },
            { name: 'Femmes', value: genderStats.Femme, color: '#FFB547' }
        ];

        // --- 6. Calculate Birthdays for Current Week (Monday-Sunday) ---
        const upcomingBirthdays = allMembersWithBirthday.filter(member => {
            const birthDate = new Date(member.birthDate);
            const currentYear = now.getFullYear();

            // Get this year's birthday
            const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

            // Check if birthday falls within current week
            return thisYearBirthday >= startOfWeek && thisYearBirthday <= endOfWeek;
        }).map(member => {
            const birthDate = new Date(member.birthDate);
            const currentYear = now.getFullYear();
            const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
            const age = currentYear - birthDate.getFullYear();

            return {
                id: member.id,
                firstName: member.firstName,
                lastName: member.lastName,
                photo: member.photo,
                birthDate: member.birthDate,
                birthdayThisYear: thisYearBirthday.toISOString(),
                age: age,
                dayOfWeek: thisYearBirthday.toLocaleDateString('fr-FR', { weekday: 'long' })
            };
        }).sort((a, b) => new Date(a.birthdayThisYear) - new Date(b.birthdayThisYear));

        // --- Aggregate Totals ---
        const supportedCurrs = await db.Currency.findAll({ where: { churchId } });
        const supportedCodes = supportedCurrs.map(c => c.code);

        const donationsAll = await db.Donation.findAll({
            where: {
                churchId,
                currency: supportedCodes
            }
        });

        const donationTotals = donationsAll.reduce((acc, d) => {
            const curr = d.currency || 'HTG';
            acc[curr] = (acc[curr] || 0) + parseFloat(d.amount);
            return acc;
        }, {});

        res.json({
            memberCount,
            donationTotals,
            inventoryCount,
            classCount,
            ceremonyCount,
            recentDonations,
            upcomingCeremonies,
            organizationCount,
            groupCount,
            visitorCount: visitorsAll.length,
            memberGrowth,
            financesTrend,
            demographics: demographicsData,
            genderDistribution,
            availableCurrencies: supportedCodes.length > 0 ? supportedCodes : ['HTG'],
            recentMembers, // NEW: 3 most recently added members
            upcomingBirthdays // NEW: Birthdays for current week (Monday-Sunday)
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Erreur lors du chargement des statistiques." });
    }
};

// Upload image handler
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier téléchargé" });
        }

        // Return the path that will be stored in the DB and accessed via the static server
        const filePath = `/uploads/${req.file.filename}`;
        res.json({ filePath });
    } catch (error) {
        console.error("Upload Image Error:", error);
        res.status(500).json({ message: "Erreur lors du téléchargement de l'image" });
    }
};
