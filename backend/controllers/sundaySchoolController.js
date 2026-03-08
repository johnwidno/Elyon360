const db = require("../models");
const { Op } = require("sequelize");
const roomScheduler = require('../services/roomScheduler');

// Helper to get next date for a day name
const getNextDateForDay = (dayName) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const targetIndex = days.indexOf(dayName.toLowerCase());
    if (targetIndex === -1) return new Date().toISOString().split('T')[0];
    const d = new Date();
    const currentDay = d.getDay();
    let diff = targetIndex - currentDay;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
};

// Helper to calculate age
const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

// Internal function to assign a member to dynamic classes
const assignMemberToClassesInternal = async (userId, churchId) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user) return;

        const age = calculateAge(user.birthDate);

        // Normalize User Data for matching
        const userGender = (user.gender || '').toLowerCase();
        const userMarital = (user.maritalStatus || '').toLowerCase();
        const userBaptism = (user.baptismalStatus || '').toLowerCase();

        // Find all dynamic classes for this church
        const classes = await db.SundaySchool.findAll({
            where: { churchId, isDynamic: true }
        });

        const classesToJoin = [];

        for (const cls of classes) {
            let match = true;

            // 1. Age criteria
            if (cls.minAge !== null && age !== null && age < cls.minAge) match = false;
            if (cls.maxAge !== null && age !== null && age > cls.maxAge) match = false;

            // 2. Marital criteria
            if (cls.maritalStatus !== 'any') {
                const maritalMatches = {
                    'single': ['célibataire', 'single', 'non marié', 'unmarried', 'celibataire'],
                    'married': ['marié', 'mariée', 'marié(e)', 'married', 'époux', 'épouse'],
                    'widowed': ['veuf', 'veuve', 'widowed', 'widow', 'widower'],
                    'divorced': ['divorcé', 'divorcée', 'divorced', 'divorcé(e)']
                };

                const acceptedStatuses = maritalMatches[cls.maritalStatus] || [];
                // Use .some() to check if userMarital contains any of the accepted statuses
                if (!acceptedStatuses.some(status => userMarital.includes(status))) {
                    match = false;
                }
            }

            // 3. Baptismal / Category criteria
            // IMPORTANT: Use subtypeId (ContactSubtype) as this is where member classification is actually stored
            if (cls.memberCategoryId && user.subtypeId !== cls.memberCategoryId) {
                match = false;
            } else if (cls.baptismalStatus !== 'any') {
                // LEGACY Matcher (Keep for compatibility until all classes are migrated)
                if (cls.baptismalStatus === 'baptized') {
                    // MUST be explicitly baptized
                    if (!['baptized', 'baptisé', 'baptisée'].includes(userBaptism)) match = false;
                } else if (cls.baptismalStatus === 'not_baptized') {
                    // MUST NOT be baptized
                    if (['baptized', 'baptisé', 'baptisée'].includes(userBaptism)) match = false;

                    // Further check: if the class is for "not_baptized" specifically, 
                    // exclude those who don't match the statutory profile
                    const nonBaptizedCategories = ['not_baptized', 'non baptisé', 'non baptisée', 'candidate', 'candidat', 'candidat au baptême', 'adherent', 'adhérent', 'transferred', 'transféré', 'affiliated', 'affilié', 'child', 'enfant', 'other', 'autre'];
                    if (!nonBaptizedCategories.includes(userBaptism)) match = false;
                } else {
                    // Specific category match
                    if (userBaptism !== cls.baptismalStatus) {
                        const normalizedCriteria = cls.baptismalStatus.toLowerCase();
                        if (normalizedCriteria === 'candidate' && !['candidate', 'candidat', 'candidat au baptême'].includes(userBaptism)) match = false;
                        else if (normalizedCriteria === 'adherent' && !['adherent', 'adhérent'].includes(userBaptism)) match = false;
                        else if (normalizedCriteria === 'affiliated' && !['affiliated', 'affilié'].includes(userBaptism)) match = false;
                        else if (normalizedCriteria === 'child' && !['child', 'enfant'].includes(userBaptism)) match = false;
                        else if (normalizedCriteria === 'other' && !['other', 'autre'].includes(userBaptism)) match = false;
                        else if (normalizedCriteria === 'transferred' && !['transferred', 'transféré'].includes(userBaptism)) match = false;
                        else if (![normalizedCriteria].includes(userBaptism)) match = false;
                    }
                }
            }

            // 4. Gender criteria
            if (cls.gender !== 'any') {
                if (cls.gender === 'male') {
                    if (!['masculin', 'male', 'garçon', 'homme', 'm'].includes(userGender)) match = false;
                } else if (cls.gender === 'female') {
                    if (!['féminin', 'female', 'fille', 'femme', 'f'].includes(userGender)) match = false;
                }
            }

            // 5. Member Status criteria
            if (cls.memberStatus && cls.memberStatus !== 'any') {
                const userStatus = (user.status || '').toLowerCase();
                const targetStatus = cls.memberStatus.toLowerCase();
                if (userStatus !== targetStatus) match = false;
            }

            if (match) {
                classesToJoin.push(cls.id);
                break; // USER REQUIREMENT: A member can only belong to ONE class at a time
            }
        }

        // Limit to 1 active assignment
        const finalToJoin = classesToJoin.slice(0, 1);

        // Find all currently active assignments (manual or automatic)
        const currentActiveAssignments = await db.SundaySchoolMember.findAll({
            where: { userId, level: 'Actuel' }
        });

        const activeClassIds = currentActiveAssignments.map(a => a.sundaySchoolId);

        // Members to demote: those who are currently active but shouldn't be (either they don't match or we found a new preferred one)
        const toDemote = activeClassIds.filter(id => !finalToJoin.includes(id));

        if (toDemote.length > 0) {
            console.log(`[SundaySchool] Demoting member ${userId} from classes: ${toDemote.join(', ')}`);
            await db.SundaySchoolMember.update(
                { level: 'non-actuel', leftAt: new Date() },
                {
                    where: {
                        userId,
                        sundaySchoolId: { [db.Sequelize.Op.in]: toDemote },
                        level: 'Actuel'
                    }
                }
            );
        }

        // Add or Reactivate the target class
        if (finalToJoin.length > 0) {
            const targetClassId = finalToJoin[0];
            const existingAssignment = await db.SundaySchoolMember.findOne({
                where: { userId, sundaySchoolId: targetClassId }
            });

            if (existingAssignment) {
                if (existingAssignment.level !== 'Actuel') {
                    console.log(`[SundaySchool] Reactivating member ${userId} for class: ${targetClassId}`);
                    await existingAssignment.update({ level: 'Actuel', leftAt: null, assignmentType: 'automatic' });
                }
            } else {
                console.log(`[SundaySchool] Adding member ${userId} to new class: ${targetClassId}`);
                await db.SundaySchoolMember.create({
                    userId,
                    sundaySchoolId: targetClassId,
                    level: 'Actuel',
                    assignmentType: 'automatic',
                    joinedAt: new Date()
                });
            }
        }

    } catch (error) {
        console.error("Auto-Assignment Error:", error);
    }
};

