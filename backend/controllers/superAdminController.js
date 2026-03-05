const db = require('../models');
const bcrypt = require('bcryptjs');
const Church = db.Church;
const Plan = db.Plan;
const User = db.User;

// --- Church Management ---

exports.getAllChurches = async (req, res) => {
    try {
        const churches = await Church.findAll({
            include: [{
                model: Plan,
                as: 'subscriptionPlan'
            }]
        });

        // Manual count or optimized query needed for true user count, 
        // but for now let's just return church data enriched
        const stats = await Promise.all(churches.map(async (church) => {
            const userCount = await User.count({ where: { churchId: church.id } });
            // Find the admin user for this church to get the email
            // Assuming role is stored as logic that includes 'admin' or 'super_admin' string in JSON or text
            // Or simply find ONE user. For now, let's find the user created first or with role 'admin'
            const adminUser = await User.findOne({
                where: {
                    churchId: church.id,
                    // reliable way might vary if role is JSON array. 
                    // Let's just take the first user created (usually admin).
                },
                order: [['createdAt', 'ASC']]
            });

            return {
                ...church.toJSON(),
                userCount,
                adminEmail: adminUser ? adminUser.email : 'N/A', // Map adminEmail explicitly
                planName: church.subscriptionPlan ? church.subscriptionPlan.name : (church.plan || 'Aucun'),
                planPrice: church.subscriptionPlan ? church.subscriptionPlan.price : 0,
                planInterval: church.subscriptionPlan ? church.subscriptionPlan.interval : 'N/A'
            };
        }));

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching churches:", error);
        res.status(500).json({ message: "Error fetching churches" });
    }
};

exports.getChurchDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const church = await Church.findByPk(id, {
            include: [{
                model: Plan,
                as: 'subscriptionPlan'
            }]
        });

        if (!church) {
            return res.status(404).json({ message: "Church not found" });
        }

        // Fetch detailed stats
        const userCount = await User.count({ where: { churchId: id } });
        const visitorCount = await db.Visitor.count({ where: { churchId: id } });
        const donationTotal = await db.Donation.sum('amount', { where: { churchId: id } }) || 0;

        // Find Admin
        const adminUser = await User.findOne({
            where: { churchId: id },
            order: [['createdAt', 'ASC']]
        });

        res.json({
            ...church.toJSON(),
            stats: {
                members: userCount,
                visitors: visitorCount,
                donations: donationTotal
            },
            admin: adminUser ? {
                name: `${adminUser.firstName} ${adminUser.lastName}`,
                email: adminUser.email
            } : null,
            planName: church.subscriptionPlan ? church.subscriptionPlan.name : church.plan
        });

    } catch (error) {
        console.error("Error fetching church details:", error);
        res.status(500).json({ message: "Error fetching church details" });
    }
};

exports.getChurchUsers = async (req, res) => {
    try {
        const { id } = req.params;
        const users = await User.findAll({
            where: { churchId: id },
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error("Error fetching church users:", error);
        res.status(500).json({ message: "Error fetching church users" });
    }
};

exports.searchGlobalUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 3) {
            return res.json([]);
        }

        const users = await User.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { firstName: { [db.Sequelize.Op.like]: `%${q}%` } },
                    { lastName: { [db.Sequelize.Op.like]: `%${q}%` } },
                    { email: { [db.Sequelize.Op.like]: `%${q}%` } }
                ]
            },
            include: [{
                model: Church,
                as: 'church',
                attributes: ['id', 'name', 'subdomain', 'acronym']
            }],
            limit: 20
        });

        res.json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: "Search failed" });
    }
};

exports.getMemberDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            include: [{
                model: Church,
                as: 'church',
                attributes: ['id', 'name', 'subdomain', 'acronym']
            }]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Error fetching user details" });
    }
};

exports.updateMemberDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, password, role } = req.body;

        // RESTRICTION: Only the primary 'super_admin' can modify system users
        const requesterRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (!requesterRoles.includes('super_admin')) {
            return res.status(403).json({ message: "Restriction: Seul le Super Administrateur principal peut modifier ces utilisateurs." });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const updates = { firstName, lastName, email };
        if (role) updates.role = role;

        if (password && password.length >= 6) {
            updates.password = await bcrypt.hash(password, 10);
        }

        await user.update(updates);
        res.json({ message: "Utilisateur mis à jour avec succès", user });
    } catch (error) {
        console.error("Error updating user details:", error);
        res.status(500).json({ message: "Error updating user" });
    }
};

