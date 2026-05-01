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

        // Fetch Permissions if it's a custom role
        let permissions = [];
        const roles = Array.isArray(user.role) ? user.role : [user.role];

        if (roles.includes('admin') || roles.includes('super_admin')) {
            permissions = ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'];
        } else if (user.churchId) {
            // Combine permissions from ALL roles
            const customRoles = await db.Role.findAll({
                where: {
                    churchId: user.churchId,
                    name: roles
                }
            });
            let aggregatedPerms = new Set();
            customRoles.forEach(r => {
                if (Array.isArray(r.permissions)) {
                    r.permissions.forEach(p => aggregatedPerms.add(p));
                }
            });
            permissions = Array.from(aggregatedPerms);
        }

        // Generate Token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                permissions, // NEW: Include permissions
                churchId: user.churchId,
                church_subdomain: user.church ? user.church.subdomain : null,
                churchName: user.church ? user.church.name : null,
                churchAcronym: user.church ? user.church.acronym : null,
                churchLogo: user.church ? user.church.logoUrl : null,
                pastorName: user.church ? user.church.pastorName : null,
                churchEmail: user.church ? user.church.churchEmail : null,
                churchStatus: user.church ? user.church.status : 'active',
                subscriptionExpiresAt: user.church ? user.church.subscriptionExpiresAt : null,
                setupCompleted: user.church ? user.church.setupCompleted : false
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                photo: user.photo,
                permissions, // NEW
                mustChangePassword: user.mustChangePassword,
                churchName: user.church ? user.church.name : null,
                churchAcronym: user.church ? user.church.acronym : null,
                churchLogo: user.church ? user.church.logoUrl : null,
                pastorName: user.church ? user.church.pastorName : null,
                churchEmail: user.church ? user.church.churchEmail : null,
                churchStatus: user.church ? user.church.status : 'active',
                subscriptionExpiresAt: user.church ? user.church.subscriptionExpiresAt : null,
                setupCompleted: user.church ? user.church.setupCompleted : false
            }
        });

    } catch (err) {
        console.error("Login Error:", err); // Log full error object
        console.error(err.stack); // Log stack trace
        res.status(500).json({ message: "Erreur serveur lors de la connexion." });
    }
};
