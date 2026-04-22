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
            firstName, lastName, email, password, role, subtypeId, phone, address, city, department, zipCode, country,
            gender, birthDate, maritalStatus, photo, status, nifCin, birthPlace, nickname, joinDate, notes,
            workAddress, workEmail, workPhone, emergencyContact, facebookUrl, linkedinUrl,
            spouseName, baptismalStatus, memberCategoryId, spouseId,
            instagramUrl, tiktokUrl, websiteUrl, emergencyPhone, emergencyEmail,
            secondaryPhone, secondaryEmail, bloodGroup, memberCode
        } = req.body;

        // Check if email exists within this church
        const existingUser = await db.User.findOne({
            where: { email, churchId: req.church.id }
        });

        if (existingUser) return res.status(400).json({ message: "Email déjà utilisé dans cette église." });

        const defaultPassword = password || 'Elyon@' + Math.floor(1000 + Math.random() * 9000);
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const newMember = await db.User.create({
            churchId: req.church.id,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            tempPassword: defaultPassword,
            mustChangePassword: true,
            role: role || ['member'],
            subtypeId: subtypeId || null,
            phone,
            address,
            city,
            department,
            zipCode,
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
            instagramUrl,
            tiktokUrl,
            websiteUrl,
            emergencyPhone,
            emergencyEmail,
            secondaryPhone,
            secondaryEmail,
            spouseName,
            memberCategoryId: (!memberCategoryId || memberCategoryId === "") ? null : memberCategoryId,
            baptismalStatus: baptismalStatus || 'not_baptized',
            bloodGroup,
            addedById: req.user?.id,
            categoryChangeDate: (subtypeId || memberCategoryId) ? new Date() : null
        });

        // Generate and save memberCode if not provided
        const finalMemberCode = memberCode || generateMemberCode(newMember, req.church);
        await newMember.update({ memberCode: finalMemberCode });

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

        // Basic validation for ID
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID invalide" });
        }

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
                        attributes: ['status', 'level', 'assignmentType', 'joinedAt', 'leftAt'],
                        as: 'sunday_school_member'
                    }
                },
                { model: db.User, as: 'registrant', attributes: ['firstName', 'lastName'] }
            ],
            order: [
                [{ model: db.Donation, as: 'donations' }, 'date', 'DESC']
            ]
        });

        if (!member) {
            fs.appendFileSync('profile_debug.txt', `   -> NOT FOUND\n`);
            return res.status(404).json({ message: "Membre non trouvé." });
        }

        const memberData = member.toJSON();
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');

        // Check for approved requests if not admin
        let hasApproval = false;
        if (!isAdmin) {
            const approvedRequest = await db.MemberRequest.findOne({
                where: {
                    userId: req.user.id,
                    targetUserId: id,
                    requestType: ['password_view', 'password_reset'],
                    status: 'approved'
                }
            });
            if (approvedRequest) hasApproval = true;
        }

        if (!isAdmin && !hasApproval) {
            delete memberData.tempPassword;
        }

        fs.appendFileSync('profile_debug.txt', `   -> FOUND: ${member.firstName}\n`);
        res.json(memberData);
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
            firstName, lastName, email, role, subtypeId, phone, address, city, department, zipCode, country,
            gender, birthDate, maritalStatus, photo, status, statusChangeDate, nifCin,
            birthPlace, nickname, joinDate, notes,
            workAddress, workEmail, workPhone, emergencyContact, facebookUrl, linkedinUrl,
            instagramUrl, tiktokUrl, websiteUrl, emergencyPhone, emergencyEmail,
            secondaryPhone, secondaryEmail,
            spouseName, baptismalStatus, memberCategoryId, spouseId, password, bloodGroup, memberCode
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
        if (department !== undefined) member.department = department;
        if (zipCode !== undefined) member.zipCode = zipCode;
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
        if (instagramUrl !== undefined) member.instagramUrl = instagramUrl;
        if (tiktokUrl !== undefined) member.tiktokUrl = tiktokUrl;
        if (websiteUrl !== undefined) member.websiteUrl = websiteUrl;
        if (emergencyPhone !== undefined) member.emergencyPhone = emergencyPhone;
        if (emergencyEmail !== undefined) member.emergencyEmail = emergencyEmail;
        if (secondaryPhone !== undefined) member.secondaryPhone = secondaryPhone;
        if (secondaryEmail !== undefined) member.secondaryEmail = secondaryEmail;
        if (spouseName !== undefined) member.spouseName = spouseName;
        if (memberCode !== undefined) member.memberCode = memberCode;
        if (bloodGroup !== undefined) member.bloodGroup = bloodGroup;
        if (baptismalStatus !== undefined) member.baptismalStatus = baptismalStatus;
        if (memberCategoryId !== undefined) member.memberCategoryId = (!memberCategoryId || memberCategoryId === "") ? null : memberCategoryId;

        // Password Update
        if (password) {
            const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
            const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');

            // Check for approved request if not admin
            let hasApproval = false;
            if (!isAdmin) {
                const approvedRequest = await db.MemberRequest.findOne({
                    where: {
                        userId: req.user.id,
                        targetUserId: id,
                        requestType: 'password_reset',
                        status: 'approved'
                    }
                });
                if (approvedRequest) hasApproval = true;
            }

            if (isAdmin || hasApproval) {
                member.password = await bcrypt.hash(password, 10);
                member.tempPassword = password; // Set tempPassword so admin can still see it
                member.mustChangePassword = true;
            }
        }

        const oldStatus = member.status;
        const oldSubtypeId = member.subtypeId;
        const oldMemberCategoryId = member.memberCategoryId;
        const oldBaptismalStatus = member.baptismalStatus;

        // Detection of changes for history
        const statusChanged = status !== undefined && status !== oldStatus;
        const baptismalChanged = baptismalStatus !== undefined && baptismalStatus !== oldBaptismalStatus;
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
        if (memberCategoryId !== undefined) member.memberCategoryId = memberCategoryId || null;

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

        // RESTRICTION: Cannot delete Super Admin accounts
        const roles = Array.isArray(member.role) ? member.role : (typeof member.role === 'string' ? JSON.parse(member.role) : [member.role]);
        if (roles.includes('super_admin')) {
            return res.status(403).json({
                message: "Restriction: Les comptes de type Super Administrateur ne peuvent pas être supprimés pour des raisons de sécurité."
            });
        }

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
                { model: db.Church, as: 'church', attributes: ['name', 'subdomain', 'acronym', 'logoUrl', 'contactEmail', 'churchEmail', 'contactPhone', 'address', 'pastorName'] },
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] },
                { model: db.Group, as: 'memberGroups', attributes: ['id', 'name', 'type', 'description'] },
                {
                    model: db.SundaySchool,
                    as: 'sundaySchoolClasses',
                    attributes: ['id', 'name', 'description'],
                    through: {
                        attributes: ['status', 'level', 'joinedAt'],
                        as: 'membership'
                    }
                },
                { model: db.User, as: 'registrant', attributes: ['firstName', 'lastName'] }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

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
        const user = await db.User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        // Allowed fields for self-update (excluding role, churchId, etc. for security)
        const allowedFields = [
            'firstName', 'lastName', 'email', 'phone', 'address', 'nickname', 'photo', 'coverPic',
            'birthDate', 'nifCin', 'city', 'department', 'zipCode', 'country', 
            'workAddress', 'workEmail', 'workPhone', 'emergencyContact', 'emergencyPhone', 'emergencyEmail',
            'gender', 'maritalStatus', 'birthPlace', 'notes', 
            'secondaryPhone', 'secondaryEmail', 'bloodGroup', 'spouseId', 'spouseName', 'education', 'bio'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Handle file uploads if any (from multer)
        if (req.files) {
            if (req.files.photo) {
                updateData.photo = `/uploads/${req.files.photo[0].filename}`;
            }
            if (req.files.coverPic) {
                updateData.coverPic = `/uploads/${req.files.coverPic[0].filename}`;
            }
        }

        await user.update(updateData);

        // Handle Spouse Relationship Update
        if (req.body.spouseId) {
            const spouseId = req.body.spouseId;
            const existingRel = await db.Relationship.findOne({
                where: {
                    personAId: user.id,
                    type: 'Conjoint(e)'
                }
            });

            if (existingRel) {
                if (existingRel.personBId !== parseInt(spouseId)) {
                    await existingRel.update({ personBId: spouseId });
                }
            } else {
                await db.Relationship.create({
                    churchId: user.churchId,
                    personAId: user.id,
                    personBId: spouseId,
                    type: 'Conjoint(e)',
                    details: 'Linked from member profile'
                });
            }
        }
        res.json({ message: "Profil mis à jour.", user });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil." });
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

// ==========================================
// NEW: Multi-item Notes, Actions, Requests
// ==========================================

exports.getMemberNotes = async (req, res) => {
    try {
        const notes = await db.MemberNote.findAll({
            where: { userId: req.params.id, churchId: req.church.id },
            include: [{ model: db.User, as: 'addedBy', attributes: ['firstName', 'lastName'] }],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: "Error fetching notes" });
    }
};

exports.createMemberNote = async (req, res) => {
    try {
        const note = await db.MemberNote.create({
            ...req.body,
            userId: req.params.id,
            churchId: req.church.id,
            addedById: req.user.id
        });
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ message: "Error creating note" });
    }
};

