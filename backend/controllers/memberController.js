const db = require('../models');
const bcrypt = require('bcryptjs');
const { generateMemberCode } = require('../utils/userUtils');
const sundaySchoolController = require('./sundaySchoolController');

// Create Member (Admin only)
const safeDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateStr + 'T12:00:00Z');
    }
    return new Date(dateStr);
};

exports.createMember = async (req, res) => {
    try {
        // req.church est disponible grâce au tenantMiddleware
        if (!req.church) {
            return res.status(400).json({ message: "Contexte de l'église manquant." });
        }

        const {
            firstName, lastName, email, password, role, subtypeId, phone, address, city, country,
            gender, birthDate, maritalStatus, photo, status, nifCin, birthPlace, nickname, joinDate, notes,
            workAddress, workEmail, workPhone, emergencyContact, facebookUrl, linkedinUrl,
            spouseName, baptismalStatus, memberCategoryId, spouseId
        } = req.body;

        // Check if email exists within this church
        const existingUser = await db.User.findOne({
            where: { email, churchId: req.church.id }
        });

        if (existingUser) return res.status(400).json({ message: "Email déjà utilisé dans cette église." });

        const hashedPassword = await bcrypt.hash(password || 'password123', 10);
        const newMember = await db.User.create({
            churchId: req.church.id,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || ['member'],
            subtypeId: subtypeId || null,
            phone,
            address,
            city,
            country,
            gender,
            birthDate,
            maritalStatus,
            photo,
            status: status || 'Actif',
            nifCin,
            birthPlace,
            nickname,
            joinDate,
            notes,
            workAddress,
            workEmail,
            workPhone,
            emergencyContact,
            facebookUrl,
            linkedinUrl,
            spouseName,
            memberCategoryId,
            baptismalStatus: baptismalStatus || 'not_baptized',
            categoryChangeDate: (subtypeId || memberCategoryId) ? new Date() : null
        });

        // Generate and save memberCode
        const memberCode = generateMemberCode(newMember, req.church);
        await newMember.update({ memberCode });

        // Record Initial History
        await db.StatusHistory.create({
            userId: newMember.id,
            status: newMember.status,
            changeDate: new Date(),
            changedById: req.user?.id,
            notes: "Initial registration"
        });

        if (newMember.subtypeId) {
            await db.CategoryHistory.create({
                userId: newMember.id,
                subtypeId: newMember.subtypeId,
                changeDate: new Date(),
                changedById: req.user?.id,
                notes: "Initial registration"
            });
        }

        if (newMember.memberCategoryId) {
            await db.CategoryHistory.create({
                userId: newMember.id,
                memberCategoryId: newMember.memberCategoryId,
                changeDate: new Date(),
                changedById: req.user?.id,
                notes: "Initial registration"
            });
        }

        // Auto-assign to Sunday School classes
        await sundaySchoolController.assignMemberToClasses(newMember.id, req.church.id);

        // Handle Spouse Linkage
        if (spouseId) {
            await db.Relationship.create({
                churchId: req.church.id,
                personAId: newMember.id,
                personBId: spouseId,
                type: 'Conjoint(e)',
                details: 'Linked from profile'
            });
        }

        res.status(201).json({
            message: "Membre ajouté avec succès",
            member: {
                id: newMember.id,
                firstName: newMember.firstName,
                lastName: newMember.lastName,
                email: newMember.email,
                role: newMember.role
            }
        });

    } catch (err) {
        console.error("Create Member Error:", err);
        res.status(500).json({ message: "Erreur lors de l'ajout du membre." });
    }
};

// Get All Members (for this church)
exports.getAllMembers = async (req, res) => {
    try {
        if (!req.church) return res.status(400).json({ message: "Contexte manquant." });

        const members = await db.User.findAll({
            where: { churchId: req.church.id },
            attributes: { exclude: ['password'] },
            include: [
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] },
                { model: db.MemberCategory, as: 'category', attributes: ['name'] }
            ]
        });

        res.json(members);
    } catch (err) {
        console.error("Get Members Error:", err);
        res.status(500).json({ message: "Erreur lors de la récupération des membres." });
    }
};

