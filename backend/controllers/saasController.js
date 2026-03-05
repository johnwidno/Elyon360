const db = require('../models');
const bcrypt = require('bcryptjs');
const moncashService = require('../services/moncashService');
const stripeService = require('../services/stripeService');

// Get Church Public Info
exports.getChurchPublicInfo = async (req, res) => {
    try {
        const subdomain = req.params.subdomain?.trim();
        console.log(`[Controller] Fetching Public Info for identifier: "${subdomain}"`);

        const church = await db.Church.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { subdomain: subdomain },
                    { customDomain: subdomain },
                    { acronym: subdomain.toUpperCase() },
                    { acronym: subdomain.toLowerCase() }
                ]
            }
        });

        if (!church) {
            console.warn(`[Controller] No church found for identifier: "${subdomain}"`);
            // Check all churches to see if there's a sneaky mismatch
            const all = await db.Church.findAll({ attributes: ['id', 'subdomain', 'acronym'] });
            console.log("[Controller] Available churches in DB:", JSON.stringify(all));

            return res.status(404).json({ message: `[Controller] Église non trouvée pour : ${subdomain}` });
        }

        console.log(`[Controller] Church found: "${church.name}" (ID: ${church.id})`);

        // Fetch public events for this church
        const events = await db.Event.findAll({
            where: { churchId: church.id },
            order: [['startDate', 'ASC']],
            limit: 5
        });

        res.json({ church, events });
    } catch (error) {
        console.error("Public Info error:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Helper function to create church and all its dependencies
// This maintains the "Atomic" creation logic used in multiple places
const _createChurchFull = async (data, t) => {
    const { churchName, subdomain, adminEmail, adminPassword, planId, acronym, contactPhone, orderId, transactionId, status = 'active' } = data;

    console.log(`[_createChurchFull] Starting atomic creation for: ${churchName} (${subdomain})`);

    // 0. Plan check
    const selectedPlan = await db.Plan.findByPk(planId, { transaction: t });
    if (!selectedPlan) {
        throw new Error(`Plan avec l'ID ${planId} introuvable.`);
    }

    let subscriptionStartedAt = new Date();
    let expirationDate = new Date();

    if (selectedPlan.startDate && selectedPlan.endDate) {
        subscriptionStartedAt = new Date(selectedPlan.startDate);
        expirationDate = new Date(selectedPlan.endDate);
    } else {
        const months = selectedPlan.durationMonths || (selectedPlan.interval === 'yearly' ? 12 : 1);
        expirationDate.setMonth(expirationDate.getMonth() + months);
    }

    // 1. Create Church
    console.log("[_createChurchFull] Step 1: Creating Church record...");
    const church = await db.Church.create({
        name: churchName,
        acronym: acronym,
        subdomain: subdomain,
        contactPhone: contactPhone,
        contactEmail: adminEmail,
        planId: planId,
        status: status,
        moncashOrderId: orderId,
        moncashTransactionId: transactionId,
        subscriptionStartedAt: status === 'active' ? subscriptionStartedAt : null,
        subscriptionExpiresAt: status === 'active' ? expirationDate : null
    }, { transaction: t });

    const churchId = church.id;
    console.log(`[_createChurchFull] Church created with ID: ${churchId}`);

    // 2. Seed Data
    console.log("[_createChurchFull] Step 2: Seeding base data (Currencies, Roles...)...");
    await db.Currency.bulkCreate([
        { churchId, code: 'HTG', symbol: 'G' },
        { churchId, code: 'USD', symbol: '$' },
        { churchId, code: 'EUR', symbol: '€' }
    ], { transaction: t });

    await db.DonationType.bulkCreate([
        { churchId, name: 'OFFRANDE', isMandatory: true },
        { churchId, name: 'DIME', isMandatory: true },
        { churchId, name: 'PROMESSE', isMandatory: true },
        { churchId, name: 'DON_SPECIAL', isMandatory: true }
    ], { transaction: t });

    await db.PaymentMethod.bulkCreate([
        { churchId, name: 'CASH' },
        { churchId, name: 'VIREMENT' },
        { churchId, name: 'CHEQUE' },
        { churchId, name: 'CARTE DE CREDIT' }
    ], { transaction: t });

    await db.Role.bulkCreate([
        { churchId, name: 'admin', permissions: ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'] },
        { churchId, name: 'staff', permissions: ['members', 'events', 'groups', 'sunday-school', 'ceremonies'] },
        { churchId, name: 'member', permissions: [] }
    ], { transaction: t });

    const typeMember = await db.ContactType.create({ churchId, name: 'Membre', isSystem: true }, { transaction: t });
    const typeOrg = await db.ContactType.create({ churchId, name: 'Organisation', isSystem: true }, { transaction: t });

    await db.ContactSubtype.bulkCreate(['Baptisé', 'Adhérent', 'Affilié', 'Candidat au baptême', 'Autre'].map(s => ({
        churchId, contactTypeId: typeMember.id, name: s
    })), { transaction: t });

    await db.ContactSubtype.bulkCreate(['Ong', 'Eglise', 'Eglise partenaire', 'Fournisseur', 'Université', 'Ecole', 'Hôpital', 'Autre'].map(s => ({
        churchId, contactTypeId: typeOrg.id, name: s
    })), { transaction: t });

    await db.MemberCategory.bulkCreate(['Baptisé', 'Non baptisé', 'Adhérent', 'Candidat au baptême', 'Affilié', 'Enfant', 'Transféré', 'Autre'].map(name => ({
        churchId, name
    })), { transaction: t });

    await db.EventType.bulkCreate(['Service', 'Culte', 'Conférence', 'Formation', 'Étude', 'Service de prière', 'Service de jeune', 'Retraite spirituelle', 'Activité sociale', 'Visite', 'Excursion', 'Autre'].map(name => ({
        churchId, name
    })), { transaction: t });

    // 3. System Organization
    console.log("[_createChurchFull] Step 3: Creating System Organization...");
    const egliseSubtype = await db.ContactSubtype.findOne({ where: { churchId, name: 'Eglise' }, transaction: t });
    await db.Organization.create({
        churchId,
        name: church.name,
        email: church.contactEmail,
        phone: church.contactPhone,
        subtypeId: egliseSubtype ? egliseSubtype.id : null,
        isSystem: true,
        description: "Votre organisation (Auto-générée)",
        status: 'Actif'
    }, { transaction: t });

    // 4. Create Admin User
    console.log(`[_createChurchFull] Step 4: Creating Admin User with email: ${adminEmail}`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const newUser = await db.User.create({
        churchId: church.id,
        firstName: 'Admin',
        lastName: 'Principal',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'Actif'
    }, { transaction: t });

    // 5. Notify Super Admins
    console.log("[_createChurchFull] Step 5: Sending notifications to Super Admins...");
    try {
        const superAdmins = await db.User.findAll({
            where: { role: { [db.Sequelize.Op.like]: '%"super_admin"%' } },
            transaction: t
        });
        if (superAdmins.length > 0) {
            await db.Notification.bulkCreate(superAdmins.map(admin => ({
                userId: admin.id,
                title: `Nouvelle Inscription [ID:${church.id}]`,
                message: `Une nouvelle église "${church.name}" (${church.acronym}) s'est inscrite.`,
                type: 'system',
                isRead: false
            })), { transaction: t });
        }
    } catch (notifErr) {
        console.warn("[_createChurchFull] Warning: Notification failed but continuing...", notifErr.message);
    }

    console.log("[_createChurchFull] ✅ Atomic creation completed successfully.");
    return church;
};

/**
 * Shared logic to handle successful payment verification and activation.
 * Can be called from Redirects or Webhooks.
 */
const _handleSuccessfulPayment = async (orderId, source = 'unknown', gatewayReference = null) => {
    const t = await db.sequelize.transaction();
    try {
        console.log(`[${source}] --- DEBUT ACTIVATION --- Order: ${orderId}`);

        // 1. Idempotency Check: Already created?
        const existingChurch = await db.Church.findOne({ where: { moncashOrderId: orderId }, transaction: t });
        if (existingChurch) {
            await t.commit();
            console.log(`[${source}] Church ${existingChurch.id} was already active for Order: ${orderId}`);
            return { success: true, alreadyActive: true, churchId: existingChurch.id };
        }

        // 2. Find Pending Registration
        const pending = await db.PendingRegistration.findOne({ where: { orderId }, transaction: t });
        if (!pending) {
            await t.rollback();
            console.error(`[${source}] Pending registration not found for orderId: ${orderId}`);
            return { success: false, message: "Inscription en attente non trouvée." };
        }

        // 3. Defensive Parsing
        let churchData = typeof pending.churchData === 'string' ? JSON.parse(pending.churchData) : pending.churchData;
        let adminData = typeof pending.adminData === 'string' ? JSON.parse(pending.adminData) : pending.adminData;

        // 4. Final Collision Check (Subdomain/Acronym)
        const collision = await db.Church.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { subdomain: churchData.subdomain },
                    { acronym: churchData.acronym }
                ]
            },
            transaction: t
        });

        if (collision) {
            await t.rollback();
            console.error(`[${source}] Collision detected for subdomain/acronym: ${churchData.subdomain}/${churchData.acronym}`);
            return { success: false, message: "Ce sous-domaine ou acronyme a été pris entre-temps par une autre église." };
        }

        // 5. Create Church and Admin
        const church = await _createChurchFull({
            ...churchData,
            ...adminData,
            planId: pending.planId,
            orderId: pending.orderId,
            transactionId: gatewayReference,
            status: 'active'
        }, t);

        // 6. Log Transaction
        await db.SubscriptionTransaction.create({
            churchId: church.id,
            planId: pending.planId,
            amount: pending.amount,
            currency: 'HTG',
            paymentMethod: pending.paymentMethod,
            orderId: pending.orderId,
            gatewayReference: gatewayReference,
            status: 'success',
            periodStart: church.subscriptionStartedAt,
            periodEnd: church.subscriptionExpiresAt
        }, { transaction: t });

        // 7. Clean up
        await pending.destroy({ transaction: t });

        await t.commit();
        console.log(`[${source}] --- FIN ACTIVATION REUSSIE --- Church: ${church.id}`);
        return { success: true, churchId: church.id };
    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error(`[${source}] !!! ERREUR ACTIVATION !!! Order ${orderId}:`, error);
        return { success: false, message: "Erreur lors de l'activation.", error: error.message };
    }
};