exports.updateMemberNote = async (req, res) => {
    try {
        const note = await db.MemberNote.findOne({ where: { id: req.params.noteId, userId: req.params.id, churchId: req.church.id } });
        if (!note) return res.status(404).json({ message: "Note not found" });
        await note.update(req.body);
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: "Error updating note" });
    }
};

exports.deleteMemberNote = async (req, res) => {
    try {
        const note = await db.MemberNote.findOne({ where: { id: req.params.noteId, userId: req.params.id, churchId: req.church.id } });
        if (!note) return res.status(404).json({ message: "Note not found" });
        await note.destroy();
        res.json({ message: "Note deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting note" });
    }
};

exports.getMemberActions = async (req, res) => {
    try {
        const actions = await db.MemberAction.findAll({
            where: { userId: req.params.id, churchId: req.church.id },
            include: [{ model: db.User, as: 'addedBy', attributes: ['firstName', 'lastName'] }],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(actions);
    } catch (err) {
        res.status(500).json({ message: "Error fetching actions" });
    }
};

exports.createMemberAction = async (req, res) => {
    try {
        const action = await db.MemberAction.create({
            ...req.body,
            userId: req.params.id,
            churchId: req.church.id,
            addedById: req.user.id
        });
        res.status(201).json(action);
    } catch (err) {
        res.status(500).json({ message: "Error creating action" });
    }
};

exports.getMemberRequests = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID invalide" });
        }

        const requests = await db.MemberRequest.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { userId: id },
                    { targetUserId: id }
                ],
                churchId: req.church.id
            },
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: "Error fetching requests" });
    }
};

