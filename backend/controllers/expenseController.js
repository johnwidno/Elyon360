const db = require('../models');

exports.createExpense = async (req, res) => {
    try {
        const { budgetId, amount, currency, description, date, category, paymentMethod } = req.body;
        const churchId = req.user.churchId;

        if (!budgetId) {
            return res.status(400).json({ message: "Un budget est obligatoire pour effectuer une dépense." });
        }

        const expense = await db.sequelize.transaction(async (t) => {
            // 1. Check budget exists and belongs to church
            const budget = await db.Budget.findOne({
                where: { id: budgetId, churchId },
                transaction: t
            });

            if (!budget) {
                throw new Error("Budget introuvable.");
            }

            if (budget.status === 'inactif') {
                throw new Error("Ce budget est inactif et ne peut pas être utilisé.");
            }

            if (budget.status === 'suspendu') {
                throw new Error("Ce budget est actuellement suspendu.");
            }

            // 2. Check budget capacity
            const totalSpent = await db.Expense.sum('amount', {
                where: { budgetId },
                transaction: t
            }) || 0;

            const remainingBudget = parseFloat(budget.amount) - totalSpent;

            if (parseFloat(amount) > remainingBudget) {
                throw new Error(`Dépassement de budget. Disponible: ${remainingBudget.toLocaleString()} ${budget.currency}`);
            }

            // 3. Create expense
            const newExpense = await db.Expense.create({
                ...req.body,
                bankAccountId: budget.bankAccountId, // Ensure it's set
                churchId
            }, { transaction: t });

            // 4. Decrease Bank Account balance (Specific account)
            // 4. Decrease Bank Account balance (Linked to Budget)
            if (budget.bankAccountId) {
                const bankAccount = await db.BankAccount.findOne({
                    where: { id: budget.bankAccountId, churchId },
                    transaction: t
                });

                if (!bankAccount) {
                    throw new Error("Compte bancaire associé au budget introuvable.");
                }

                if (bankAccount.currency !== (currency || 'HTG')) {
                    throw new Error(`Devise du compte (${bankAccount.currency}) ne correspond pas à la dépense (${currency || 'HTG'}).`);
                }

                if (parseFloat(bankAccount.balance) < parseFloat(amount)) {
                    throw new Error(`Solde insuffisant sur le compte ${bankAccount.name}. Disponible: ${parseFloat(bankAccount.balance).toLocaleString()} ${bankAccount.currency}`);
                }

                // Explicitly set the bankAccountId on the expense
                req.body.bankAccountId = bankAccount.id;

                await bankAccount.decrement('balance', { by: amount, transaction: t });
            } else {
                // Fallback for legacy budgets without bankAccountId (Should not happen for new ones)
                // This might block expenses for old budgets.
                // Decision: Block it to enforce integrity.
                throw new Error("Ce budget n'est associé à aucun compte bancaire. Impossible de payer.");
            }

            // Fetch with budget info for frontend
            const fullExpense = await db.Expense.findByPk(newExpense.id, {
                include: [{ model: db.Budget, as: 'budget', attributes: ['name'] }],
                transaction: t
            });

            return fullExpense;
        });

        res.status(201).json(expense);
    } catch (error) {
        console.error("Create Expense Error:", error);
        res.status(400).json({ message: error.message || "Erreur lors de la création de la dépense" });
    }
};

exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await db.Expense.findAll({
            where: { churchId: req.church.id },
            include: [{ model: db.Budget, as: 'budget', attributes: ['name'] }],
            order: [['date', 'DESC']]
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Expense.update(req.body, {
            where: { id, churchId: req.church.id }
        });
        res.json({ message: "Dépense mise à jour" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Expense.destroy({
            where: { id, churchId: req.church.id }
        });
        res.json({ message: "Dépense supprimée" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
