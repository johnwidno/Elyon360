const db = require('../models');
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
                planName: church.subscriptionPlan ? church.subscriptionPlan.name : church.plan
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

exports.updateChurchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, subscriptionExpiresAt } = req.body;

        const church = await Church.findByPk(id);
        if (!church) {
            return res.status(404).json({ message: "Church not found" });
        }

        if (status) church.status = status;
        if (subscriptionExpiresAt) {
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

exports.deleteChurch = async (req, res) => {
    try {
        const { id } = req.params;
        const church = await Church.findByPk(id);

        if (!church) {
            return res.status(404).json({ message: "Church not found" });
        }

        // Hard delete: cascade should be handled by DB or manually delete related data
        // For safety, let's assuming DB cascade or we settle for soft delete logic if preferred.
        // Here we do standard delete.
        await church.destroy();

        res.status(200).json({ message: "Church deleted successfully" });
    } catch (error) {
        console.error("Error deleting church:", error);
        res.status(500).json({ message: "Error deleting church" });
    }
};

// --- Plan Management ---

exports.createPlan = async (req, res) => {
    try {
        const { name, price, interval, features } = req.body;
        const plan = await Plan.create({ name, price, interval, features });
        res.status(201).json(plan);
    } catch (error) {
        console.error("Error creating plan:", error);
        res.status(500).json({ message: "Error creating plan" });
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
        const { name, price, interval, features, isActive } = req.body;

        const plan = await Plan.findByPk(id);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        await plan.update({ name, price, interval, features, isActive });
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
