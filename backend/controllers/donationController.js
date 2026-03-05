const db = require('../models');

exports.createDonation = async (req, res) => {
    try {
        const { amount, currency, type, date, paymentMethod, userId, notes, isDeposited, bankAccountId, depositDate, depositedById } = req.body;
        const donation = await db.sequelize.transaction(async (t) => {
            const newDonation = await db.Donation.create({
                churchId: req.user.churchId,
                userId: userId || null,
                amount,
                currency: currency || 'HTG',
                type,
                date: date || new Date(),
                paymentMethod,
                status: isDeposited ? 'deposited' : 'pending',
                bankAccountId: isDeposited ? bankAccountId : null,
                depositDate: isDeposited ? depositDate : null,
                createdById: req.user.id,
                depositedById: isDeposited ? (depositedById || req.user.id) : null,
                notes
            }, { transaction: t });

            if (isDeposited && bankAccountId) {
                // Direct deposit to Bank Account
                const bankAccount = await db.BankAccount.findOne({
                    where: { id: bankAccountId, churchId: req.user.churchId },
                    transaction: t
                });

                if (!bankAccount) {
                    throw new Error("Compte bancaire introuvable.");
                }

                await bankAccount.increment('balance', { by: amount, transaction: t });
            } else {
                // Cash in Hand (General Treasury)
                const [currRecord] = await db.Currency.findOrCreate({
                    where: { churchId: req.user.churchId, code: currency || 'HTG' },
                    defaults: { balance: 0, isActive: true },
                    transaction: t
                });

                await currRecord.increment('balance', { by: amount, transaction: t });
            }

            return newDonation;
        });

        res.status(201).json(donation);
    } catch (error) {
        console.error("Create Donation Error:", error);
        res.status(500).json({ message: "Erreur lors de la création du don" });
    }
};

exports.getChurchDonations = async (req, res) => {
    try {
        const churchId = parseInt(req.user.churchId);
        const donations = await db.Donation.findAll({
            where: { churchId },
            include: [
                { model: db.User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: db.User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] },
                { model: db.User, as: 'depositedBy', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['date', 'DESC']]
        });
        console.log(`[Donations] Found ${donations.length} records for church ${churchId}`);
        res.json(donations);
    } catch (error) {
        console.error("Get Church Donations Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des dons" });
    }
};

exports.getUserDonations = async (req, res) => {
    try {
        const churchId = parseInt(req.user.churchId);
        const donations = await db.Donation.findAll({
            where: {
                churchId,
                userId: req.user.id
            },
            order: [['date', 'DESC']]
        });
        res.json(donations);
    } catch (error) {
        console.error("Get User Donations Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération de vos dons" });
    }
};

exports.getDonationStats = async (req, res) => {
    try {
        const churchId = parseInt(req.user.churchId);
        const donations = await db.Donation.findAll({
            where: { churchId }
        });

        console.log(`[Stats] Found ${donations.length} donations for church ${churchId}`);

        const Op = db.Sequelize.Op;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const previousMonth = previousMonthDate.getMonth();
        const previousYear = previousMonthDate.getFullYear();

        // Stats by currency
        const stats = donations.reduce((acc, d) => {
            const curr = d.currency || 'HTG';
            if (!acc[curr]) {
                acc[curr] = {
                    total: 0,
                    currentMonthTotal: 0,
                    previousMonthTotal: 0,
                    byType: {}
                };
            }

            const amount = parseFloat(d.amount);
            const typeKey = (d.type || 'AUTRE').toLowerCase();

            acc[curr].total += amount;
            acc[curr].byType[typeKey] = (acc[curr].byType[typeKey] || 0) + amount;

            const dDate = new Date(d.date);
            const dMonth = dDate.getMonth();
            const dYear = dDate.getFullYear();

            if (dMonth === currentMonth && dYear === currentYear) {
                acc[curr].currentMonthTotal += amount;
            } else if (dMonth === previousMonth && dYear === previousYear) {
                acc[curr].previousMonthTotal += amount;
            }

            return acc;
        }, {});

        // Calculate trends
        Object.keys(stats).forEach(curr => {
            const s = stats[curr];
            if (s.previousMonthTotal > 0) {
                s.growth = ((s.currentMonthTotal - s.previousMonthTotal) / s.previousMonthTotal) * 100;
            } else {
                s.growth = s.currentMonthTotal > 0 ? 100 : 0;
            }
        });

        // Add actual currency balances - ensure ALL currencies are included
        const currencyBalances = await db.Currency.findAll({
            where: { churchId, isActive: true }
        });

        currencyBalances.forEach(cb => {
            if (stats[cb.code]) {
                stats[cb.code].balance = parseFloat(cb.balance);
            } else {
                // Create entry for currencies with no donations yet
                stats[cb.code] = {
                    total: 0,
                    currentMonthTotal: 0,
                    previousMonthTotal: 0,
                    byType: {},
                    growth: 0,
                    balance: parseFloat(cb.balance)
                };
            }
        });

        res.json(stats);
    } catch (error) {
        console.error("Get Donation Stats Error:", error);
        res.status(500).json({ message: "Erreur lors du calcul des statistiques" });
    }
};

exports.getFinancesOverview = async (req, res) => {
    try {
        const Op = db.Sequelize.Op;
        const monthsCount = 6;
        const result = [];
        const churchId = req.user.churchId;

        const now = new Date();
        for (let i = monthsCount - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const monthLabel = startOfMonth.toLocaleString('fr-FR', { month: 'short' });

            const income = await db.Donation.sum('amount', {
                where: {
                    churchId,
                    date: { [Op.between]: [startOfMonth, endOfMonth] }
                }
            }) || 0;

            const expenses = await db.Expense.sum('amount', {
                where: {
                    churchId,
                    date: { [Op.between]: [startOfMonth, endOfMonth] }
                }
            }) || 0;

            result.push({
                name: monthLabel,
                income: parseFloat(income),
                expenses: parseFloat(expenses)
            });
        }

        res.json(result);
    } catch (error) {
        console.error("Get Finances Overview Error:", error);
        res.status(500).json({ message: "Erreur lors du calcul de l'aperçu financier" });
    }
};

exports.getBalances = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const balances = await db.Currency.findAll({
            where: { churchId, isActive: true },
            attributes: ['code', 'balance']
        });
        res.json(balances);
    } catch (error) {
        console.error("Get Balances Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des soldes" });
    }
};

exports.updateDonation = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, date, note } = req.body;
        const donation = await db.Donation.findOne({ where: { id, churchId: req.user.churchId } });
        if (!donation) return res.status(404).json({ message: "Don introuvable" });

        const oldAmount = parseFloat(donation.amount);
        const newAmount = parseFloat(amount || oldAmount);
        const diff = newAmount - oldAmount;

        await db.sequelize.transaction(async (t) => {
            await donation.update({ amount: newAmount, date: date || donation.date, notes: note || donation.notes }, { transaction: t });

            if (diff !== 0) {
                if (donation.status === 'deposited' && donation.bankAccountId) {
                    const bankAccount = await db.BankAccount.findByPk(donation.bankAccountId, { transaction: t });
                    if (bankAccount) await bankAccount.increment('balance', { by: diff, transaction: t });
                } else {
                    const curr = await db.Currency.findOne({ where: { churchId: req.user.churchId, code: donation.currency || 'HTG' }, transaction: t });
                    if (curr) await curr.increment('balance', { by: diff, transaction: t });
                }
            }
        });

        res.json({ message: "Don mis à jour", donation });
    } catch (err) {
        console.error("Update Donation Error:", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du don" });
    }
};