exports.createMemberRequest = async (req, res) => {
    try {
        const request = await db.MemberRequest.create({
            ...req.body,
            userId: req.user.id,
            churchId: req.church.id,
            status: 'open'
        });

        // Notify Admins
        const admins = await db.User.findAll({
            where: {
                churchId: req.church.id,
                role: { [db.Sequelize.Op.like]: '%admin%' }
            }
        });

        for (const admin of admins) {
            await db.Notification.create({
                userId: admin.id,
                churchId: req.church.id,
                title: 'Nouvelle demande d\'accès',
                message: `${req.user.firstName} ${req.user.lastName} a soumis une demande : ${req.body.subject || req.body.requestType}`,
                type: 'request',
                link: `/admin/members/${req.body.targetUserId || req.params.id}`
            });
        }

        res.status(201).json(request);
    } catch (err) {
        console.error("Create Request Error:", err);
        res.status(500).json({ message: "Error creating request" });
    }
};

exports.updateMemberRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, viewStatus } = req.body;

        const request = await db.MemberRequest.findOne({ where: { id: requestId, churchId: req.church.id } });
        if (!request) return res.status(404).json({ message: "Request not found" });

        // Only admins can approve/reject status or change viewStatus
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (!userRoles.includes('admin') && !userRoles.includes('super_admin')) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (status) request.status = status;
        if (viewStatus) request.viewStatus = viewStatus;
        await request.save();
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: "Error updating request" });
    }
};

// Global Member Search (Cross-church)
exports.searchGlobalMembers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 3) return res.json([]);

        const users = await db.User.findAll({
            where: {
                churchId: req.church.id,
                [db.Sequelize.Op.or]: [
                    { firstName: { [db.Sequelize.Op.iLike]: `%${q}%` } },
                    { lastName: { [db.Sequelize.Op.iLike]: `%${q}%` } },
                    { email: { [db.Sequelize.Op.iLike]: `%${q}%` } }
                ]
            },
            attributes: ['id', 'firstName', 'lastName', 'photo', 'role'],
            include: [{
                model: db.Church,
                as: 'church',
                attributes: ['name', 'acronym']
            }],
            limit: 15
        });

        res.json(users);
    } catch (err) {
        console.error("Global search error:", err);
        res.status(500).json({ message: "Search failed" });
    }
};

// Get Public Profile (No churchId filter)
exports.getPublicMemberProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await db.User.findByPk(id, {
            attributes: ['id', 'firstName', 'lastName', 'photo', 'email', 'phone', 'notes', 'status', 'createdAt', 'role', 'city', 'country', 'address', 'nickname', 'joinDate', 'facebookUrl', 'linkedinUrl', 'instagramUrl', 'tiktokUrl', 'websiteUrl'],
            include: [
                { model: db.Church, as: 'church', attributes: ['name', 'acronym', 'logoUrl'] },
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] }
            ]
        });

        if (!member) return res.status(404).json({ message: "Member not found" });

        // Get limited posts
        const posts = await db.CommunityPost.findAll({
            where: { authorId: id },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        res.json({ member, posts });
    } catch (err) {
        console.error("Error fetching public profile:", err);
        res.status(500).json({ message: "Server error" });
    }
};