exports.deleteMemberDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // RESTRICTION: Only the primary 'super_admin' can delete system users
        const requesterRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (!requesterRoles.includes('super_admin')) {
            return res.status(403).json({ message: "Restriction: Seul le Super Administrateur principal peut supprimer ces utilisateurs." });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent self-deletion
        if (user.id === req.user.id) {
            return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
        }

        await user.destroy();
        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        console.error("Error deleting user details:", error);
        res.status(500).json({ message: "Error deleting user" });
    }
};

exports.updateChurchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, subscriptionExpiresAt } = req.body;

        const church = await Church.findByPk(id);
        if (!church) {
            return res.status(404).json({ message: "Church not found" });
        }

        if (status) {
            // RESTRICTION: Cannot suspend or deactivate the System Church
            if (church.subdomain === 'admin-system' && status !== 'active') {
                return res.status(403).json({
                    message: "Restriction: Le statut de l'église système doit rester 'active' pour garantir l'accès à la plateforme."
                });
            }
            church.status = status;
        }
        if (subscriptionExpiresAt) {
            // RESTRICTION: System Church doesn't expire
            if (church.subdomain === 'admin-system') {
                return res.status(403).json({ message: "Restriction: L'abonnement de l'église système ne peut pas être modifié." });
            }
            church.subscriptionExpiresAt = subscriptionExpiresAt;
            church.subscriptionStartedAt = new Date(); // Reset start date on renewal/activation if date is provided
        }

        await church.save();

        res.status(200).json({ message: `Church status updated to ${status}`, church });
    } catch (error) {
        console.error("Error updating church status:", error);
        res.status(500).json({ message: "Error updating church status" });
    }
};

exports.updateChurchDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, acronym, contactEmail, contactPhone, status } = req.body;

        const church = await Church.findByPk(id);
        if (!church) {
            return res.status(404).json({ message: "Church not found" });
        }

        await church.update({
            name,
            acronym,
            contactEmail,
            contactPhone,
            status: status || church.status
        });

        res.status(200).json({ message: "Church details updated successfully", church });
    } catch (error) {
        console.error("Error updating church details:", error);
        res.status(500).json({ message: "Error updating church details" });
    }
};

exports.deleteChurch = async (req, res) => {
    try {
        const { id } = req.params;
        const church = await Church.findByPk(id);

        if (!church) {
            return res.status(404).json({ message: "Church not found" });
        }

        // RESTRICTION: Cannot delete the System Church
        if (church.subdomain === 'admin-system') {
            return res.status(403).json({
                message: "Restriction: Le système ElyonSys ne peut pas supprimer l'église principale d'administration (admin-system)."
            });
        }

        console.log(`[SuperAdmin] Starting complete deletion of church: ${church.name} (ID: ${id})`);

        // Manual cascade delete all related data
        // This ensures complete data removal even if DB cascades aren't properly configured

        // Core Data
        await db.User.destroy({ where: { churchId: id } });
        await db.Visitor.destroy({ where: { churchId: id } });
        await db.Role.destroy({ where: { churchId: id } });

        // Financial Data
        await db.Donation.destroy({ where: { churchId: id } });
        await db.Expense.destroy({ where: { churchId: id } });
        await db.Budget.destroy({ where: { churchId: id } });
        await db.BankAccount.destroy({ where: { churchId: id } });
        await db.PaymentMethod.destroy({ where: { churchId: id } });
        await db.Currency.destroy({ where: { churchId: id } });
        await db.DonationType.destroy({ where: { churchId: id } });

        // Events & Activities
        await db.Event.destroy({ where: { churchId: id } });
        await db.EventType.destroy({ where: { churchId: id } });
        await db.Ceremony.destroy({ where: { churchId: id } });

        // Organizations & Groups
        await db.OrganizationMember.destroy({ where: { churchId: id } });
        await db.Organization.destroy({ where: { churchId: id } });
        await db.Group.destroy({ where: { churchId: id } });

        // Sunday School
        await db.SundaySchoolAttendance.destroy({ where: { churchId: id } });
        await db.SundaySchoolMonitor.destroy({ where: { churchId: id } });
        await db.SundaySchoolReport.destroy({ where: { churchId: id } });
        await db.SundaySchool.destroy({ where: { churchId: id } });

        // Infrastructure & Resources
        await db.Building.destroy({ where: { churchId: id } });
        await db.Room.destroy({ where: { churchId: id } });
        await db.Reservation.destroy({ where: { churchId: id } });
        await db.InventoryItem.destroy({ where: { churchId: id } });
        await db.InventoryAudit.destroy({ where: { churchId: id } });
        await db.MaintenanceLog.destroy({ where: { churchId: id } });

        // Member Management
        await db.Relationship.destroy({ where: { churchId: id } });
        await db.MemberCategory.destroy({ where: { churchId: id } });
        await db.ContactType.destroy({ where: { churchId: id } });
        await db.ContactSubtype.destroy({ where: { churchId: id } });

        // Finally, delete the church itself
        await church.destroy();

        console.log(`[SuperAdmin] ✅ Church ${church.name} and all related data deleted successfully`);
        res.status(200).json({
            message: "Église et toutes ses données supprimées avec succès",
            deleted: true
        });
    } catch (error) {
        console.error("Error deleting church:", error);
        res.status(500).json({ message: "Erreur lors de la suppression de l'église" });
    }
};