exports.getClasses = async (req, res) => {
    try {
        const classes = await db.SundaySchool.findAll({
            where: { churchId: req.church.id },
            include: [
                {
                    association: 'classMembers',
                    attributes: ['id'],
                    through: {
                        attributes: ['level'],
                        as: 'sunday_school_member'
                    }
                },
                { model: db.MemberCategory, as: 'admissionCategory', attributes: ['name'] }
            ]
        });
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const cls = await db.SundaySchool.findOne({
            where: { id, churchId: req.church.id },
            include: [
                { model: db.Church, as: 'church', attributes: ['name'] },
                {
                    association: 'monitors',
                    include: [{ association: 'user', attributes: ['id', 'firstName', 'lastName'] }]
                },
                {
                    association: 'classMembers',
                    attributes: ['id', 'firstName', 'lastName', 'memberCode', 'birthDate', 'gender', 'maritalStatus', 'role', 'status', 'email', 'phone', 'baptismalStatus', 'subtypeId', 'memberCategoryId'],
                    through: {
                        attributes: ['status', 'level', 'assignmentType', 'joinedAt', 'leftAt'],
                        as: 'sunday_school_member'
                    },
                    include: [
                        { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] },
                        { model: db.MemberCategory, as: 'category', attributes: ['name'] }
                    ]
                },
                { model: db.MemberCategory, as: 'admissionCategory', attributes: ['name'] }
            ]
        });
        if (!cls) return res.status(404).json({ message: "Classe non trouvée." });
        res.json(cls);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.createClass = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { monitorId, monitorRole, roomId, recurringSchedule, ...classData } = req.body;

        // Sanitize: ensure memberCategoryId is null (not empty string) when not selected
        if (!classData.memberCategoryId) classData.memberCategoryId = null;

        // Check Conflict
        if (roomId && recurringSchedule) {
            let schedule = recurringSchedule;
            if (typeof schedule === 'string') {
                try { schedule = JSON.parse(schedule); } catch (e) { }
            }
            if (schedule && schedule.day && schedule.startTime && schedule.endTime) {
                // Time Validation
                if (schedule.startTime >= schedule.endTime) {
                    await transaction.rollback();
                    return res.status(400).json({ message: "L'heure de début doit être antérieure à l'heure de fin." });
                }

                const checkDate = getNextDateForDay(schedule.day);
                const availability = await roomScheduler.checkRoomAvailability({
                    churchId: req.church.id,
                    roomId,
                    date: checkDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    type: 'class'
                });

                if (!availability.available) {
                    await transaction.rollback();
                    return res.status(409).json({
                        message: `La salle est déjà occupée le ${schedule.day} sur ce créneau par : ${availability.conflict.details.name || availability.conflict.details.title}.`,
                        conflict: availability.conflict
                    });
                }
            }
        }

        const newClass = await db.SundaySchool.create({
            ...classData,
            roomId: roomId || null,
            recurringSchedule,
            churchId: req.church.id,
            teacherId: monitorId || null // Sync with teacherId field if provided
        }, { transaction });

        // Handle monitor assignment if provided
        if (monitorId) {
            await db.SundaySchoolMonitor.create({
                userId: monitorId,
                classId: newClass.id,
                role: monitorRole || 'monitor',
                churchId: req.church.id
            }, { transaction });

            // Also add as member
            await db.SundaySchoolMember.create({
                userId: monitorId,
                sundaySchoolId: newClass.id,
                level: 'Actuel',
                assignmentType: 'manual',
                joinedAt: new Date()
            }, { transaction });
        }

        // Trigger auto-assignment for all members if dynamic
        if (newClass.isDynamic) {
            const users = await db.User.findAll({ where: { churchId: req.church.id } });
            for (const user of users) {
                await assignMemberToClassesInternal(user.id, req.church.id);
            }
        }

        await transaction.commit();
        res.status(201).json(newClass);
    } catch (err) {
        await transaction.rollback();
        console.error("Create class error:", err);
        res.status(500).json({ message: "Erreur lors de la création." });
    }
};

