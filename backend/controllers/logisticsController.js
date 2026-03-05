const db = require("../models");
const Building = db.Building;
const Room = db.Room;
const Reservation = db.Reservation;
const InventoryItem = db.InventoryItem;
const MaintenanceLog = db.MaintenanceLog;
const { Op } = require("sequelize");
const roomScheduler = require('../services/roomScheduler');

exports.getDashboardStats = async (req, res) => {
    try {
        const churchId = req.church.id;
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        // 1. Basic Counts
        const totalBuildings = await Building.count({ where: { churchId } });
        const totalRooms = await Room.count({ where: { churchId } });
        const roomsInMaintenance = await Room.count({ where: { churchId, status: 'maintenance' } });
        const activeRooms = totalRooms - roomsInMaintenance;

        // 2. Reservation Stats
        const todaysReservations = await Reservation.count({
            where: {
                churchId,
                startTime: { [Op.between]: [startOfDay, endOfDay] },
                status: 'confirmed'
            }
        });

        const weeklyReservations = await Reservation.count({
            where: {
                churchId,
                startTime: { [Op.gte]: startOfWeek },
                status: 'confirmed'
            }
        });

        const activeReservations = await Reservation.count({
            where: {
                churchId,
                startTime: { [Op.lte]: new Date() },
                endTime: { [Op.gte]: new Date() },
                status: 'confirmed'
            }
        });

        // 3. Equipment Stats breakdown
        const totalResources = await InventoryItem.count({ where: { churchId } });
        const equipmentStatus = await InventoryItem.findAll({
            where: { churchId },
            attributes: ['status', [db.sequelize.fn('COUNT', 'status'), 'count']],
            group: ['status']
        });

        // 4. Space Distribution (by Building)
        const spaceDistribution = await Room.findAll({
            where: { churchId },
            include: [{ model: Building, attributes: ['name'] }],
            attributes: ['buildingId', [db.sequelize.fn('COUNT', 'rooms.id'), 'count']],
            group: ['buildingId', 'building.id', 'building.name'] // Grouping by building
        });

        // 5. Reservation History (Last 6 months)
        const historyData = await Reservation.findAll({
            where: {
                churchId,
                startTime: { [Op.gte]: sixMonthsAgo }
            },
            attributes: [
                [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('startTime'), '%Y-%m'), 'month'],
                [db.sequelize.fn('COUNT', 'id'), 'count']
            ],
            group: ['month'],
            order: [['month', 'ASC']]
        });

        // ================= ALERTS ================= //

        // A. Maintenance Requests
        const maintenanceRequests = await MaintenanceLog.count({
            where: {
                churchId,
                status: { [Op.in]: ['reported', 'in_progress'] }
            }
        });

        // B. Conflicts (Overlapping Reservations)
        // This is a simplified check. A full check would require complex self-joins or looping.
        // For dashboard, we might checking "today's" conflicts or flagged ones?
        // Let's assume we find reservations that overlap with OTHERS in the future.
        // Doing a heavy query might be slow. Let's look for "double booked" rooms for *active* or *future* bookings.

        /* 
           Simplified approach for "Conflicts":
           This is tricky to do in one query without performance hit. 
           We'll skip complex conflict query for now and mock it or rely on a 'conflict' flag if we had one.
           Alternatively, fetch upcoming reservations and check overlaps in JS (limit to 50?).
        */
        const upcomingReservations = await Reservation.findAll({
            where: {
                churchId,
                startTime: { [Op.gte]: new Date() },
                status: 'confirmed'
            },
            order: [['startTime', 'ASC']],
            limit: 50
        });

        let conflicts = 0;
        // Simple in-memory overlap check for the immediate upcoming 50
        for (let i = 0; i < upcomingReservations.length; i++) {
            for (let j = i + 1; j < upcomingReservations.length; j++) {
                const r1 = upcomingReservations[i];
                const r2 = upcomingReservations[j];
                if (r1.roomId === r2.roomId && r1.roomId !== null) { // Same room
                    if (r1.endTime > r2.startTime && r1.startTime < r2.endTime) {
                        conflicts++;
                    }
                }
            }
        }

        // C. No Responsible Person
        const noResponsible = await Reservation.count({
            where: {
                churchId,
                organizerId: null,
                status: 'confirmed',
                startTime: { [Op.gte]: new Date() }
            }
        });

        // D. Capacity Overflow
        // Join Reservation with Room and compare expectedAttendees > room.capacity
        const capacityOverflows = await Reservation.count({
            where: {
                churchId,
                status: 'confirmed',
                startTime: { [Op.gte]: new Date() },
                expectedAttendees: { [Op.ne]: null }
            },
            include: [{
                model: Room,
                required: true,
                where: {
                    capacity: { [Op.ne]: null }
                }
            }]
        });

        // Note: The above count might not actually check the condition `expectedAttendees > capacity`.
        // Sequelize `where` on joined columns with direct comparison is tricky.
        // We'll fetch them and filter in JS for accuracy on this small dataset for dashboard.
        const capacityCheckList = await Reservation.findAll({
            where: {
                churchId,
                status: 'confirmed',
                startTime: { [Op.gte]: new Date() }
            },
            include: [{ model: Room, required: true }],
            limit: 100 // Safety limit
        });

        const realCapacityOverflows = capacityCheckList.filter(r =>
            r.expectedAttendees && r.room && r.room.capacity && r.expectedAttendees > r.room.capacity
        ).length;

        // E. Maintenance Blocking Activity
        // Find reservations in rooms that are currently in 'maintenance' status
        const maintenanceBlocking = await Reservation.count({
            where: {
                churchId,
                status: 'confirmed',
                startTime: { [Op.gte]: new Date() }
            },
            include: [{
                model: Room,
                where: { status: 'maintenance' },
                required: true
            }]
        });

        res.status(200).json({
            overview: {
                totalBuildings,
                totalRooms,
                roomsAvailable: activeRooms,
                roomsInMaintenance,

                todaysReservations,
                weeklyReservations,
                activeReservations,

                totalResources,
                // Simplify equipment status for frontend
                equipmentAvailable: equipmentStatus.find(e => e.status === 'bon_etat')?.dataValues.count || 0,
                equipmentRepair: equipmentStatus.find(e => e.status === 'reparer')?.dataValues.count || 0,
                equipmentBroken: equipmentStatus.find(e => e.status === 'hors_service')?.dataValues.count || 0,

                maintenanceRequests,

                // Charts Data
                spaceDistribution: spaceDistribution.map(s => ({
                    name: s.building ? s.building.name : 'Autre',
                    value: parseInt(s.dataValues.count)
                })),

                reservationHistory: historyData.map(h => ({
                    month: h.dataValues.month,
                    bookings: parseInt(h.dataValues.count)
                })),

                // Alerts
                alerts: {
                    conflicts,
                    noResponsible,
                    capacityOverflow: realCapacityOverflows,
                    maintenanceBlocking
                }
            }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.checkAvailability = async (req, res) => {
    try {
        const { roomId, date, startTime, endTime, excludeId, type } = req.body;
        const result = await roomScheduler.checkRoomAvailability({
            churchId: req.church.id,
            roomId,
            date,
            startTime,
            endTime,
            excludeId,
            type
        });
        res.json(result);
    } catch (err) {
        console.error("Check Availability Error:", err);
        res.status(500).json({ message: "Erreur serveur lors de la vérification de disponibilité." });
    }
};
