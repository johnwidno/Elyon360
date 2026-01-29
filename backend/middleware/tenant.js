const db = require('../models');

const tenantMiddleware = async (req, res, next) => {
    // 1. Log pou debug
    // console.log("Tenant Middleware - Headers:", req.headers);

    // 2. Detekte Sous-domaine
    // Priorité 1: Header 'x-tenant-id' (Frontend voye sa explisitman)
    // Priorité 2: Host / Origin (Pou production)

    let subdomain = req.headers['x-tenant-id']?.trim();
    const host = req.headers.host || req.headers.origin;

    if (!subdomain && host) {
        if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
            const parts = host.split('.');
            if (parts.length > 2) {
                subdomain = parts[0];
            }
        }
    }

    console.log(`[TenantMiddleware] Host: ${host}, Header Subdomain: ${req.headers['x-tenant-id']}`);
    console.log(`[TenantMiddleware] Detected Subdomain: ${subdomain}`);

    // 3. Si pa gen sous-domaine, nou sou sit prensipal la (SaaS)
    if (!subdomain || subdomain === 'www' || subdomain === 'app') {
        req.isSaaS = true;
        req.church = null;
        console.log("[TenantMiddleware] Switching to SaaS mode");
        return next();
    }

    // 3. Search for the Church
    try {
        console.log(`[TenantMiddleware] Searching for Church with identifier: "${subdomain}"`);

        // Priority 1: Subdomain or Custom Domain (Strict)
        let church = await db.Church.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { subdomain: subdomain },
                    { customDomain: subdomain }
                ]
            }
        });

        // Priority 2: Acronym fallback (ONLY if not found by subdomain and in strict format)
        if (!church) {
            church = await db.Church.findOne({
                where: {
                    [db.Sequelize.Op.or]: [
                        { acronym: subdomain.toUpperCase() },
                        { acronym: subdomain.toLowerCase() }
                    ]
                }
            });
        }

        if (!church) {
            console.warn(`[TenantMiddleware] No church found in DB for: "${subdomain}"`);
            return res.status(404).json({ message: `[Middleware] Église non trouvée pou : ${subdomain}` });
        }

        // 4. Check for Subscription Expiration & Status
        const now = new Date();
        if (church.status === 'active' && church.subscriptionExpiresAt && new Date(church.subscriptionExpiresAt) < now) {
            console.log(`[TenantMiddleware] Church "${church.name}" subscription EXPIRED. Automating suspension.`);
            church.status = 'inactive';
            await church.save();
        }

        if (church.status === 'inactive') {
            console.warn(`[TenantMiddleware] Access BLOCKED for inactive church: "${church.name}"`);
            return res.status(403).json({
                message: "L'accès à cette plateforme est temporairement suspendu. Veuillez contacter l'administrateur système pour régulariser votre abonnement.",
                code: "CHURCH_INACTIVE"
            });
        }

        // 5. Tache lelgiz la nan request la pou controllers yo ka itilize l
        req.church = church;
        req.isSaaS = false;
        console.log(`[TenantMiddleware] SUCCESS! Church found: ${church.name} (ID: ${church.id})`);
        next();
    } catch (err) {
        console.error("[TenantMiddleware] CRITICAL ERROR:", err);
        return res.status(500).json({ message: "Erreur serveur (Tenant)" });
    }
};

module.exports = tenantMiddleware;
