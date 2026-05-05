const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Multi-tenant check
        // Si req.church egziste (via sous-domèn), n ap chèche sèlman user ki nan legliz sa a.
        // Si req.isSaaS (global), n ap chèche globalman (souvan pou super_admin).

        const whereClause = { email: email };

        console.log("--- LOGIN DEBUG ---");
        console.log("Email:", email);
        console.log("Tenant Church:", req.church ? req.church.subdomain : "None (Global Search)");

        let user;
        if (req.church) {
            // Priority: Search in current tenant context
            whereClause.churchId = req.church.id;
            user = await db.User.findOne({ where: whereClause, include: [{ model: db.Church, as: 'church' }] });
        }

        // If not found in context or no context, search globally
        if (!user) {
            console.log("Searching globally for email:", email);
            user = await db.User.findOne({
                where: { email: email },
                include: [{ model: db.Church, as: 'church' }]
            });
        }

        if (!user) {
            console.log("User NOT found in database.");
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        console.log("User found:", user.email, "Church:", user.church ? user.church.name : "None");
        console.log("Stored Hashed Password:", user.password);

        const validPass = await bcrypt.compare(password, user.password);
        console.log("Password Comparison Result:", validPass);

        if (!validPass) {
            console.log("LOGIN FAILED: Incorrect Password");
            return res.status(400).json({ message: "Mot de passe incorrect." });
        }

        // Simplification radicale pour déblocage Azure
        const roles = Array.isArray(user.role) ? user.role : [user.role];
        let permissions = ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'];

        // Generate Token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                roles: roles, 
                permissions: permissions,
                churchId: user.churchId,
                churchSubdomain: user.church?.subdomain 
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: roles,
                permissions: permissions,
                churchId: user.churchId,
                churchName: user.church ? user.church.name : 'System',
                churchLogo: user.church ? user.church.logoUrl : null
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ 
            message: "Erreur serveur lors de la connexion.", 
            error: err.message,
            stack: err.stack 
        });
    }
};
