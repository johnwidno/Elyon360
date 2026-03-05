const jwt = require('jsonwebtoken');
const db = require('../models');

exports.protect = async (req, res, next) => {
    // Allow unauthenticated GET access to any search-builder endpoint
    if (req.method === 'GET' && req.path.startsWith('/api/search-builder')) {
        return next();
    }

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log("AuthGuard: Token extracted successfully");

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

            // Find user
            req.user = await db.User.findByPk(decoded.id);

            if (!req.user) {
                return res.status(401).json({ message: "Non autorisé, utilisateur introuvable." });
            }

            return next();
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            return res.status(401).json({ message: "Non autorisé, token invalide." });
        }
    }

    // No token provided
    return res.status(401).json({ message: "Non autorisé, pas de token." });
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const hasRole = roles.some(r => userRoles.includes(r));
        if (!hasRole) {
            return res.status(403).json({
                message: `Vos rôles (${userRoles.join(', ')}) ne sont pas autorisés à accéder à cette route.`
            });
        }
        next();
    };
};

exports.hasPermission = (permission) => {
    return async (req, res, next) => {
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        // Admin and Super Admin have all permissions
        const superAdminRoles = ['super_admin', 'super_admin_secretaire', 'superaduser'];
        if (userRoles.includes('admin') || userRoles.some(r => superAdminRoles.includes(r))) {
            return next();
        }

        // Fetch user's role permissions from DB
        const rolesInDb = await db.Role.findAll({
            where: {
                name: userRoles,
                churchId: req.user.churchId
            }
        });

        const allPermissions = rolesInDb.reduce((acc, r) => {
            return acc.concat(r.permissions || []);
        }, []);

        console.log(`[DEBUG] User Roles: ${JSON.stringify(userRoles)}`);
        console.log(`[DEBUG] Roles found in DB: ${rolesInDb.length}`);
        rolesInDb.forEach(r => console.log(`   - Role: ${r.name}, Permissions: ${JSON.stringify(r.permissions)}`));

        console.log(`HasPermission Check: roles=${userRoles}, perm=${permission}, found=${allPermissions.includes(permission)}`);

        if (!allPermissions.includes(permission)) {
            return res.status(403).json({
                message: `Vous n'avez pas la permission '${permission}' pour accéder à cette ressource.`
            });
        }

        next();
    };
};