exports.updateClass = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { monitorId, monitorRole, roomId, recurringSchedule, ...classData } = req.body;

        // Sanitize: ensure memberCategoryId is null (not empty string) when not selected
        if (!classData.memberCategoryId) classData.memberCategoryId = null;

        // Check Conflict (Update)
        if (roomId && recurringSchedule) {
            let schedule = recurringSchedule;
            if (typeof schedule === 'string') {
                try { schedule = JSON.parse(schedule); } catch (e) { }
            }
            if (schedule && schedule.day && schedule.startTime && schedule.endTime) {
                // Time Validation
                if (schedule.startTime >= schedule.endTime) {
                    await transaction.rollback();
                    return res.status(400).json({ message: "L'heure de début doit être antérieure à l'heure de fin." });
                }

                const checkDate = getNextDateForDay(schedule.day);
                const availability = await roomScheduler.checkRoomAvailability({
                    churchId: req.church.id,
                    roomId,
                    date: checkDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    excludeId: id,
                    type: 'class'
                });

                if (!availability.available) {
                    await transaction.rollback();
                    return res.status(409).json({
                        message: `La salle est déjà occupée le ${schedule.day} sur ce créneau par : ${availability.conflict.details.name || availability.conflict.details.title}.`,
                        conflict: availability.conflict
                    });
                }
            }
        }

        await db.SundaySchool.update({
            ...classData,
            roomId: roomId || null,
            recurringSchedule,
            teacherId: monitorId || null
        }, {
            where: { id, churchId: req.church.id },
            transaction
        });

        // Handle monitor assignment if changed/provided
        if (monitorId) {
            const existingMonitor = await db.SundaySchoolMonitor.findOne({
                where: { userId: monitorId, classId: id, churchId: req.church.id }
            });

            if (!existingMonitor) {
                // Remove other monitor assignments for this person if they are being moved to this class
                // Actually, the user can be a monitor in multiple classes? 
                // "Un membre ne peut appartenir a dex classe a la fois" refers to membership.
                // For committee, usually they are in one.

                await db.SundaySchoolMonitor.create({
                    userId: monitorId,
                    classId: id,
                    role: monitorRole || 'monitor',
                    churchId: req.church.id
                }, { transaction });

                // Ensure membership is synced (handled by assignMemberToClassesInternal refreshed below, 
                // but let's be explicit for manual assignments)
                const existingMember = await db.SundaySchoolMember.findOne({
                    where: { userId: monitorId, sundaySchoolId: id }
                });

                if (existingMember) {
                    await existingMember.update({ level: 'Actuel', leftAt: null, assignmentType: 'manual' }, { transaction });
                } else {
                    await db.SundaySchoolMember.create({
                        userId: monitorId,
                        sundaySchoolId: id,
                        level: 'Actuel',
                        assignmentType: 'manual',
                        joinedAt: new Date()
                    }, { transaction });
                }
            }
        }

        // Refresh auto-assignments
        const users = await db.User.findAll({ where: { churchId: req.church.id } });
        for (const user of users) {
            await assignMemberToClassesInternal(user.id, req.church.id);
        }

        await transaction.commit();
        res.json({ message: "Classe mise à jour." });
    } catch (err) {
        await transaction.rollback();
        console.error("Update class error:", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour." });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify the class belongs to this church
        const cls = await db.SundaySchool.findOne({
            where: { id, churchId: req.church.id }
        });

        if (!cls) {
            return res.status(404).json({ message: "Classe non trouvée." });
        }

        // Delete all related records in the correct order
        // 1. Delete attendance records
        await db.SundaySchoolAttendance.destroy({
            where: { classId: id }
        });

        // 2. Delete reports
        await db.SundaySchoolReport.destroy({
            where: { classId: id }
        });

        // 3. Delete member assignments (junction table)
        await db.SundaySchoolMember.destroy({
            where: { sundaySchoolId: id }
        });

        // 4. Delete monitor assignments (junction table)
        await db.SundaySchoolMonitor.destroy({
            where: { classId: id }
        });

        // 5. Finally delete the class itself
        await db.SundaySchool.destroy({
            where: { id, churchId: req.church.id }
        });

        res.json({ message: "Classe et toutes les données associées supprimées avec succès." });
    } catch (err) {
        console.error("Delete class error:", err);
        res.status(500).json({
            message: "Erreur lors de la suppression.",
            error: err.message
        });
    }
};

