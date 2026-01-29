const db = require('../models');

exports.createBudget = async (req, res) => {
    try {
        const { amount, currency, name, bankAccountId } = req.body;
        const churchId = req.user.churchId;

        if (!bankAccountId) {
            return res.status(400).json({ message: "Veuillez sélectionner un compte bancaire pour ce budget." });
        }

        // 1. Get the specific Bank Account
        const bankAccount = await db.BankAccount.findOne({
            where: { id: bankAccountId, churchId }
        });

        if (!bankAccount) {
            return res.status(404).json({ message: "Compte bancaire introuvable." });
        }

        if (bankAccount.currency !== (currency || 'HTG')) {
            return res.status(400).json({ message: `La devise du budget (${currency}) ne correspond pas au compte (${bankAccount.currency}).` });
        }

        // 2. Calculate Available Funds in THIS Account
        // Logic: Available = CurrentBalance - Sum(RemainingAmount of Valid Budgets linked to this account)

        const activeBudgets = await db.Budget.findAll({
            where: {
                churchId,
                bankAccountId,
                status: ['actif', 'suspendu'] // Only count active/suspended budgets as "reserved"
            },
            include: [{
                model: db.Expense,
                as: 'expenses',
                attributes: ['amount']
            }]
        });

        let totalReserved = 0;
        activeBudgets.forEach(b => {
            const spent = b.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const remaining = Math.max(0, parseFloat(b.amount) - spent);
            totalReserved += remaining;
        });

        const availableToAllocate = parseFloat(bankAccount.balance) - totalReserved;

        if (parseFloat(amount) > availableToAllocate) {
            return res.status(400).json({
                message: `Fonds insuffisants sur ${bankAccount.name}. Disponible pour allocation: ${availableToAllocate.toLocaleString()} ${currency || 'HTG'}`
            });
        }

        const budget = await db.Budget.create({
            ...req.body,
            churchId,
            bankAccountId // Validate and Save Link
        });
        res.status(201).json(budget);
    } catch (error) {
        console.error("Create Budget Error:", error);
        res.status(500).json({ message: "Erreur lors de la création du budget" });
    }
};

exports.getAllBudgets = async (req, res) => {
    try {
        const budgets = await db.Budget.findAll({
            where: { churchId: req.user.churchId },
            include: [{
                model: db.Expense,
                as: 'expenses',
                attributes: ['amount']
            }],
            order: [['year', 'DESC'], ['startDate', 'DESC'], ['name', 'ASC']]
        });

        // Calculate spent for each budget
        const budgetsWithSpent = budgets.map(b => {
            const spent = b.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const budgetData = b.toJSON();
            budgetData.spent = spent;
            return budgetData;
        });

        res.json(budgetsWithSpent);
    } catch (error) {
        console.error("Get Budgets Error:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Budget.update(req.body, {
            where: { id, churchId: req.user.churchId }
        });
        res.json({ message: "Budget mis à jour" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Budget.destroy({
            where: { id, churchId: req.user.churchId }
        });
        res.json({ message: "Budget supprimé" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
