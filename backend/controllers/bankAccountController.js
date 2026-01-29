const db = require('../models');

// Create a new bank account
exports.create = async (req, res) => {
    try {
        const { name, bankName, accountNumber, currency, balance } = req.body;
        const churchId = req.user.churchId;

        const bankAccount = await db.BankAccount.create({
            name,
            bankName,
            accountNumber,
            currency,
            balance: balance || 0,
            churchId
        });

        res.status(201).json(bankAccount);
    } catch (error) {
        console.error("Create Bank Account Error:", error);
        res.status(500).json({ message: "Erreur lors de la création du compte bancaire" });
    }
};

// Get all bank accounts for the church
exports.findAll = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const accounts = await db.BankAccount.findAll({
            where: { churchId }
        });
        res.json(accounts);
    } catch (error) {
        console.error("Get Bank Accounts Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des comptes" });
    }
};

// Update a bank account
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.user.churchId;

        const [updated] = await db.BankAccount.update(req.body, {
            where: { id, churchId }
        });

        if (updated) {
            const updatedAccount = await db.BankAccount.findOne({ where: { id } });
            res.json(updatedAccount);
        } else {
            res.status(404).json({ message: "Compte non trouvé" });
        }
    } catch (error) {
        console.error("Update Bank Account Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du compte" });
    }
};

// Delete a bank account
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.user.churchId;

        const deleted = await db.BankAccount.destroy({
            where: { id, churchId }
        });

        if (deleted) {
            res.json({ message: "Compte supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Compte non trouvé" });
        }
    } catch (error) {
        console.error("Delete Bank Account Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression du compte" });
    }
};

// Deposit funds from pending donations to a bank account
exports.deposit = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { bankAccountId, donationIds, depositDate, depositedById } = req.body;
        const churchId = req.user.churchId;

        // 1. Get the Bank Account
        const bankAccount = await db.BankAccount.findOne({
            where: { id: bankAccountId, churchId },
            transaction: t
        });

        if (!bankAccount) {
            await t.rollback();
            return res.status(404).json({ message: "Compte bancaire introuvable" });
        }

        // 2. Get Donations
        const donations = await db.Donation.findAll({
            where: {
                id: donationIds,
                churchId,
                status: 'pending' // Only allow pending donations
            },
            transaction: t
        });

        if (donations.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: "Aucune donation valide sélectionnée pour le dépôt" });
        }

        // 3. Validate Currency Match
        let totalAmount = 0;
        for (const donation of donations) {
            if (donation.currency !== bankAccount.currency) {
                await t.rollback();
                return res.status(400).json({
                    message: `La devise de la donation #${donation.id} (${donation.currency}) ne correspond pas au compte (${bankAccount.currency})`
                });
            }
            totalAmount += parseFloat(donation.amount);
        }

        // 4. Update Bank Account Balance
        bankAccount.balance = parseFloat(bankAccount.balance) + totalAmount;
        await bankAccount.save({ transaction: t });

        // 5. Update Donations Status with deposit tracking
        await db.Donation.update(
            {
                status: 'deposited',
                bankAccountId: bankAccount.id,
                depositDate: depositDate || new Date(),
                depositedById: depositedById || req.user.id
            },
            {
                where: {
                    id: donations.map(d => d.id)
                },
                transaction: t
            }
        );

        await t.commit();
        res.json({
            message: "Dépôt effectué avec succès",
            totalDeposited: totalAmount,
            newBalance: bankAccount.balance
        });

    } catch (error) {
        await t.rollback();
        console.error("Deposit Error:", error);
        res.status(500).json({ message: "Erreur lors du dépôt" });
    }
};