// Monitors
exports.getMonitors = async (req, res) => {
    try {
        const monitors = await db.SundaySchoolMonitor.findAll({
            where: { churchId: req.church.id },
            include: [
                { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { association: 'class', attributes: ['id', 'name'] }
            ]
        });
        res.json(monitors);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.assignMonitor = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { userId, classId, role } = req.body;
        const churchId = req.church.id;

        // 1. Handle previous monitor assignments for this user
        // If a user can only be in one class committee at a time (usual for SS monitors)
        const existingMonitor = await db.SundaySchoolMonitor.findOne({
            where: { userId, churchId }
        });

        if (existingMonitor) {
            // Move old class membership to history if it was a manual (monitor) assignment
            await db.SundaySchoolMember.update(
                { level: 'non-actuel', leftAt: new Date() },
                {
                    where: {
                        userId,
                        sundaySchoolId: existingMonitor.classId,
                        assignmentType: 'manual',
                        level: 'Actuel'
                    },
                    transaction
                }
            );
            // Delete the old monitor assignment
            await existingMonitor.destroy({ transaction });
        }

        // 2. Create the new monitor assignment
        const monitor = await db.SundaySchoolMonitor.create({
            userId,
            classId,
            role,
            churchId
        }, { transaction });

        // 3. Ensure they are an active member of the new class
        // Check if already an active member (could be automatic or manual)
        const existingMember = await db.SundaySchoolMember.findOne({
            where: { userId, sundaySchoolId: classId }
        });

        if (existingMember) {
            await existingMember.update({
                level: 'Actuel',
                leftAt: null,
                assignmentType: 'manual' // Ensure it's manual now that they are a monitor
            }, { transaction });
        } else {
            await db.SundaySchoolMember.create({
                userId,
                sundaySchoolId: classId,
                level: 'Actuel',
                assignmentType: 'manual',
                joinedAt: new Date()
            }, { transaction });
        }

        await transaction.commit();
        res.status(201).json(monitor);
    } catch (err) {
        await transaction.rollback();
        console.error("Assign monitor error:", err);
        res.status(500).json({ message: "Erreur lors de l'assignation." });
    }
};

exports.removeMonitor = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params; // Monitor assignment ID
        const churchId = req.church.id;

        const monitor = await db.SundaySchoolMonitor.findOne({
            where: { id, churchId }
        });

        if (!monitor) {
            await transaction.rollback();
            return res.status(404).json({ message: "Assignation non trouvée." });
        }

        // Move class membership to history
        await db.SundaySchoolMember.update(
            { level: 'non-actuel', leftAt: new Date() },
            {
                where: {
                    userId: monitor.userId,
                    sundaySchoolId: monitor.classId,
                    assignmentType: 'manual',
                    level: 'Actuel'
                },
                transaction
            }
        );

        // Clear teacherId from class if this person was the primary teacher
        await db.SundaySchool.update(
            { teacherId: null },
            {
                where: { id: monitor.classId, teacherId: monitor.userId, churchId },
                transaction
            }
        );

        await monitor.destroy({ transaction });

        await transaction.commit();
        res.json({ message: "Moniteur retiré et membre archivé." });
    } catch (err) {
        await transaction.rollback();
        console.error("Remove monitor error:", err);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};

