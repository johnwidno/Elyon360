const db = require('../models');

// Get all users for the current church (for dropdowns etc)
exports.getAllUsers = async (req, res) => {
    try {
        const churchId = req.user.churchId;

        // If no churchId (e.g. super admin global context), return all or empty?
        // For now, assume church context specific.
        if (!churchId) {
            return res.status(403).json({ message: "Action restricted to church context." });
        }

        const users = await db.User.findAll({
            where: { churchId },
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'] // limited fields
        });

        res.json(users);
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs." });
    }
};

// Search members by name or email
exports.searchMembers = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { query } = req.query;

        if (!churchId) {
            return res.status(403).json({ message: "Action restricted to church context." });
        }

        if (!query || query.trim().length < 2) {
            return res.json([]);
        }

        const searchTerm = `%${query.trim()}%`;

        const members = await db.User.findAll({
            where: {
                churchId,
                role: { [db.Sequelize.Op.like]: '%member%' },
                [db.Sequelize.Op.or]: [
                    { firstName: { [db.Sequelize.Op.like]: searchTerm } },
                    { lastName: { [db.Sequelize.Op.like]: searchTerm } },
                    { email: { [db.Sequelize.Op.like]: searchTerm } },
                    { memberCode: { [db.Sequelize.Op.like]: searchTerm } },
                    db.Sequelize.where(
                        db.Sequelize.fn('CONCAT', db.Sequelize.col('firstName'), ' ', db.Sequelize.col('lastName')),
                        { [db.Sequelize.Op.like]: searchTerm }
                    )
                ]
            },
            attributes: ['id', 'firstName', 'lastName', 'email', 'photo'],
            limit: 10
        });

        res.json(members);
    } catch (error) {
        console.error("Search Members Error:", error);
        res.status(500).json({ message: "Erreur lors de la recherche." });
    }
};

// Get birthdays within a range
exports.getBirthdays = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { startDate, endDate, query } = req.query;

        if (!churchId) {
            return res.status(403).json({ message: "Context required" });
        }

        const whereClause = {
            churchId,
            role: { [db.Sequelize.Op.like]: '%member%' },
            birthDate: { [db.Sequelize.Op.ne]: null },
            email: { [db.Sequelize.Op.and]: [{ [db.Sequelize.Op.ne]: null }, { [db.Sequelize.Op.ne]: '' }] }
        };

        if (query) {
            const searchTerm = `%${query.trim()}%`;
            whereClause[db.Sequelize.Op.or] = [
                { firstName: { [db.Sequelize.Op.like]: searchTerm } },
                { lastName: { [db.Sequelize.Op.like]: searchTerm } },
                { memberCode: { [db.Sequelize.Op.like]: searchTerm } },
                db.Sequelize.where(
                    db.Sequelize.fn('CONCAT', db.Sequelize.col('firstName'), ' ', db.Sequelize.col('lastName')),
                    { [db.Sequelize.Op.like]: searchTerm }
                )
            ];
        }

        const members = await db.User.findAll({
            where: whereClause,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'photo', 'birthDate']
        });

        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 3)); // Default 3 months

        // Reset hours for fair comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const results = [];

        members.forEach(m => {
            const birth = new Date(m.birthDate);
            // Check years involved in the range
            const startYear = start.getFullYear();
            const endYear = end.getFullYear();

            for (let year = startYear; year <= endYear; year++) {
                // Birthday in this filtered year
                const celebration = new Date(year, birth.getMonth(), birth.getDate());

                // Check bounds
                if (celebration >= start && celebration <= end) {
                    results.push({
                        id: m.id,
                        firstName: m.firstName,
                        lastName: m.lastName,
                        photo: m.photo,
                        phone: m.phone,
                        email: m.email,
                        birthDate: m.birthDate,
                        celebrationDate: celebration.toISOString(),
                        ageTurning: year - birth.getFullYear(),
                        dayOfWeek: celebration.toLocaleDateString('fr-FR', { weekday: 'long' })
                    });
                }
            }
        });

        // Sort by celebration date
        results.sort((a, b) => new Date(a.celebrationDate) - new Date(b.celebrationDate));

        res.json(results);
    } catch (error) {
        console.error("Get Birthdays Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des anniversaires." });
    }
};
