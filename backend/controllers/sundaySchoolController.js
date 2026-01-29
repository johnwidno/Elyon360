const db = require("../models");
const { Op } = require("sequelize");

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
                if (!acceptedStatuses.includes(userMarital)) {
                    match = false;
                }
            }

            // 3. Baptismal / Category criteria
            if (cls.memberCategoryId && user.memberCategoryId !== cls.memberCategoryId) {
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

            // 5. Active Status criteria
            if (cls.activeOnly) {
                if (user.status !== 'Actif' && user.status !== 'Active') match = false;
            }

            if (match) {
                classesToJoin.push(cls.id);
            }
        }

        // Sync Assignments
        const currentAssignments = await db.SundaySchoolMember.findAll({
            where: { userId, assignmentType: 'automatic' }
        });

        const currentClassIds = currentAssignments.map(a => a.sundaySchoolId);
        const toAdd = classesToJoin.filter(id => !currentClassIds.includes(id));
        const toRemove = currentClassIds.filter(id => !classesToJoin.includes(id));

        // Mark removed assignments as inactive (preserve history)
        if (toRemove.length > 0) {
            await db.SundaySchoolMember.update(
                { status: 'inactive' },
                { where: { userId, sundaySchoolId: toRemove, assignmentType: 'automatic' } }
            );
        }

        // Reactivate existing assignments that still match criteria
        const toReactivate = classesToJoin.filter(id => currentClassIds.includes(id));
        if (toReactivate.length > 0) {
            await db.SundaySchoolMember.update(
                { status: 'active' },
                { where: { userId, sundaySchoolId: toReactivate, assignmentType: 'automatic' } }
            );
        }

        // Add new assignments as active
        if (toAdd.length > 0) {
            const bulkAdd = toAdd.map(classId => ({
                userId,
                sundaySchoolId: classId,
                assignmentType: 'automatic',
                status: 'active',
                joinedAt: new Date()
            }));
            await db.SundaySchoolMember.bulkCreate(bulkAdd);
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
                { association: 'classMembers', attributes: ['id', 'firstName', 'lastName'] },
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
                    include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
                },
                {
                    association: 'classMembers',
                    attributes: ['id', 'firstName', 'lastName', 'memberCode', 'birthDate', 'role', 'status', 'email', 'phone', 'baptismalStatus'],
                    include: [
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
    try {
        const newClass = await db.SundaySchool.create({ ...req.body, churchId: req.church.id });

        // Trigger auto-assignment for all members if dynamic
        if (newClass.isDynamic) {
            const users = await db.User.findAll({ where: { churchId: req.church.id } });
            for (const user of users) {
                await assignMemberToClassesInternal(user.id, req.church.id);
            }
        }

        res.status(201).json(newClass);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la création." });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        await db.SundaySchool.update(req.body, { where: { id, churchId: req.church.id } });

        // Refresh auto-assignments
        const users = await db.User.findAll({ where: { churchId: req.church.id } });
        for (const user of users) {
            await assignMemberToClassesInternal(user.id, req.church.id);
        }

        res.json({ message: "Classe mise à jour." });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la mise à jour." });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        await db.SundaySchool.destroy({ where: { id, churchId: req.church.id } });
        res.json({ message: "Classe supprimée." });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression." });
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
    try {
        const monitor = await db.SundaySchoolMonitor.create({ ...req.body, churchId: req.church.id });
        res.status(201).json(monitor);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de l'assignation." });
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

        const report = await db.SundaySchoolReport.create({
            ...reportData,
            churchId: req.church.id,
            submittedById: req.user.id
        }, { transaction });

        // If attendance array is provided, create attendance records
        if (attendance && Array.isArray(attendance)) {
            const attendanceRecords = attendance.map(a => ({
                classId: reportData.classId,
                userId: a.userId,
                date: reportData.date || new Date().toISOString().split('T')[0],
                status: a.status,
                monitorId: req.user.id,
                churchId: req.church.id
            }));
            await db.SundaySchoolAttendance.bulkCreate(attendanceRecords, { transaction });
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

        // Also fetch attendance for this class on this date
        const attendance = await db.SundaySchoolAttendance.findAll({
            where: {
                classId: report.classId,
                date: report.date,
                churchId: req.church.id
            },
            include: [{ model: db.User, as: 'user', attributes: ['firstName', 'lastName', 'memberCode'] }]
        });

        res.json({ report, attendance });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération du rapport." });
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

// Wrapper for auto-assignment to be called from other controllers (e.g., User update)
exports.assignMemberToClasses = async (userId, churchId) => {
    return await assignMemberToClassesInternal(userId, churchId);
};