exports.updateMonitor = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { classId, role } = req.body;
        const churchId = req.church.id;

        const monitor = await db.SundaySchoolMonitor.findOne({
            where: { id, churchId }
        });

        if (!monitor) {
            await transaction.rollback();
            return res.status(404).json({ message: "Moniteur non trouvé." });
        }

        const oldClassId = monitor.classId;
        const userId = monitor.userId;

        // 1. If class changed, handle membership transition
        if (classId && classId !== oldClassId) {
            // Demote old membership
            await db.SundaySchoolMember.update(
                { level: 'non-actuel', leftAt: new Date() },
                {
                    where: {
                        userId,
                        sundaySchoolId: oldClassId,
                        assignmentType: 'manual',
                        level: 'Actuel'
                    },
                    transaction
                }
            );

            // Clear teacherId from old class if they were the primary teacher
            await db.SundaySchool.update(
                { teacherId: null },
                {
                    where: { id: oldClassId, teacherId: userId, churchId },
                    transaction
                }
            );

            // Update teacherId on new class
            await db.SundaySchool.update(
                { teacherId: userId },
                {
                    where: { id: classId, churchId },
                    transaction
                }
            );

            // Ensure they are active in the new class
            const existingMember = await db.SundaySchoolMember.findOne({
                where: { userId, sundaySchoolId: classId },
                transaction
            });

            if (existingMember) {
                await existingMember.update({
                    level: 'Actuel',
                    leftAt: null,
                    assignmentType: 'manual'
                }, { transaction });
            } else {
                await db.SundaySchoolMember.create({
                    userId,
                    sundaySchoolId: classId,
                    level: 'Actuel',
                    assignmentType: 'manual',
                    joinedAt: new Date()
                }, { transaction });
            }
        }

        // 2. Update the monitor record
        await monitor.update(req.body, { transaction });

        await transaction.commit();
        res.json({ message: "Moniteur mis à jour avec succès." });
    } catch (err) {
        await transaction.rollback();
        console.error("Update monitor error:", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour." });
    }
};

// Attendance
exports.markAttendance = async (req, res) => {
    try {
        const { classId, date, attendances } = req.body; // attendances: [{userId, status, notes}]

        const bulkData = attendances.map(a => ({
            classId,
            date,
            userId: a.userId,
            status: a.status,
            notes: a.notes,
            monitorId: req.user.id
        }));

        // Delete existing for the same date/class if any to allow updates
        await db.SundaySchoolAttendance.destroy({ where: { classId, date } });
        await db.SundaySchoolAttendance.bulkCreate(bulkData);

        res.json({ message: "Présences enregistrées." });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de l'enregistrement des présences." });
    }
};

// Reports
exports.submitReport = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { attendance, ...reportData } = req.body;
        console.log("[SundaySchool] submitReport received payload:", JSON.stringify({ ...reportData, attendanceCount: attendance?.length }));

        const submittedById = reportData.submittedById || req.user.id;
        console.log("[SundaySchool] Determined submittedById:", submittedById);

        const report = await db.SundaySchoolReport.create({
            ...reportData,
            churchId: req.church.id,
            submittedById
        }, { transaction });

        console.log("[SundaySchool] Created report ID:", report.id, "with submittedById:", report.submittedById);

        // If attendance array is provided, create attendance records
        if (attendance && Array.isArray(attendance)) {
            const attendanceRecords = attendance.map(a => ({
                classId: reportData.classId,
                userId: a.userId,
                date: reportData.date || new Date().toISOString().split('T')[0],
                status: a.status,
                monitorId: submittedById,
                churchId: req.church.id,
                reportId: report.id
            }));
            await db.SundaySchoolAttendance.bulkCreate(attendanceRecords, { transaction });
            console.log("[SundaySchool] Created", attendanceRecords.length, "attendance records for reportId:", report.id);
        }

        await transaction.commit();
        res.status(201).json(report);
    } catch (err) {
        await transaction.rollback();
        console.error("Report submit error:", err);
        res.status(500).json({ message: "Erreur lors de la soumission du rapport." });
    }
};