exports.getMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church?.id;
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] getMemberById - ID: ${id}, ChurchID: ${churchId}\n`;
        fs.appendFileSync('profile_debug.txt', logMsg);

        const member = await db.User.findOne({
            where: { id: id, churchId: churchId },
            attributes: { exclude: ['password'] },
            include: [
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] },
                { model: db.MemberCategory, as: 'category', attributes: ['name'] },
                { model: db.Donation, as: 'donations' },
                { model: db.Group, as: 'memberGroups' },
                { model: db.Event, as: 'attendedEvents' },
                { model: db.Ceremony, as: 'attendedCeremonies' },
                {
                    model: db.SundaySchool,
                    as: 'sundaySchoolClasses',
                    through: {
                        attributes: ['status', 'assignmentType', 'joinedAt'],
                        as: 'sunday_school_member'
                    }
                }
            ],
            order: [
                [{ model: db.Donation, as: 'donations' }, 'date', 'DESC']
            ]
        });

        if (!member) {
            fs.appendFileSync('profile_debug.txt', `   -> NOT FOUND\n`);
            return res.status(404).json({ message: "Membre non trouvé." });
        }

        fs.appendFileSync('profile_debug.txt', `   -> FOUND: ${member.firstName}\n`);
        res.json(member);
    } catch (err) {
        require('fs').appendFileSync('profile_debug.txt', `   -> ERROR: ${err.message}\n`);
        console.error("Get Member Error:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Update Member
exports.updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName, lastName, email, role, subtypeId, phone, address, city, country,
            gender, birthDate, maritalStatus, photo, status, statusChangeDate, nifCin,
            birthPlace, nickname, joinDate, notes,
            workAddress, workEmail, workPhone, emergencyContact, facebookUrl, linkedinUrl,
            spouseName, baptismalStatus, memberCategoryId, spouseId
        } = req.body;

        const member = await db.User.findOne({ where: { id: id, churchId: req.church.id } });

        if (!member) return res.status(404).json({ message: "Membre non trouvé." });

        console.log(`[DEBUG] Update Member Payload - ID: ${id}`, { role });

        if (firstName !== undefined) member.firstName = firstName;
        if (lastName !== undefined) member.lastName = lastName;
        if (email !== undefined) member.email = email;
        if (subtypeId !== undefined) member.subtypeId = subtypeId || null;
        if (phone !== undefined) member.phone = phone;
        if (address !== undefined) member.address = address;
        if (city !== undefined) member.city = city;
        if (country !== undefined) member.country = country;
        if (gender !== undefined) member.gender = gender;
        if (birthDate !== undefined) member.birthDate = birthDate;
        if (maritalStatus !== undefined) member.maritalStatus = maritalStatus;
        if (photo !== undefined) member.photo = photo;
        if (nifCin !== undefined) member.nifCin = nifCin;
        if (birthPlace !== undefined) member.birthPlace = birthPlace;
        if (nickname !== undefined) member.nickname = nickname;
        if (joinDate !== undefined) member.joinDate = joinDate;
        if (notes !== undefined) member.notes = notes;
        if (role !== undefined) member.set('role', role);
        if (workAddress !== undefined) member.workAddress = workAddress;
        if (workEmail !== undefined) member.workEmail = workEmail;
        if (workPhone !== undefined) member.workPhone = workPhone;
        if (emergencyContact !== undefined) member.emergencyContact = emergencyContact;
        if (facebookUrl !== undefined) member.facebookUrl = facebookUrl;
        if (linkedinUrl !== undefined) member.linkedinUrl = linkedinUrl;
        if (spouseName !== undefined) member.spouseName = spouseName;
        if (baptismalStatus !== undefined) member.baptismalStatus = baptismalStatus;

        const oldStatus = member.status;
        const oldSubtypeId = member.subtypeId;
        const oldMemberCategoryId = member.memberCategoryId;

        // Detection of changes for history
        const statusChanged = status !== undefined && status !== oldStatus;
        const baptismalChanged = baptismalStatus !== undefined && baptismalStatus !== member.baptismalStatus;
        const memberCategoryChanged = memberCategoryId !== undefined && memberCategoryId !== oldMemberCategoryId;

        if (status !== undefined) member.status = status;
        if (statusChangeDate !== undefined) member.statusChangeDate = safeDate(statusChangeDate);
        if (req.body.categoryChangeDate !== undefined) member.categoryChangeDate = safeDate(req.body.categoryChangeDate);

        // Handle Subtype Update (Always log history if subtypeId is provided)
        if (subtypeId !== undefined) {
            member.subtypeId = subtypeId || null;

            await db.CategoryHistory.create({
                userId: member.id,
                subtypeId: member.subtypeId,
                changeDate: safeDate(req.body.categoryChangeDate) || new Date(),
                changedById: req.user?.id,
                notes: req.body.historyNotes || "Category update"
            });
        }

        if (baptismalStatus !== undefined) member.baptismalStatus = baptismalStatus;
        if (memberCategoryId !== undefined) member.memberCategoryId = memberCategoryId;

        await member.save();

        // Log Status History
        if (statusChanged) {
            await db.StatusHistory.create({
                userId: member.id,
                status: member.status,
                changeDate: safeDate(statusChangeDate) || new Date(),
                changedById: req.user?.id,
                notes: req.body.historyNotes || "Status update"
            });
        }

        // Log Baptismal Status History (Statutory category change - LEGACY ENUM)
        if (baptismalChanged) {
            await db.CategoryHistory.create({
                userId: member.id,
                baptismalStatus: member.baptismalStatus,
                changeDate: safeDate(req.body.categoryChangeDate) || new Date(),
                changedById: req.user?.id,
                notes: req.body.historyNotes || "Statutory category update (legacy)"
            });
        }

        // Log Member Category History (Statutory category change - NEW TABLE)
        if (memberCategoryChanged) {
            await db.CategoryHistory.create({
                userId: member.id,
                memberCategoryId: member.memberCategoryId,
                changeDate: safeDate(req.body.categoryChangeDate) || new Date(),
                changedById: req.user?.id,
                notes: req.body.historyNotes || "Statutory category update"
            });
        }

        // Refresh Sunday School auto-assignments
        await sundaySchoolController.assignMemberToClasses(member.id, req.church.id);

        // Handle Spouse Linkage Update
        if (spouseId) {
            const existingRel = await db.Relationship.findOne({
                where: {
                    personAId: member.id,
                    type: 'Conjoint(e)'
                }
            });

            if (existingRel) {
                // If the existing spouse ID differs, update it
                if (existingRel.personBId !== parseInt(spouseId)) {
                    await existingRel.update({ personBId: spouseId });
                }
            } else {
                await db.Relationship.create({
                    churchId: req.church.id,
                    personAId: member.id,
                    personBId: spouseId,
                    type: 'Conjoint(e)',
                    details: 'Linked from profile'
                });
            }
        }

        res.json({ message: "Membre mis à jour.", member });
    } catch (err) {
        console.error("Update Member Error:", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour." });
    }
};

// Delete Member
exports.deleteMember = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await db.User.findOne({ where: { id: id, churchId: req.church.id } });

        if (!member) return res.status(404).json({ message: "Membre non trouvé." });

        await member.destroy();
        res.json({ message: "Membre supprimé avec succès." });
    } catch (err) {
        console.error("Delete Member Error:", err);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};

// Get Personal Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await db.User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [
                { model: db.Church, as: 'church', attributes: ['name', 'subdomain', 'acronym', 'adminEmail'] },
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] }
            ]
        });

        // Calculate permissions
        let permissions = [];
        const userRoles = Array.isArray(user.role) ? user.role : [user.role];

        if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
            // Admin gets all valid permissions (dynamically or static list)
            // For UI logic, we can send a special flag or full list.
            // Let's send a full list of known modules for simplicity in UI checking
            permissions = ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'];
        } else {
            const rolesInDb = await db.Role.findAll({
                where: {
                    name: userRoles,
                    churchId: user.churchId
                }
            });
            permissions = rolesInDb.reduce((acc, r) => acc.concat(r.permissions || []), []);
            permissions = [...new Set(permissions)];
        }

        // Return user WITH permissions
        // We use .toJSON() to merge easily
        res.json({ ...user.toJSON(), permissions });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du profil." });
    }
};

// Update Personal Profile
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const user = await db.User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        await user.update({ firstName, lastName, email });
        res.json({ message: "Profil mis à jour.", user });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour." });
    }
};

// Get Member History
exports.getMemberHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church.id;

        const statusHistory = await db.StatusHistory.findAll({
            where: { userId: id },
            include: [{ model: db.User, as: 'changedBy', attributes: ['firstName', 'lastName'] }],
            order: [['changeDate', 'DESC']]
        });

        const categoryHistory = await db.CategoryHistory.findAll({
            where: { userId: id },
            include: [
                { model: db.User, as: 'changedBy', attributes: ['firstName', 'lastName'] },
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] },
                { model: db.MemberCategory, as: 'memberCategory', attributes: ['name'] }
            ],
            order: [['changeDate', 'DESC']]
        });

        res.json({ statusHistory, categoryHistory });
    } catch (err) {
        console.error("Get History Error:", err);
        res.status(500).json({ message: "Erreur lors de la récupération de l'historique." });
    }
};