// --- Plan Management ---

exports.createPlan = async (req, res) => {
    try {
        const { name, price, interval, billingCycle, durationMonths, startDate, endDate, features } = req.body;
        const plan = await Plan.create({
            name, price, interval, billingCycle,
            durationMonths: durationMonths || 1,
            startDate, endDate, features
        });
        res.status(201).json(plan);
    } catch (error) {
        console.error("Error creating plan:", error);
        res.status(500).json({ message: "Error creating plan" });
    }
};

exports.getPublicPlans = async (req, res) => {
    try {
        const plans = await Plan.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'price', 'interval', 'billingCycle', 'durationMonths', 'features']
        });
        res.status(200).json(plans);
    } catch (error) {
        console.error("Error fetching public plans:", error);
        res.status(500).json({ message: "Error fetching plans" });
    }
};

exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.findAll();
        res.status(200).json(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        res.status(500).json({ message: "Error fetching plans" });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, interval, billingCycle, durationMonths, startDate, endDate, features, isActive } = req.body;

        const plan = await Plan.findByPk(id);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        await plan.update({
            name, price, interval, billingCycle,
            durationMonths: durationMonths || 1,
            startDate, endDate, features, isActive
        });
        res.status(200).json(plan);
    } catch (error) {
        console.error("Error updating plan:", error);
        res.status(500).json({ message: "Error updating plan" });
    }
};

exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByPk(id);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        // Check if any church is using this plan
        const count = await Church.count({ where: { planId: id } });
        if (count > 0) {
            return res.status(400).json({ message: "Cannot delete plan with active subscribers. Deactivate it instead." });
        }

        await plan.destroy();
        res.status(200).json({ message: "Plan deleted successfully" });
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).json({ message: "Error deleting plan" });
    }
};

// --- Advanced Stats & Analytics ---