exports.getReports = async (req, res) => {
    try {
        const { classId } = req.query;
        let where = { churchId: req.church.id };
        if (classId) where.classId = classId;

        const reports = await db.SundaySchoolReport.findAll({
            where,
            include: [
                { model: db.SundaySchool, as: 'class', attributes: ['name'] },
                { model: db.User, as: 'submittedBy', attributes: ['firstName', 'lastName'] }
            ],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des rapports." });
    }
};

exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await db.SundaySchoolReport.findOne({
            where: { id, churchId: req.church.id },
            include: [
                { model: db.SundaySchool, as: 'class', attributes: ['name'] },
                { model: db.User, as: 'submittedBy', attributes: ['firstName', 'lastName'] }
            ]
        });

        if (!report) return res.status(404).json({ message: "Rapport non trouvé." });

        // Access Control: Check if user has permission or is a member of this class
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('superaduser') || userRoles.includes('superintendent');
        let isMonitor = false;
        let isMember = false;

        if (!isAdmin) {
            // Check if user is a monitor of this class
            const monitorCheck = await db.SundaySchoolMonitor.findOne({
                where: { userId: req.user.id, classId: report.classId, churchId: req.church.id }
            });
            isMonitor = !!monitorCheck;

            if (!isMonitor) {
                // Check if user is an active member of this class
                const memberCheck = await db.SundaySchoolMember.findOne({
                    where: { userId: req.user.id, sundaySchoolId: report.classId, level: 'Actuel' }
                });
                isMember = !!memberCheck;

                if (!isMember) {
                    return res.status(403).json({ message: "Vous n'avez pas accès à ce rapport." });
                }
            }
        }

        // Fetch attendance specifically for this report
        // Only return attendance list to Admins or Monitors
        let attendance = [];
        const canManage = isAdmin || isMonitor;

        if (canManage) {
            attendance = await db.SundaySchoolAttendance.findAll({
                where: {
                    reportId: report.id,
                    churchId: req.church.id
                },
                include: [{ model: db.User, as: 'user', attributes: ['firstName', 'lastName', 'memberCode'] }]
            });
        }

        res.json({
            report,
            attendance,
            canExport: canManage,
            canViewAttendance: canManage
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération du rapport." });
    }
};

exports.updateReport = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { attendance, ...reportData } = req.body;

        const report = await db.SundaySchoolReport.findOne({
            where: { id, churchId: req.church.id },
            transaction
        });

        if (!report) {
            await transaction.rollback();
            return res.status(404).json({ message: "Rapport non trouvé." });
        }

        const submittedById = reportData.submittedById || report.submittedById;

        // 1. Update Report Data
        await report.update({
            ...reportData,
            submittedById
        }, { transaction });

        // 2. Update Attendance if provided
        if (attendance && Array.isArray(attendance)) {
            // Delete old attendance for this report
            await db.SundaySchoolAttendance.destroy({
                where: { reportId: id, churchId: req.church.id },
                transaction
            });

            // Re-create attendance
            const attendanceRecords = attendance.map(a => ({
                classId: report.classId,
                userId: a.userId,
                date: report.date,
                status: a.status,
                monitorId: submittedById,
                churchId: req.church.id,
                reportId: report.id
            }));
            await db.SundaySchoolAttendance.bulkCreate(attendanceRecords, { transaction });
        }

        await transaction.commit();
        res.json(report);
    } catch (err) {
        await transaction.rollback();
        console.error("Report update error:", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du rapport." });
    }
};

exports.deleteReport = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        console.log(`[SundaySchool] Attempting to delete report ID: ${id} for church: ${req.church?.id}`);

        const report = await db.SundaySchoolReport.findOne({
            where: { id, churchId: req.church.id },
            transaction
        });

        if (!report) {
            console.warn(`[SundaySchool] Report not found or unauthorized: ${id}`);
            await transaction.rollback();
            return res.status(404).json({ message: "Rapport non trouvé." });
        }

        // 1. Delete associated attendance
        // We delete by reportId AND fallback to (classId + date) for old reports
        const attendanceDeleted = await db.SundaySchoolAttendance.destroy({
            where: {
                [Op.or]: [
                    { reportId: id },
                    { classId: report.classId, date: report.date }
                ],
                churchId: req.church.id
            },
            transaction
        });
        console.log(`[SundaySchool] Deleted ${attendanceDeleted} attendance records for report ${id}`);

        // 2. Delete Report
        await report.destroy({ transaction });
        console.log(`[SundaySchool] Report ${id} deleted successfully.`);

        await transaction.commit();
        res.json({ message: "Rapport supprimé avec succès." });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Report delete error:", err);
        res.status(500).json({ message: "Erreur lors de la suppression du rapport." });
    }
};