exports.registerChurch = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { churchName, subdomain, adminEmail, adminPassword, plan, acronym, contactPhone, paymentMethod = 'moncash' } = req.body;

        // 1. Validation basics
        const existing = await db.Church.findOne({
            where: { [db.Sequelize.Op.or]: [{ subdomain }, { acronym }] },
            transaction: t
        });
        if (existing) {
            await t.rollback();
            return res.status(400).json({ message: "Ce sous-domaine ou acronyme est déjà utilisé." });
        }

        const restricted = ['admin-system', 'www', 'app', 'elyonsys'];
        if (restricted.includes(subdomain.toLowerCase())) {
            await t.rollback();
            return res.status(400).json({ message: "Ce sous-domaine est réservé par le système." });
        }

        const selectedPlan = await db.Plan.findByPk(plan, { transaction: t });
        if (!selectedPlan) {
            await t.rollback();
            return res.status(400).json({ message: "Plan invalide." });
        }

        // 2. Branch: Free Plan vs Paid Plan
        const isFreePlan = parseFloat(selectedPlan.price) === 0;
        if (isFreePlan) {
            // IMMEDIATE creation for free plans
            const church = await _createChurchFull({
                churchName, subdomain, adminEmail, adminPassword, planId: plan, acronym, contactPhone, status: 'active'
            }, t);

            // Log Free Transaction for history
            await db.SubscriptionTransaction.create({
                churchId: church.id,
                planId: plan,
                amount: 0,
                currency: 'HTG',
                paymentMethod: 'system',
                orderId: `FREE_${Date.now()}`,
                status: 'success',
                periodStart: church.subscriptionStartedAt,
                periodEnd: church.subscriptionExpiresAt
            }, { transaction: t });

            await t.commit();
            return res.status(201).json({
                message: "Église créée avec succès !",
                church: { id: church.id, name: church.name, subdomain: church.subdomain },
                redirectUrl: null
            });
        } else {
            // PAID PLAN: Create Pending Registration instead of Church
            const orderId = `REG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const amount = parseFloat(selectedPlan.price);

            let redirectUrl = null;
            try {
                if (paymentMethod === 'stripe') {
                    const session = await stripeService.createCheckoutSession(orderId, amount, churchName);
                    redirectUrl = session.redirectUrl;
                } else {
                    const payment = await moncashService.createPayment(orderId, amount);
                    redirectUrl = payment.redirectUrl;
                }
            } catch (pError) {
                console.error("[Payment Init Error]", pError);
                await t.rollback();
                return res.status(500).json({ message: "Erreur lors de l'initialisation du paiement." });
            }

            // Save pending data
            await db.PendingRegistration.create({
                orderId,
                churchData: { churchName, subdomain, acronym, contactPhone },
                adminData: { adminEmail, adminPassword },
                planId: plan,
                paymentMethod,
                amount,
                status: 'pending'
            }, { transaction: t });

            await t.commit();
            return res.status(201).json({
                message: "Inscription en cours. Veuillez compléter le paiement.",
                redirectUrl: redirectUrl,
                orderId: orderId // Send orderId so frontend can store it for verification
            });
        }
    } catch (err) {
        if (!t.finished) await t.rollback();
        console.error("Register Error:", err);
        res.status(500).json({ message: "Erreur lors de la création de l'église.", details: err.message });
    }
};

exports.getGlobalStats = async (req, res) => {
    try {
        const [churchCount, userCount, donationTotal] = await Promise.all([
            db.Church.count(),
            db.User.count(),
            db.Donation.sum('amount')
        ]);

        res.json({
            churchCount,
            userCount,
            donationTotal: donationTotal || 0
        });
    } catch (error) {
        console.error("Global Stats Error:", error);
        res.status(500).json({ message: "Erreur lors du calcul des statistiques globales." });
    }
};

// Stripe payment verification (Redirect handler)
exports.verifyStripePayment = async (req, res) => {
    try {
        const { session_id, orderId } = req.query;
        console.log(`[Stripe Redirect] req.query:`, req.query);
        console.log(`[Stripe Redirect] Verifying session: ${session_id}`);

        if (!session_id) {
            return res.status(400).json({ success: false, message: "Session ID manquant." });
        }

        const sessionData = await stripeService.verifySession(session_id);

        if (sessionData.paid) {
            const finalOrderId = orderId || sessionData.orderId;
            const result = await _handleSuccessfulPayment(finalOrderId, 'StripeRedirect', session_id);

            if (result.success) {
                return res.json({
                    success: true,
                    message: result.alreadyActive ? "Déjà vérifié." : "Paiement Stripe confirmé.",
                    churchId: result.churchId
                });
            } else {
                return res.status(result.message === "Inscription en attente non trouvée." ? 404 : 500).json(result);
            }
        }

        res.status(400).json({ success: false, message: "Le paiement Stripe n'a pas été complété." });
    } catch (error) {
        console.error("[Stripe Redirect] CRITICAL ERROR:", error);
        res.status(500).json({ success: false, message: "Erreur lors de la vérification Stripe.", details: error.message });
    }
};

// MonCash payment verification (Redirect handler)
exports.verifyPayment = async (req, res) => {
    try {
        const { transactionId, orderId } = req.query;
        console.log(`[MonCash Verify] Incoming request - transactionId: ${transactionId}, orderId: ${orderId}`);

        // Strategy 1: Verify by transactionId (MonCash redirect sends this)
        if (transactionId) {
            try {
                const response = await moncashService.getPaymentDetails(transactionId);
                console.log("[MonCash Verify] getPaymentDetails response:", JSON.stringify(response, null, 2));

                // MonCash nests payment data under "payment" key
                const payment = response.payment || response;
                const isSuccessful = (
                    response.message === 'successful' ||
                    payment.message === 'successful' ||
                    response.status === 'successful' ||
                    response.status === 'success' ||
                    payment.status === 'successful'
                );

                if (isSuccessful) {
                    // MonCash returns the orderId we sent during createPayment as "reference" inside payment
                    let paymentOrderId = orderId ||
                        payment.reference ||
                        payment.order_id ||
                        payment.orderId ||
                        response.reference ||
                        response.order_id;

                    console.log(`[MonCash Verify] Payment successful. Extracted paymentOrderId: ${paymentOrderId}`);

                    // Fallback Strategy: If we have transactionId but no orderId, and we are in dev/simulation
                    if (!paymentOrderId && transactionId && process.env.NODE_ENV === 'development') {
                        console.warn("[MonCash Verify] No orderId found in response, attempting fallback to most recent pending for dev/test");
                        const latestPending = await db.PendingRegistration.findOne({
                            where: { status: 'pending', paymentMethod: 'moncash' },
                            order: [['createdAt', 'DESC']]
                        });
                        if (latestPending) {
                            console.log(`[MonCash Verify] Fallback mapping transaction to orderId: ${latestPending.orderId}`);
                            paymentOrderId = latestPending.orderId;
                        }
                    }

                    if (!paymentOrderId) {
                        console.error("[MonCash Verify] Payment verified but orderId could not be extracted from response or fallback");
                        return res.status(400).json({ success: false, message: "Paiement vérifié mais identifiant de commande introuvable." });
                    }

                    const result = await _handleSuccessfulPayment(paymentOrderId, 'MonCashRedirect', transactionId);
                    if (result.success) {
                        return res.json({
                            success: true,
                            message: result.alreadyActive ? "Déjà vérifié." : "Paiement réussi, église activée.",
                            churchId: result.churchId
                        });
                    } else {
                        console.error("[MonCash Verify] _handleSuccessfulPayment failed:", result.message);
                        return res.status(400).json(result);
                    }
                } else {
                    console.warn("[MonCash Verify] Payment NOT successful. Response:", JSON.stringify(response, null, 2));
                    return res.status(400).json({ success: false, message: "Le paiement MonCash n'a pas été complété." });
                }
            } catch (txErr) {
                console.error("[MonCash Verify] Error verifying by transactionId:", txErr.message);
                // Fall through to Strategy 2
            }
        }

        // Strategy 2: Verify by orderId (if frontend passes it, or as fallback)
        if (orderId) {
            try {
                console.log(`[MonCash Verify] Trying RetrieveOrderPayment with orderId: ${orderId}`);
                const response = await moncashService.getPaymentByOrderId(orderId);
                console.log("[MonCash Verify] getPaymentByOrderId response:", JSON.stringify(response, null, 2));

                const payment = response.payment || response;
                const isSuccessful = (
                    response.message === 'successful' ||
                    payment.message === 'successful' ||
                    response.status === 'successful' ||
                    response.status === 'success' ||
                    payment.status === 'successful'
                );

                if (isSuccessful) {
                    console.log(`[MonCash Verify] Order payment verified successfully for orderId: ${orderId}`);
                    // Try to get transactionId if available in response
                    const gatewayRef = payment.transaction_id || payment.transactionId || transactionId;
                    const result = await _handleSuccessfulPayment(orderId, 'MonCashOrderVerify', gatewayRef);
                    if (result.success) {
                        return res.json({
                            success: true,
                            message: result.alreadyActive ? "Déjà vérifié." : "Paiement réussi, église activée.",
                            churchId: result.churchId
                        });
                    } else {
                        return res.status(404).json(result);
                    }
                }
            } catch (orderErr) {
                console.error("[MonCash Verify] Error verifying by orderId:", orderErr.message);
            }
        }

        // If we get here, neither strategy worked
        console.error("[MonCash Verify] All verification strategies failed.");
        res.status(400).json({ success: false, message: "Le paiement n'a pas pu être vérifié. Veuillez contacter le support." });
    } catch (error) {
        console.error("[MonCash Verify] Critical Error:", error);
        res.status(500).json({ message: "Erreur lors de la vérification du paiement." });
    }
};


/**
 * STRIPE WEBHOOK HANDLER (Asynchronous activation)
 */
exports.handleStripeWebhook = async (req, res) => {
    let event;
    try {
        // Stripe usually sends the event in req.body
        event = req.body;
        console.log(`[Stripe Webhook] Received event: ${event.type}`);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = session.metadata?.orderId;

            if (orderId) {
                console.log(`[Stripe Webhook] Activation requested for Order: ${orderId}, Session: ${session.id}`);
                await _handleSuccessfulPayment(orderId, 'StripeWebhook', session.id);
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error(`[Stripe Webhook] Error:`, err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

/**
 * MONCASH WEBHOOK HANDLER (Asynchronous activation)
 */
exports.handleMonCashWebhook = async (req, res) => {
    try {
        // MonCash IPN/Webhook usually sends data via POST
        const data = req.body;
        console.log(`[MonCash Webhook] Received notification:`, JSON.stringify(data));

        // MonCash structure varies, checking common fields
        const orderId = data.orderId || data.order_id || data.reference || (data.payment ? data.payment.reference : null);
        const transactionId = data.transactionId || data.transaction_id || (data.payment ? (data.payment.transaction_id || data.payment.transactionId) : null);
        const status = data.status || (data.payment ? data.payment.status : null);

        if (orderId && (status === 'successful' || status === 'success')) {
            console.log(`[MonCash Webhook] Activation requested for Order: ${orderId}, Transaction: ${transactionId}`);
            await _handleSuccessfulPayment(orderId, 'MonCashWebhook', transactionId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error(`[MonCash Webhook] Error:`, error);
        res.status(500).send('Internal Error');
    }
};

/**
 * MANUAL PAYMENT VERIFICATION
 * Fallback: if MonCash doesn't redirect properly, the user can verify their pending payment manually.
 * This endpoint takes the orderId (stored in localStorage) and checks MonCash API directly.
 */
exports.verifyPendingPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        console.log(`[Manual Verify] Checking pending payment for orderId: ${orderId}`);

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Identifiant de commande manquant." });
        }

        // Check if already activated
        const existingChurch = await db.Church.findOne({ where: { moncashOrderId: orderId } });
        if (existingChurch) {
            return res.json({ success: true, alreadyActive: true, message: "Église déjà activée.", churchId: existingChurch.id });
        }

        // Check if pending registration exists
        const pending = await db.PendingRegistration.findOne({ where: { orderId } });
        if (!pending) {
            return res.status(404).json({ success: false, message: "Aucune inscription en attente trouvée pour cet identifiant." });
        }

        // Try to verify with MonCash API
        let paymentVerified = false;

        if (pending.paymentMethod === 'moncash') {
            try {
                const response = await moncashService.getPaymentByOrderId(orderId);
                console.log("[Manual Verify] MonCash RetrieveOrderPayment response:", JSON.stringify(response, null, 2));

                const payment = response.payment || response;
                paymentVerified = (
                    response.message === 'successful' ||
                    payment.message === 'successful' ||
                    response.status === 'successful' ||
                    response.status === 'success' ||
                    payment.status === 'successful'
                );

                if (paymentVerified) {
                    const gatewayRef = payment.transaction_id || payment.transactionId;
                    const result = await _handleSuccessfulPayment(orderId, 'ManualVerify', gatewayRef);
                    if (result.success) {
                        return res.json({
                            success: true,
                            message: "Paiement vérifié et église activée avec succès !",
                            churchId: result.churchId
                        });
                    } else {
                        return res.status(500).json(result);
                    }
                }
            } catch (mcErr) {
                console.error("[Manual Verify] MonCash API call failed:", mcErr.message);
                return res.status(400).json({
                    success: false,
                    message: "Impossible de vérifier le paiement auprès de MonCash. Le paiement n'a peut-être pas encore été effectué."
                });
            }
        } else if (pending.paymentMethod === 'stripe') {
            return res.status(400).json({ success: false, message: "Utilisez la vérification Stripe pour les paiements par carte." });
        }

        res.status(400).json({
            success: false,
            message: "Le paiement n'a pas pu être vérifié ou n'a pas encore été complété."
        });
    } catch (error) {
        console.error("[Manual Verify] Error:", error);
        res.status(500).json({ message: "Erreur lors de la vérification manuelle." });
    }
};