exports.getSuperAdminStats = async (req, res) => {
    try {
        const { year, month } = req.query;
        let now = new Date();
        if (year) {
            const m = month ? parseInt(month) - 1 : 11;
            const d = new Date(year, m + 1, 0); // Last day of that month
            now = new Date(year, m, d.getDate(), 23, 59, 59);
        }

        const totalRevenue = await db.SubscriptionTransaction.sum('amount', { where: { status: 'success' } }) || 0;
        const churchCount = await Church.count();
        const activeChurches = await Church.count({ where: { status: 'active' } });
        const userCount = await User.count();

        // Revenue this month vs last month
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const thisMonthRevenue = await db.SubscriptionTransaction.sum('amount', {
            where: {
                status: 'success',
                createdAt: { [db.Sequelize.Op.gte]: firstDayThisMonth }
            }
        }) || 0;

        const lastMonthRevenue = await db.SubscriptionTransaction.sum('amount', {
            where: {
                status: 'success',
                createdAt: {
                    [db.Sequelize.Op.gte]: firstDayLastMonth,
                    [db.Sequelize.Op.lt]: firstDayThisMonth
                }
            }
        }) || 0;

        // Plan Distribution
        const planStats = await Church.findAll({
            attributes: [
                [db.sequelize.fn('COUNT', db.sequelize.col('church.id')), 'count']
            ],
            include: [{
                model: Plan,
                as: 'subscriptionPlan',
                attributes: ['name']
            }],
            group: ['planId', 'subscriptionPlan.id'],
            raw: true
        });

        const planDistribution = planStats.map(p => ({
            name: p['subscriptionPlan.name'] || 'Gratuit',
            value: parseInt(p.count) || 0
        }));

        // Church growth
        const churchesThisMonth = await Church.count({
            where: { createdAt: { [db.Sequelize.Op.gte]: firstDayThisMonth } }
        });
        const churchesLastMonth = await Church.count({
            where: {
                createdAt: {
                    [db.Sequelize.Op.gte]: firstDayLastMonth,
                    [db.Sequelize.Op.lt]: firstDayThisMonth
                }
            }
        });

        const churchGrowth = churchesLastMonth > 0 ? ((churchesThisMonth - churchesLastMonth) / churchesLastMonth) * 100 : 0;

        // Growth stats
        const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        // Recently registered churches (last 12 months) for registration chart
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
        const observationMonths = [];
        // Past 11 months + Current month + Next month = 13 months
        for (let i = 11; i >= -1; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            observationMonths.push({
                name: i === -1 ? `${monthNames[d.getMonth()]} (Prév.)` : monthNames[d.getMonth()],
                start: d,
                end: new Date(d.getFullYear(), d.getMonth() + 1, 1)
            });
        }

        const registrationHistory = await Promise.all(observationMonths.map(async (m) => {
            const count = await Church.count({
                where: {
                    createdAt: {
                        [db.Sequelize.Op.gte]: m.start,
                        [db.Sequelize.Op.lt]: m.end
                    }
                }
            });
            return { name: m.name, registrations: count };
        }));

        const revenueHistory = await Promise.all(observationMonths.map(async (m) => {
            const sum = await db.SubscriptionTransaction.sum('amount', {
                where: {
                    status: 'success',
                    createdAt: {
                        [db.Sequelize.Op.gte]: m.start,
                        [db.Sequelize.Op.lt]: m.end
                    }
                }
            }) || 0;
            return { name: m.name, revenue: parseFloat(sum) };
        }));

        let cumulativeUsersTotal = await db.User.count({
            where: {
                createdAt: { [db.Sequelize.Op.lt]: observationMonths[0].start }
            }
        });

        const userHistory = [];
        for (const m of observationMonths) {
            const addedThisMonth = await db.User.count({
                where: {
                    createdAt: {
                        [db.Sequelize.Op.gte]: m.start,
                        [db.Sequelize.Op.lt]: m.end
                    }
                }
            });
            cumulativeUsersTotal += addedThisMonth;
            userHistory.push({ name: m.name, users: cumulativeUsersTotal });
        }

        res.json({
            kpis: {
                totalRevenue,
                monthlyRevenue: thisMonthRevenue,
                revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
                churchGrowth: parseFloat(churchGrowth.toFixed(1)),
                totalChurches: churchCount,
                activeChurches,
                totalUsers: userCount
            },
            charts: {
                planDistribution,
                revenueHistory,
                registrationHistory,
                userHistory
            }
        });
    } catch (error) {
        console.error("Error fetching SuperAdmin stats:", error);
        res.status(500).json({ message: "Error fetching stats" });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const { limit = 50, offset = 0, startDate, endDate } = req.query;
        const whereClause = { status: 'success' };

        if (startDate && endDate) {
            whereClause.createdAt = {
                [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const transactions = await db.SubscriptionTransaction.findAll({
            where: whereClause,
            include: [
                {
                    model: Church,
                    as: 'church',
                    attributes: ['name', 'subdomain', 'status', 'subscriptionStartedAt', 'subscriptionExpiresAt']
                },
                { model: Plan, as: 'plan', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Error fetching transactions" });
    }
};