exports.deleteAllReports = async (req, res) => {
    console.log(">>> [SundaySchool] Entered deleteAllReports controller");
    let transaction;
    try {
        const { classId } = req.params;
        const churchId = req.church.id;

        if (!classId) {
            console.error("[SundaySchool] Bulk delete failed: classId missing");
            return res.status(400).json({ message: "ID de classe manquant." });
        }

        const targetClassId = parseInt(classId, 10);
        console.log(`[SundaySchool] Starting bulk delete for classId: ${targetClassId}, church: ${churchId}`);

        // 1. Find reports
        const reports = await db.SundaySchoolReport.findAll({
            where: { classId: targetClassId, churchId },
            attributes: ['id', 'date']
        });

        if (!reports || reports.length === 0) {
            console.log("[SundaySchool] No reports found to delete.");
            return res.json({ message: "Aucun rapport à supprimer." });
        }

        const reportIds = reports.map(r => r.id);
        const reportDates = reports.map(r => r.date);
        console.log(`[SundaySchool] Found ${reportIds.length} reports. IDs: ${reportIds.join(',')}`);

        // Use a transaction for the actual deletion
        transaction = await db.sequelize.transaction();

        // 2. Delete attendance by reportIds
        let attCount = await db.SundaySchoolAttendance.destroy({
            where: {
                reportId: { [Op.in]: reportIds },
                churchId
            },
            transaction
        });
        console.log(`[SundaySchool] Deleted ${attCount} attendances by reportId.`);

        // 3. Delete attendance by dates (fallback for old data)
        let attCountDate = await db.SundaySchoolAttendance.destroy({
            where: {
                classId: targetClassId,
                date: { [Op.in]: reportDates },
                churchId
            },
            transaction
        });
        console.log(`[SundaySchool] Deleted ${attCountDate} attendances by date.`);

        // 4. Delete the reports
        const reportsDeleted = await db.SundaySchoolReport.destroy({
            where: {
                id: { [Op.in]: reportIds },
                churchId
            },
            transaction
        });
        console.log(`[SundaySchool] Deleted ${reportsDeleted} reports.`);

        await transaction.commit();
        res.json({ message: `${reportsDeleted} rapports supprimés.` });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("[SundaySchool] Bulk delete ERROR:", err);
        res.status(500).json({
            message: "Erreur lors de la suppression massive.",
            error: err.message
        });
    }
};

