const db = require('../models');

const tenantMiddleware = async (req, res, next) => {
    // 1. Log pou debug
    // console.log("Tenant Middleware - Headers:", req.headers);

    // Public SaaS routes that should bypass tenant restrictions
    const publicSaaSRoutes = [
        '/api/saas/plans',
        '/api/saas/register-church',
        '/api/saas/payment/verify',          // MonCash redirect verification
        '/api/saas/payment/verify-pending',   // Manual verification fallback
        '/api/saas/payment/stripe/verify',    // Stripe redirect verification
        '/api/saas/payment/stripe/webhook',   // Stripe webhook
        '/api/saas/payment/moncash/webhook',  // MonCash webhook
        '/api/saas/church-public-info',
        '/api/saas/global-stats'
    ];

    // Debug: log the request URL/path
    console.log(`[TenantMiddleware] Request URL: ${req.url}, Path: ${req.path}`);

    // Check if this is a public SaaS route (check both url and path)
    const isPublicRoute = publicSaaSRoutes.some(route =>
        req.url?.startsWith(route) || req.path?.startsWith(route)
    );

    if (isPublicRoute) {
        req.isSaaS = true;
        req.church = null;
        console.log(`[TenantMiddleware] ✅ Public SaaS route detected, bypassing church validation`);
        return next();
    }

    // 2. Detekte Sous-domaine
    // Priorité 1: Header 'x-tenant-id' (Frontend voye sa explisitman)
    // Priorité 2: Host / Origin (Pou production)

    let subdomain = req.headers['x-tenant-id']?.trim();
    let host = req.headers.host || req.headers.origin || '';

    // Nettoyer le format d'host/origine
    host = host.replace(/^https?:\/\//, '');

    // Si le subdomain contient un domaine complet (ex: een.ekklesia360.com), on ne garde que le premier segment
    if (subdomain && subdomain.includes('.')) {
        subdomain = subdomain.split('.')[0];
    }

    if (!subdomain && host) {
        if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
            const parts = host.split('.');
            // Gérer les domaines complexes ou les accès via render.com
            if (parts.length >= 2) {
                // Si c'est du style subdomain.domain.com, on prend parts[0]
                // Si c'est legliz-pro-1.onrender.com, on prend parts[0]
                subdomain = parts[0];
            }
        }
    }

    console.log(`[TenantMiddleware] Host: ${host}, Header Subdomain: ${req.headers['x-tenant-id']}`);
    console.log(`[TenantMiddleware] Detected Subdomain: ${subdomain}`);

    // Liste des sous-domaines considérés comme SaaS (système principal)
    const saasSubdomains = ['www', 'app', 'elyonsyst360', 'elyonssys360-frontend'];

    // 3. Si pa gen sous-domaine, nou sou sit prensipal la (SaaS)
    if (!subdomain || saasSubdomains.includes(subdomain.toLowerCase())) {
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
        const isSystemChurch = church.id === 1 || church.subdomain === 'admin-system';

        if (!isSystemChurch && church.status === 'active' && church.subscriptionExpiresAt && new Date(church.subscriptionExpiresAt) < now) {
            console.log(`[TenantMiddleware] Church "${church.name}" subscription EXPIRED. Automating suspension.`);
            church.status = 'suspended'; // Changed from 'inactive'
            await church.save();
        }

        // Check if path is an auth route (using includes for safety against potential prefix issues)
        const isAuthRoute = req.path.includes('/api/auth/');

        if ((church.status === 'inactive' || church.status === 'suspended') && !isSystemChurch && !isAuthRoute) {
            // Hotfix: Allow Super Admin to bypass inactive status
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    const jwt = require('jsonwebtoken'); // Lazy load
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
                    if (decoded && (decoded.role === 'super_admin' || decoded.role.includes('super_admin'))) {
                        console.log(`[TenantMiddleware] Super Admin detected. Bypassing inactive block for church: "${church.name}"`);
                        req.church = church;
                        req.isSaaS = false;
                        return next();
                    }
                } catch (jwtErr) {
                    console.warn("[TenantMiddleware] Failed to verify token for bypass:", jwtErr.message);
                    // Continue to block
                }
            }

            console.warn(`[TenantMiddleware] Access BLOCKED for ${church.status} church: "${church.name}"`);
            return res.status(403).json({
                message: church.status === 'suspended'
                    ? "Votre abonnement a expiré. Veuillez le renouveler pour continuer à utiliser les services de la plateforme ElyonSys 360."
                    : "L'accès à cette plateforme est temporairement suspendu. Veuillez contacter l'administrateur système.",
                code: church.status === 'suspended' ? "CHURCH_EXPIRED" : "CHURCH_INACTIVE",
                churchName: church.name,
                expiresAt: church.subscriptionExpiresAt
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