// Dashboard Stats
exports.getStats = async (req, res) => {
    try {
        const churchId = req.church.id;
        const user = req.user;
        const roles = Array.isArray(user.role) ? user.role : [user.role];
        const isMonitorOnly = roles.includes('monitor') && !roles.includes('admin') && !roles.includes('super_admin');

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find assigned classes for monitors
        let assignedClassIds = [];
        if (isMonitorOnly) {
            const assignments = await db.SundaySchoolMonitor.findAll({
                where: { userId: user.id, churchId }
            });
            assignedClassIds = assignments.map(a => a.classId).filter(id => id !== null);
        }

        const classFilter = isMonitorOnly ? { id: assignedClassIds, churchId } : { churchId };
        const memberClassInclude = { model: db.SundaySchool, as: 'sundaySchool', where: classFilter };
        const attendanceClassInclude = { model: db.SundaySchool, as: 'class', where: classFilter };

        // 1. Basic Counts
        const totalMembers = await db.SundaySchoolMember.count({
            include: [memberClassInclude]
        });
        const activeClassesCount = await db.SundaySchool.count({ where: classFilter });
        const totalMonitorsCount = isMonitorOnly ? 1 : await db.SundaySchoolMonitor.count({ where: { churchId } });

        // 2. New Members this month
        const newMembersThisMonth = await db.SundaySchoolMember.count({
            where: { createdAt: { [Op.gte]: startOfMonth } },
            include: [memberClassInclude]
        });

        // 3. Attendance Rate (Last 7 Days)
        const recentAttendance = await db.SundaySchoolAttendance.findAll({
            where: { date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] } },
            include: [attendanceClassInclude]
        });

        let attendanceRate = 0;
        if (recentAttendance.length > 0) {
            const presents = recentAttendance.filter(a => a.status === 'present').length;
            attendanceRate = Math.round((presents / recentAttendance.length) * 100);
        }

        // 4. Weekly Trend (Last 8 Weeks)
        const weeklyTrend = [];
        for (let i = 7; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            const endStr = date.toISOString().split('T')[0];
            const startStr = new Date(date);
            startStr.setDate(date.getDate() - 7);
            const startString = startStr.toISOString().split('T')[0];

            const count = await db.SundaySchoolAttendance.count({
                where: {
                    date: { [Op.between]: [startString, endStr] },
                    status: 'present'
                },
                include: [attendanceClassInclude]
            });
            weeklyTrend.push({
                name: `W-${i}`,
                present: count
            });
        }

        // 5. Classes without Monitors (Only for Committee)
        let missingMonitorsCount = 0;
        let missingReportsCount = 0;
        if (!isMonitorOnly) {
            const classesWithMonitors = await db.SundaySchoolMonitor.findAll({
                where: { churchId },
                attributes: ['classId']
            });
            const classIdsWithMonitorsSet = new Set(classesWithMonitors.map(m => m.classId));
            missingMonitorsCount = await db.SundaySchool.count({
                where: {
                    churchId,
                    id: { [Op.notIn]: [...classIdsWithMonitorsSet].filter(id => id !== null) }
                }
            });

            // Calculate Missing Reports for Last Sunday
            const lastSunday = new Date();
            lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay()); // Go to last Sunday
            const lastSundayStr = lastSunday.toISOString().split('T')[0];

            const reportsLastSunday = await db.SundaySchoolReport.findAll({
                where: { date: lastSundayStr, churchId },
                attributes: ['classId']
            });
            const reportedClassIds = new Set(reportsLastSunday.map(r => r.classId));

            missingReportsCount = await db.SundaySchool.count({
                where: {
                    churchId,
                    id: { [Op.notIn]: [...reportedClassIds].filter(id => id !== null) }
                }
            });
        }

        // 6. Transition Alerts (Age Based)
        const classMembers = await db.SundaySchoolMember.findAll({
            include: [
                memberClassInclude,
                { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'birthDate'] }
            ]
        });

        const transitionsDue = classMembers.filter(m => {
            const age = calculateAge(m.user.birthDate);
            const cls = m.sundaySchool;
            if (cls.maxAge && age > cls.maxAge) return true;
            return false;
        }).map(m => ({
            id: m.user.id,
            name: `${m.user.firstName} ${m.user.lastName}`,
            currentClass: m.sundaySchool.name,
            age: calculateAge(m.user.birthDate),
            reason: 'Age exceeded'
        }));

        // 7. Class Stats for Pie Chart
        const classStats = await db.SundaySchool.findAll({
            where: classFilter,
            attributes: [
                'id', 'name',
                [db.sequelize.fn('COUNT', db.sequelize.col('classMembers.id')), 'memberCount']
            ],
            include: [{ association: 'classMembers', attributes: [] }],
            group: ['sunday_school.id']
        });

        // 8. Recent Activity
        const recentReports = await db.SundaySchoolReport.findAll({
            where: classFilter,
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: db.SundaySchool, as: 'class', attributes: ['name'] }]
        });

        const recentMemberJoins = await db.SundaySchoolMember.findAll({
            include: [
                memberClassInclude,
                { model: db.User, as: 'user', attributes: ['firstName', 'lastName'] }
            ],
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        const activity = [];
        recentReports.forEach(r => {
            activity.push({
                type: 'report',
                icon: '📝',
                text: `Rapport soumis pour ${r.class?.name || 'Classe'}`,
                time: r.createdAt,
                date: r.date
            });
        });
        recentMemberJoins.forEach(m => {
            activity.push({
                type: 'member',
                icon: '👤',
                text: `${m.user?.firstName} ${m.user?.lastName} a rejoint ${m.sundaySchool?.name || 'la classe'}`,
                time: m.createdAt
            });
        });

        const sortedActivity = activity.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        res.json({
            kpis: {
                totalMembers,
                activeClasses: activeClassesCount,
                totalMonitors: totalMonitorsCount,
                attendanceRate,
                newMembersThisMonth,
                transitionsDueCount: transitionsDue.length
            },
            weeklyTrend,
            classStats,
            transitionsDue: isMonitorOnly ? [] : transitionsDue,
            alerts: {
                missingMonitorsCount,
                missingReportsCount
            },
            recentActivity: sortedActivity
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
    }
};

// My Data (For Members)
exports.getMyAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        const attendance = await db.SundaySchoolAttendance.findAll({
            where: { userId, churchId: req.church.id },
            include: [
                { model: db.SundaySchool, as: 'class', attributes: ['id', 'name'] },
                { model: db.User, as: 'monitor', attributes: ['firstName', 'lastName'] },
                { model: db.SundaySchoolReport, as: 'report', attributes: ['id', 'lessonTitle', 'title'] }
            ],
            order: [['date', 'DESC']]
        });
        res.json(attendance);
    } catch (err) {
        console.error("getMyAttendance error:", err);
        res.status(500).json({ message: "Erreur lors de la récupération de vos présences." });
    }
};

exports.getMyClassReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const churchId = req.church.id;

        // Find classes where the user is an active member
        const assignments = await db.SundaySchoolMember.findAll({
            where: { userId, level: 'Actuel' },
            attributes: ['sundaySchoolId']
        });

        const classIds = assignments.map(a => a.sundaySchoolId);

        if (classIds.length === 0) {
            return res.json([]);
        }

        const reports = await db.SundaySchoolReport.findAll({
            where: {
                classId: { [Op.in]: classIds },
                churchId
            },
            include: [
                { model: db.SundaySchool, as: 'class', attributes: ['name'] },
                { model: db.User, as: 'submittedBy', attributes: ['firstName', 'lastName'] }
            ],
            order: [['date', 'DESC']]
        });

        res.json(reports);
    } catch (err) {
        console.error("getMyClassReports error:", err);
        res.status(500).json({ message: "Erreur lors de la récupération des rapports de classe." });
    }
};

// Wrapper for auto-assignment to be called from other controllers (e.g., User update)
exports.assignMemberToClasses = async (userId, churchId) => {
    return await assignMemberToClassesInternal(userId, churchId);
};
